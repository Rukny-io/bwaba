export type SecurityHeader = { key: string; value: string };

export interface SecurityHeadersOptions {
  /** Allow Next.js dev overlays and HMR */
  isDev?: boolean;
  /** Public respondent app — Turnstile iframe */
  allowTurnstile?: boolean;
  /** Dashboard analytics maps (Leaflet + OSM tiles) */
  allowMapTiles?: boolean;
  /** Extra origins for connect-src (e.g. https://api.rukny.io) */
  apiConnectOrigins?: string[];
  /** Per-request nonce for script-src (production) */
  nonce?: string;
  /**
   * frame-ancestors for embed mode.
   * - `'none'` (default): block all embedding
   * - `'*'`: allow any parent (dev only — set isDev too)
   * - `string[]`: explicit parent origins (HTTPS in production)
   */
  frameAncestors?: 'none' | '*' | string[];
}

/** Edge-compatible CSP nonce (middleware). */
export function generateCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Baseline security headers for Forms / Public Next.js apps.
 * With `nonce`, production script-src uses nonce + strict-dynamic (no unsafe-inline).
 */
export function buildAppSecurityHeaders(
  options: SecurityHeadersOptions = {},
): SecurityHeader[] {
  const {
    isDev = false,
    allowTurnstile = false,
    allowMapTiles = false,
    apiConnectOrigins = [],
    nonce,
    frameAncestors = 'none',
  } = options;

  const useNonce = Boolean(nonce) && !isDev;

  const scriptSrc = [
    "'self'",
    ...(useNonce
      ? [`'nonce-${nonce}'`, "'strict-dynamic'"]
      : ["'unsafe-inline'"]),
    ...(isDev ? ["'unsafe-eval'"] : []),
    ...(allowTurnstile ? ['https://challenges.cloudflare.com'] : []),
  ];

  const connectSrc = [
    "'self'",
    ...apiConnectOrigins,
    ...(isDev ? ['ws:', 'wss:', 'http://localhost:*', 'http://127.0.0.1:*'] : []),
    ...(isDev || apiConnectOrigins.length === 0 ? ['https:', 'wss:'] : []),
  ];

  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    'https:',
    ...(allowMapTiles
      ? ['https://*.tile.openstreetmap.org', 'https://*.openstreetmap.org']
      : []),
  ];

  const frameSrc = [
    "'self'",
    ...(allowTurnstile ? ['https://challenges.cloudflare.com'] : []),
  ];

  const frameAncestorsDirective =
    frameAncestors === '*'
      ? `frame-ancestors *`
      : Array.isArray(frameAncestors) && frameAncestors.length > 0
        ? `frame-ancestors 'self' ${frameAncestors.join(' ')}`
        : `frame-ancestors 'none'`;

  const cspParts = [
    `default-src 'self'`,
    `script-src ${scriptSrc.join(' ')}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src ${imgSrc.join(' ')}`,
    `font-src 'self' data:`,
    `connect-src ${connectSrc.join(' ')}`,
    `frame-src ${frameSrc.join(' ')}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    frameAncestorsDirective,
    `worker-src 'self' blob:`,
  ];

  if (!isDev) {
    cspParts.push('upgrade-insecure-requests');
  }

  const csp = cspParts.join('; ');

  const headers: SecurityHeader[] = [
    { key: 'Content-Security-Policy', value: csp },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=()',
    },
  ];

  const allowsEmbedding =
    frameAncestors === '*' ||
    (Array.isArray(frameAncestors) && frameAncestors.length > 0);

  if (!allowsEmbedding) {
    headers.splice(1, 0, { key: 'X-Frame-Options', value: 'DENY' });
  }

  return headers;
}

/** HTTPS API origin plus matching WebSocket origin for socket.io. */
export function parseApiConnectOrigins(
  apiUrl: string | undefined,
): string[] {
  if (!apiUrl?.trim()) return [];
  try {
    const url = new URL(apiUrl);
    if (!url.origin) return [];

    const origins = [url.origin];
    if (url.protocol === 'https:') {
      origins.push(`wss://${url.host}`);
    } else if (url.protocol === 'http:') {
      origins.push(`ws://${url.host}`);
    }
    return origins;
  } catch {
    return [];
  }
}
