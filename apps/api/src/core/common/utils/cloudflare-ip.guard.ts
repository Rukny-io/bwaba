/**
 * 🔒 F-11 — Trusted Proxy / Cloudflare IP resolver
 *
 * Client-controlled headers (`CF-Connecting-IP`, `X-Forwarded-For`) must only be
 * trusted when the request actually arrives from a trusted proxy hop. Otherwise
 * an attacker rotates these headers to defeat IP-based rate limiting and lockout.
 *
 * Deployment modes (env `TRUSTED_PROXY_MODE`):
 *   - `cloudflare` (default): trust CF-Connecting-IP only when the socket peer IP
 *      is inside Cloudflare's published ranges (refreshed every 24h).
 *   - `xff`: behind a generic L7 proxy (AWS ALB, Nginx). Trust the first
 *      X-Forwarded-For hop only when the socket peer is in `TRUSTED_PROXY_CIDRS`.
 *   - `none`: bare metal / direct exposure. Never trust forwarding headers; use
 *      the socket peer IP.
 *
 * Extra static ranges can always be supplied via `TRUSTED_PROXY_CIDRS`
 * (comma-separated CIDRs), e.g. private ALB subnets.
 */
import { Logger } from '@nestjs/common';

const logger = new Logger('TrustedProxyResolver');

const CLOUDFLARE_V4_URL = 'https://www.cloudflare.com/ips-v4';
const CLOUDFLARE_V6_URL = 'https://www.cloudflare.com/ips-v6';
const REFRESH_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// Cloudflare ranges as a static fallback (used until the live fetch succeeds).
// Source: https://www.cloudflare.com/ips/ — kept as a safety net for cold start.
const CLOUDFLARE_FALLBACK_V4 = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
];
const CLOUDFLARE_FALLBACK_V6 = [
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
];

interface Cidr {
  base: bigint;
  bits: number;
  isV6: boolean;
}

function ipToBigInt(ip: string): { value: bigint; isV6: boolean } | null {
  const clean = ip.trim().replace(/^::ffff:/i, ''); // IPv4-mapped IPv6
  if (clean.includes(':')) {
    // IPv6
    try {
      const parts = expandIpv6(clean);
      let value = 0n;
      for (const part of parts) {
        value = (value << 16n) + BigInt(parseInt(part, 16));
      }
      return { value, isV6: true };
    } catch {
      return null;
    }
  }
  // IPv4
  const octets = clean.split('.');
  if (octets.length !== 4) return null;
  let value = 0n;
  for (const octet of octets) {
    const n = Number(octet);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    value = (value << 8n) + BigInt(n);
  }
  return { value, isV6: false };
}

function expandIpv6(ip: string): string[] {
  // strip zone id
  const addr = ip.split('%')[0];
  const halves = addr.split('::');
  if (halves.length > 2) throw new Error('invalid ipv6');

  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - (head.length + tail.length);
  if (missing < 0 && halves.length === 2) throw new Error('invalid ipv6');

  const groups =
    halves.length === 2
      ? [...head, ...Array(Math.max(missing, 0)).fill('0'), ...tail]
      : head;
  if (groups.length !== 8) throw new Error('invalid ipv6');
  return groups.map((g) => (g === '' ? '0' : g));
}

function parseCidr(cidr: string): Cidr | null {
  const [ip, prefixRaw] = cidr.split('/');
  const parsed = ipToBigInt(ip);
  if (!parsed) return null;
  const totalBits = parsed.isV6 ? 128 : 32;
  const bits = prefixRaw === undefined ? totalBits : Number(prefixRaw);
  if (!Number.isInteger(bits) || bits < 0 || bits > totalBits) return null;
  const hostBits = BigInt(totalBits - bits);
  const base = (parsed.value >> hostBits) << hostBits;
  return { base, bits, isV6: parsed.isV6 };
}

