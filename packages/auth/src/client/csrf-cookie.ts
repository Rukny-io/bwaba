import { COOKIE_DOMAIN, COOKIE_NAMES } from '../config';

const CSRF_COOKIE_PATTERN =
  /(?:^|; )(?:__Host-|__Secure-)?csrf_token=([^;]*)/;

export const CSRF_COOKIE_NAMES = [
  COOKIE_NAMES.csrfToken,
  '__Secure-csrf_token',
  '__Host-csrf_token',
  'csrf_token',
] as const;

let csrfTokenCache: string | null = null;

function resolveCsrfCookieDomain(cookieName: string): string | undefined {
  if (cookieName.startsWith('__Host-')) return undefined;
  const envDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim();
  if (envDomain) return envDomain;
  if (
    typeof window !== 'undefined' &&
    window.location.hostname.endsWith('rukny.io')
  ) {
    return '.rukny.io';
  }
  return COOKIE_DOMAIN;
}

function appendSecure(parts: string[], isSecure: boolean) {
  if (isSecure) parts.push('Secure');
}

function clearCsrfCookieName(name: string, isSecure: boolean, domain?: string) {
  const hostParts = [`${name}=`, 'Path=/', 'Max-Age=0', 'SameSite=Lax'];
  appendSecure(hostParts, isSecure);
  document.cookie = hostParts.join('; ');

  if (domain && !name.startsWith('__Host-')) {
    const domainParts = [
      `${name}=`,
      'Path=/',
      'Max-Age=0',
      'SameSite=Lax',
      `Domain=${domain}`,
    ];
    appendSecure(domainParts, isSecure);
    document.cookie = domainParts.join('; ');
  }
}

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
  if (typeof window === 'undefined') return;

  const isSecure = window.location.protocol === 'https:';
  const cookieName = isSecure ? COOKIE_NAMES.csrfToken : 'csrf_token';
  const domain = resolveCsrfCookieDomain(cookieName);

  for (const name of CSRF_COOKIE_NAMES) {
    if (name === cookieName) continue;
    clearCsrfCookieName(name, isSecure, domain);
  }

  csrfTokenCache = token;
  const parts = [
    `${cookieName}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${24 * 60 * 60}`,
    'SameSite=Lax',
  ];
  appendSecure(parts, isSecure);
  if (domain) parts.push(`Domain=${domain}`);
  document.cookie = parts.join('; ');
}

export function clearCsrfToken(): void {
  csrfTokenCache = null;
  if (typeof window === 'undefined') return;

  const isSecure = window.location.protocol === 'https:';
  const domain = resolveCsrfCookieDomain(COOKIE_NAMES.csrfToken);

  for (const name of CSRF_COOKIE_NAMES) {
    clearCsrfCookieName(name, isSecure, domain);
  }
}
