import {
  LOCAL_SERVICE_URLS,
  resolveAccountsUrl,
  resolveApiBaseUrl,
  resolveBusinessUrl,
  shouldUseLocalServiceUrls,
} from '@rukny/auth/client/env-urls';

export {
  isLoopbackHost,
  LOCAL_SERVICE_URLS,
  resolveAccountsUrl,
  resolveApiBaseUrl,
  shouldUseLocalServiceUrls,
} from '@rukny/auth/client/env-urls';

export function resolveBusinessOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  if (shouldUseLocalServiceUrls()) return LOCAL_SERVICE_URLS.business;
  return resolveBusinessUrl();
}

export function buildBusinessCallbackUrl(nextPath: string): string {
  const origin = resolveBusinessOrigin();
  const callback = new URL('/callback', origin);
  callback.searchParams.set('next', nextPath.startsWith('/') ? nextPath : `/${nextPath}`);
  return callback.toString();
}

export function getAccountsLoginUrl(nextPath = '/app'): string {
  const returnTo = buildBusinessCallbackUrl(nextPath);
  const url = new URL('/login', resolveAccountsUrl());
  url.searchParams.set('next', returnTo);
  return url.toString();
}

export function getGoogleOAuthUrl(nextPath = '/app'): string {
  const accountsOrigin = new URL(resolveAccountsUrl()).origin;
  const callbackUrl = buildBusinessCallbackUrl(nextPath);
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
