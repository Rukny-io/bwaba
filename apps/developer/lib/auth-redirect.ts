import {
  isAllowedRedirectHost,
  LOCAL_SERVICE_URLS,
  resolveAccountsUrl,
  resolveApiBaseUrl,
  resolvePageOrigin,
} from '@rukny/auth/client/env-urls';

export const ACCOUNTS_URL = resolveAccountsUrl();

export function getDevOrigin(): string {
  return resolvePageOrigin(
    LOCAL_SERVICE_URLS.developer,
    'NEXT_PUBLIC_DEVELOPERS_URL',
  );
}

export function buildDevCallbackUrl(nextPath: string): string {
  const origin = getDevOrigin();
  const callback = new URL('/callback', origin);
  callback.searchParams.set(
    'next',
    nextPath.startsWith('/') ? nextPath : `/${nextPath}`,
  );
  return callback.toString();
}

export function getAccountsLoginUrl(nextPath = '/apps'): string {
  const returnTo = buildDevCallbackUrl(nextPath);
  const url = new URL('/login', resolveAccountsUrl());
  url.searchParams.set('next', returnTo);
  return url.toString();
}

export function getGoogleOAuthUrl(nextPath = '/apps'): string {
  const accountsOrigin = new URL(resolveAccountsUrl()).origin;
  const callbackUrl = buildDevCallbackUrl(nextPath);
  const params = new URLSearchParams({
    redirect_origin: accountsOrigin,
    next: callbackUrl,
  });
  return `${resolveApiBaseUrl()}/auth/google?${params.toString()}`;
}

export function getFacebookOAuthUrl(nextPath = '/apps'): string {
  const accountsOrigin = new URL(resolveAccountsUrl()).origin;
  const callbackUrl = buildDevCallbackUrl(nextPath);
  const params = new URLSearchParams({
    redirect_origin: accountsOrigin,
    next: callbackUrl,
  });
  return `${resolveApiBaseUrl()}/auth/facebook?${params.toString()}`;
}

export function resolveClientNext(
  nextParam: string | null,
  fallback = '/apps',
): string {
  if (!nextParam) return fallback;
  try {
    if (nextParam.startsWith('/')) {
      if (nextParam.startsWith('/callback')) {
        const inner = new URL(nextParam, getDevOrigin()).searchParams.get('next');
        if (inner) return resolveClientNext(inner, fallback);
      }
      return nextParam;
    }
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
