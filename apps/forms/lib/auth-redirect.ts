import {
  resolveAccountsUrl,
  resolveApiBaseUrl,
  resolveFormsOrigin,
} from '@/lib/dev-urls';

export function getFormsOrigin(): string {
  return resolveFormsOrigin();
}

/** Callback URL on Forms after Accounts login */
export function buildFormsCallbackUrl(nextPath: string): string {
  const origin = getFormsOrigin();
  const callback = new URL('/callback', origin);
  callback.searchParams.set('next', nextPath.startsWith('/') ? nextPath : `/${nextPath}`);
  return callback.toString();
}

/** Full Accounts login with return to Forms */
export function getAccountsLoginUrl(nextPath = '/app'): string {
  const returnTo = buildFormsCallbackUrl(nextPath);
  const url = new URL('/login', resolveAccountsUrl());
  url.searchParams.set('next', returnTo);
  return url.toString();
}

/** Google OAuth via Accounts (exchange on accounts, then hand off to Forms) */
export function getGoogleOAuthUrl(nextPath = '/app'): string {
  const accountsOrigin = new URL(resolveAccountsUrl()).origin;
  const callbackUrl = buildFormsCallbackUrl(nextPath);
  const params = new URLSearchParams({
    redirect_origin: accountsOrigin,
    next: callbackUrl,
  });
  return `${resolveApiBaseUrl()}/auth/google?${params.toString()}`;
}

export function resolveClientNext(
  nextParam: string | null,
  fallback = '/app',
): string {
  if (!nextParam) return fallback;
  try {
    if (nextParam.startsWith('/')) return nextParam;
    const url = new URL(nextParam);
    const host = url.hostname;
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.rukny.io') ||
      host === 'rukny.io'
    ) {
      if (url.pathname === '/callback') {
        const inner = url.searchParams.get('next');
        if (inner) return resolveClientNext(inner, fallback);
        return fallback;
      }
      return url.pathname + url.search;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}
