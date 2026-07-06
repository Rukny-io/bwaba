import type { Request } from 'express';

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

/**
 * Resolve the visitor IP behind Cloudflare Proxy, reverse proxies, or direct connections.
 * Priority: CF-Connecting-IP → X-Forwarded-For (first hop) → Express req.ip → socket.
 */
export function getClientIp(req: HeaderSource): string {
  const cfConnecting = headerValue(req.headers, 'cf-connecting-ip');
  if (cfConnecting) return cfConnecting;

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

export function hasCloudflareGeoHeaders(req: HeaderSource): boolean {
  return Boolean(headerValue(req.headers, 'cf-ipcountry'));
}