function ipInCidr(ip: string, cidr: Cidr): boolean {
  const parsed = ipToBigInt(ip);
  if (!parsed || parsed.isV6 !== cidr.isV6) return false;
  const totalBits = cidr.isV6 ? 128 : 32;
  const hostBits = BigInt(totalBits - cidr.bits);
  return (parsed.value >> hostBits) << hostBits === cidr.base;
}

class TrustedProxyResolverImpl {
  private cloudflareCidrs: Cidr[] = [];
  private staticCidrs: Cidr[] = [];
  private lastFetch = 0;
  private refreshing: Promise<void> | null = null;

  constructor() {
    this.loadFallback();
    this.loadStaticCidrs();
  }

  private loadFallback() {
    this.cloudflareCidrs = [
      ...CLOUDFLARE_FALLBACK_V4,
      ...CLOUDFLARE_FALLBACK_V6,
    ]
      .map(parseCidr)
      .filter((c): c is Cidr => c !== null);
  }

  private loadStaticCidrs() {
    const raw = process.env.TRUSTED_PROXY_CIDRS;
    if (!raw) return;
    this.staticCidrs = raw
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
      .map(parseCidr)
      .filter((c): c is Cidr => c !== null);
  }

  get mode(): 'cloudflare' | 'xff' | 'none' {
    const m = (process.env.TRUSTED_PROXY_MODE || 'cloudflare').toLowerCase();
    if (m === 'xff' || m === 'none') return m;
    return 'cloudflare';
  }

  /** Prefetch Cloudflare ranges at bootstrap (best-effort). */
  async init(): Promise<void> {
    if (this.mode !== 'cloudflare') return;
    await this.refreshCloudflareRanges();
  }

  private async refreshCloudflareRanges(): Promise<void> {
    if (this.refreshing) return this.refreshing;
    this.refreshing = (async () => {
      try {
        const [v4, v6] = await Promise.all([
          fetch(CLOUDFLARE_V4_URL).then((r) => (r.ok ? r.text() : '')),
          fetch(CLOUDFLARE_V6_URL).then((r) => (r.ok ? r.text() : '')),
        ]);
        const lines = `${v4}\n${v6}`
          .split(/\s+/)
          .map((l) => l.trim())
          .filter(Boolean);
        const parsed = lines
          .map(parseCidr)
          .filter((c): c is Cidr => c !== null);
        if (parsed.length > 0) {
          this.cloudflareCidrs = parsed;
          this.lastFetch = Date.now();
          logger.log(`Loaded ${parsed.length} Cloudflare CIDR ranges`);
        }
      } catch (err) {
        logger.warn(
          `Failed to refresh Cloudflare ranges, using fallback: ${(err as Error).message}`,
        );
      } finally {
        this.refreshing = null;
      }
    })();
    return this.refreshing;
  }

  private maybeRefresh() {
    if (this.mode !== 'cloudflare') return;
    if (Date.now() - this.lastFetch > REFRESH_TTL_MS) {
      // fire-and-forget; current request uses existing/fallback ranges
      void this.refreshCloudflareRanges();
    }
  }

  isTrustedProxy(socketIp: string): boolean {
    if (!socketIp) return false;
    const clean = socketIp.trim().replace(/^::ffff:/i, '');
    // Local BFF (accounts/app → API) connects via loopback; trust its XFF.
    if (
      clean === '127.0.0.1' ||
      clean === '::1' ||
      clean === '0:0:0:0:0:0:0:1' ||
      clean === 'localhost'
    ) {
      return true;
    }
    if (this.staticCidrs.some((c) => ipInCidr(socketIp, c))) return true;
    if (this.mode === 'cloudflare') {
      this.maybeRefresh();
      return this.cloudflareCidrs.some((c) => ipInCidr(socketIp, c));
    }
    return false;
  }
}

export const TrustedProxyResolver = new TrustedProxyResolverImpl();

export function isCloudflareIp(ip: string): boolean {
  return TrustedProxyResolver.isTrustedProxy(ip);
}
