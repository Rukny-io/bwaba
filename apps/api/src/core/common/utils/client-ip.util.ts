import type { Request } from 'express';
import { TrustedProxyResolver } from './cloudflare-ip.guard';

type HeaderSource = Pick<Request, 'headers' | 'ip' | 'socket'>;

function headerValue(
  headers: Request['headers'],
  name: string,
): string | null {
  const raw = headers[name.toLowerCase()];
  if (!raw) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || null;
}

/** Normalize IPv4-mapped IPv6 (::ffff:192.168.x.x) for stable comparisons. */
function normalizeIp(ip: string): string {
  const clean = ip.trim().replace(/^::ffff:/i, '');
  if (clean === '::1' || clean === '0:0:0:0:0:0:0:1' || clean === 'localhost') {
    return '127.0.0.1';
  }
  return clean;
}

/** The raw TCP peer address — the only value an attacker cannot forge. */
function socketIp(req: HeaderSource): string {
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

/**
 * 🔒 F-11: Resolve the real client IP, trusting forwarding headers ONLY when the
 * request arrives from a trusted proxy hop (Cloudflare range or configured CIDR).
 *
 * - `cloudflare` mode: trust `CF-Connecting-IP` iff the socket peer is Cloudflare.
 * - `xff` mode: trust the first `X-Forwarded-For` hop iff the socket peer is a
 *   configured trusted proxy (`TRUSTED_PROXY_CIDRS`).
 * - Otherwise: fall back to the un-forgeable socket peer IP.
 *
 * This prevents attackers from rotating headers to bypass rate limiting/lockout.
 */
export function getClientIp(req: HeaderSource): string {
  const peer = socketIp(req);
  const trusted = TrustedProxyResolver.isTrustedProxy(peer);

  if (trusted) {
    const cfConnecting = headerValue(req.headers, 'cf-connecting-ip');
    if (cfConnecting) return normalizeIp(cfConnecting);

    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return normalizeIp(forwarded.split(',')[0].trim());
    }
    if (Array.isArray(forwarded) && forwarded[0]) {
      return normalizeIp(forwarded[0].split(',')[0].trim());
    }
  }

  // Not behind a trusted proxy (or none mode): only the socket peer is reliable.
  return normalizeIp(peer);
}

export function hasCloudflareGeoHeaders(req: HeaderSource): boolean {
  return Boolean(headerValue(req.headers, 'cf-ipcountry'));
}
