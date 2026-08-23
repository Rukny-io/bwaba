import {
  isAllowedRedirectHost,
  resolveAccountsUrl,
} from '@/lib/env-urls';

export type UserRole = "ADMIN" | "PREMIUM" | "BASIC" | "GUEST" | "STORE_OWNER" | "DEVELOPER"

function pageHostname(hostname?: string | null): string | null {
  if (hostname) return hostname;
  if (typeof window !== 'undefined') return window.location.hostname;
  return null;
}

function accountsContinueUrl(hostname?: string | null): string {
  return `${resolveAccountsUrl({ hostname: pageHostname(hostname) }).replace(/\/$/, '')}/continue`;
}

/**
 * Default destination after sign-in: choose Forms, Mail, or Account.
 * HQ / app / business / developers stay locked except via preview URL.
 */
export function getRedirectUrlByRole(_role?: string, hostname?: string | null): string {
  return accountsContinueUrl(hostname);
}

function toAbsoluteAccountsPath(path: string, hostname?: string | null): string {
  const origin = resolveAccountsUrl({ hostname }).replace(/\/$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Open-redirect protection. Relative paths stay on accounts.
 */
export function getSafeRedirectUrl(
  nextUrl: string | null | undefined,
  role?: string,
  hostname?: string | null,
): string {
  const host = pageHostname(hostname);
  const fallbackUrl = getRedirectUrlByRole(role, host);
  if (!nextUrl) return fallbackUrl;

  try {
    if (nextUrl.startsWith('/') && !nextUrl.startsWith('//')) {
      return toAbsoluteAccountsPath(nextUrl, host);
    }

    const url = new URL(nextUrl);
    if (isAllowedRedirectHost(url.hostname)) {
      return url.toString();
    }
  } catch {
    /* ignore */
  }

  return fallbackUrl;
}

/** Use stored `auth_next` when present, then clear it. */
export function consumeStoredNext(role?: string): string {
  let stored: string | null = null;
  if (typeof window !== 'undefined') {
    stored = localStorage.getItem('auth_next');
    localStorage.removeItem('auth_next');
  }
  return getSafeRedirectUrl(stored, role, pageHostname());
}
