import {
  isAllowedRedirectHost,
  LOCAL_SERVICE_URLS,
  resolveAccountsUrl,
  resolveApiBaseUrl,
  resolvePageOrigin,
} from '@rukny/auth/client/env-urls';

export const DEFAULT_APP_PATH = '/app/links';

export function getAppOrigin(): string {
  return resolvePageOrigin(
    LOCAL_SERVICE_URLS.app,
    'NEXT_PUBLIC_APP_URL',
  );
}

/** Callback URL on App after Accounts login */
export function buildAppCallbackUrl(nextPath: string): string {
  const origin = getAppOrigin();
  const callback = new URL('/callback', origin);
  callback.searchParams.set(
    'next',
    nextPath.startsWith('/') ? nextPath : `/${nextPath}`,
  );
  return callback.toString();
}

/** Full Accounts login with return to App */
export function getAccountsLoginUrl(nextPath = DEFAULT_APP_PATH): string {
  const returnTo = buildAppCallbackUrl(nextPath);
  const url = new URL('/login', resolveAccountsUrl());
  url.searchParams.set('next', returnTo);
  return url.toString();
}

/** Google OAuth via Accounts (exchange on accounts, then hand off to App) */
export function getGoogleOAuthUrl(nextPath = DEFAULT_APP_PATH): string {
  const accountsOrigin = new URL(resolveAccountsUrl()).origin;
  const callbackUrl = buildAppCallbackUrl(nextPath);
  const params = new URLSearchParams({
    redirect_origin: accountsOrigin,
    next: callbackUrl,
  });
  return `${resolveApiBaseUrl()}/auth/google?${params.toString()}`;
}

export function resolveClientNext(
  nextParam: string | null,
  fallback = DEFAULT_APP_PATH,
): string {
  if (!nextParam) return fallback;
  try {
    if (nextParam.startsWith('/')) return nextParam;
    const url = new URL(nextParam);
    if (isAllowedRedirectHost(url.hostname)) {
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
