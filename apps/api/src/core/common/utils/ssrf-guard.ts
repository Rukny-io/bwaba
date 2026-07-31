import { BadRequestException } from '@nestjs/common';
import { lookup } from 'dns/promises';
import { isIP } from 'net';

/**
 * 🔒 SSRF Guard
 *
 * Utilities to safely fetch user-supplied URLs without exposing the server to
 * Server-Side Request Forgery (cloud metadata, localhost, internal networks).
 *
 * Protections:
 * - Only http/https schemes are allowed.
 * - Embedded credentials (user:pass@host) are rejected.
 * - The hostname is DNS-resolved and every resolved IP is checked against
 *   private / loopback / link-local / reserved ranges (blocks DNS rebinding
 *   and IP-literal bypasses like 169.254.169.254).
 * - Redirects are followed manually, re-validating each hop.
 */

const MAX_REDIRECTS = 3;

/** Convert an IPv4 dotted string to a 32-bit integer. */
function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  return (
    ((parts[0] << 24) >>> 0) +
    (parts[1] << 16) +
    (parts[2] << 8) +
    parts[3]
  );
}

function isPrivateIPv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  const inRange = (base: string, bits: number): boolean => {
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (n & mask) === (ipv4ToInt(base) & mask);
  };
  return (
    inRange('0.0.0.0', 8) || // "this" network
    inRange('10.0.0.0', 8) || // private
    inRange('100.64.0.0', 10) || // CGNAT
    inRange('127.0.0.0', 8) || // loopback
    inRange('169.254.0.0', 16) || // link-local (cloud metadata)
    inRange('172.16.0.0', 12) || // private
    inRange('192.0.0.0', 24) || // IETF protocol assignments
    inRange('192.0.2.0', 24) || // TEST-NET-1
    inRange('192.168.0.0', 16) || // private
    inRange('198.18.0.0', 15) || // benchmarking
    inRange('198.51.100.0', 24) || // TEST-NET-2
    inRange('203.0.113.0', 24) || // TEST-NET-3
    inRange('224.0.0.0', 4) || // multicast
    inRange('240.0.0.0', 4) // reserved
  );
}

function isPrivateIPv6(ip: string): boolean {
  const addr = ip.toLowerCase().split('%')[0]; // strip zone id

  // IPv4-mapped IPv6 (::ffff:a.b.c.d) — validate the embedded IPv4
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) {
    return isPrivateIPv4(mapped[1]);
  }

  return (
    addr === '::1' || // loopback
    addr === '::' || // unspecified
    addr.startsWith('fc') || // unique local fc00::/7
    addr.startsWith('fd') ||
    addr.startsWith('fe8') || // link-local fe80::/10
    addr.startsWith('fe9') ||
    addr.startsWith('fea') ||
    addr.startsWith('feb') ||
    addr.startsWith('ff') // multicast
  );
}

function isPrivateIp(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return isPrivateIPv4(ip);
  if (family === 6) return isPrivateIPv6(ip);
  return true; // unknown format → treat as unsafe
}

/**
 * Validate a single URL: scheme, credentials, and resolved IP addresses.
 * Throws BadRequestException when the URL is unsafe.
 */
export async function assertUrlSafe(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BadRequestException('Invalid URL format');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new BadRequestException('Only http/https URLs are allowed');
  }

  if (parsed.username || parsed.password) {
    throw new BadRequestException('URLs with credentials are not allowed');
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, ''); // strip IPv6 brackets

  // If the host is an IP literal, validate it directly.
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new BadRequestException('URL resolves to a disallowed address');
    }
    return;
  }

  // Block obvious internal hostnames early.
  const lowerHost = hostname.toLowerCase();
  if (
    lowerHost === 'localhost' ||
    lowerHost.endsWith('.localhost') ||
    lowerHost.endsWith('.internal') ||
    lowerHost.endsWith('.local')
  ) {
    throw new BadRequestException('URL resolves to a disallowed address');
  }

  // Resolve DNS and ensure no resolved address is private/reserved.
  let records: { address: string }[];
  try {
    records = await lookup(hostname, { all: true });
  } catch {
    throw new BadRequestException('Unable to resolve URL host');
  }

  if (!records.length) {
    throw new BadRequestException('Unable to resolve URL host');
  }

  for (const record of records) {
    if (isPrivateIp(record.address)) {
      throw new BadRequestException('URL resolves to a disallowed address');
    }
  }
}

/**
 * Fetch a user-supplied URL with SSRF protection, following redirects manually
 * and re-validating every hop. Returns the final Response.
 */
export async function safeFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  let currentUrl = url;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    await assertUrlSafe(currentUrl);

    const response = await fetch(currentUrl, {
      ...init,
      redirect: 'manual',
    });

    // Follow 3xx redirects manually so each destination is re-validated.
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return response;
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    return response;
  }

  throw new BadRequestException('Too many redirects');
}
