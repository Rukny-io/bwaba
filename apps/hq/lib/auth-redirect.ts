import {
  isAllowedRedirectHost,
  LOCAL_SERVICE_URLS,
  resolveAccountsUrl,
  resolveApiBaseUrl,
  resolvePageOrigin,
} from '@rukny/auth/client/env-urls';

export function getHqOrigin(): string {
  return resolvePageOrigin(LOCAL_SERVICE_URLS.hq, 'NEXT_PUBLIC_HQ_URL');
}

export function buildHqCallbackUrl(nextPath: string): string {
  const origin = getHqOrigin();
  const callback = new URL('/callback', origin);
  callback.searchParams.set(
    'next',
    nextPath.startsWith('/') ? nextPath : `/${nextPath}`,
  );
  return callback.toString();
}

export function getAccountsLoginUrl(nextPath = '/app'): string {
  const returnTo = buildHqCallbackUrl(nextPath);
  const url = new URL('/login', resolveAccountsUrl());
  url.searchParams.set('next', returnTo);
  return url.toString();
}

/** Google OAuth via Accounts (exchange on accounts, then hand off to HQ) */
export function getGoogleOAuthUrl(nextPath = '/app'): string {
  const accountsOrigin = new URL(resolveAccountsUrl()).origin;
  const callbackUrl = buildHqCallbackUrl(nextPath);
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
    if (isAllowedRedirectHost(url.hostname)) {
      return url.pathname + url.search;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

function resolveSafeNext(nextParam: string | null, baseUrl: string): string | null {
  if (!nextParam) return null;
  try {
    if (nextParam.startsWith('/')) {
      return nextParam;
    }
    const url = new URL(nextParam);
    const base = new URL(baseUrl);
    const host = url.hostname;
    const allowed =
      host === base.hostname || isAllowedRedirectHost(host);
    if (!allowed) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

export { resolveSafeNext };
