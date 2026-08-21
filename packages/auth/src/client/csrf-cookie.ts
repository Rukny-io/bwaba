import { COOKIE_NAMES } from '../config';

const CSRF_COOKIE_PATTERN =
  /(?:^|; )(?:__Host-|__Secure-)?csrf_token=([^;]*)/;

export const CSRF_COOKIE_NAMES = [
  COOKIE_NAMES.csrfToken,
  '__Secure-csrf_token',
  'csrf_token',
] as const;

let csrfTokenCache: string | null = null;

export function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;
  if (csrfTokenCache) return csrfTokenCache;
  const match = document.cookie.match(CSRF_COOKIE_PATTERN);
  if (match) {
    csrfTokenCache = decodeURIComponent(match[1]);
    return csrfTokenCache;
  }
  return null;
}

export function setCsrfToken(token: string): void {
  if (!token) return;
  csrfTokenCache = token;
  if (typeof window === 'undefined') return;
  const isSecure = window.location.protocol === 'https:';
  const cookieName = isSecure ? COOKIE_NAMES.csrfToken : 'csrf_token';
  const parts = [
    `${cookieName}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${24 * 60 * 60}`,
    'SameSite=Lax',
  ];
  if (isSecure) parts.push('Secure');
  document.cookie = parts.join('; ');
}

export function clearCsrfToken(): void {
  csrfTokenCache = null;
  if (typeof window === 'undefined') return;
  const domain =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim() ||
        (window.location.hostname.endsWith('rukny.io') ? '.rukny.io' : '')
      : window.location.hostname.endsWith('rukny.io')
        ? '.rukny.io'
        : '';
  for (const name of CSRF_COOKIE_NAMES) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    if (domain && !name.startsWith('__Host-')) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax; Domain=${domain}`;
    }
  }
}
