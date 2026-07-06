const ACCOUNTS_URL =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'http://localhost:3005';

export { ACCOUNTS_URL };
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const DEV_ORIGIN =
  process.env.NEXT_PUBLIC_DEV_URL || 'http://localhost:3004';

export function getDevOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return DEV_ORIGIN;
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
  const url = new URL('/login', ACCOUNTS_URL);
  url.searchParams.set('next', returnTo);
  return url.toString();
}

export function getGoogleOAuthUrl(nextPath = '/apps'): string {
  const origin = getDevOrigin();
  const next =
    nextPath.startsWith('http') || nextPath.startsWith('/')
      ? nextPath.startsWith('/')
        ? new URL(nextPath, origin).toString()
        : nextPath
      : new URL(nextPath, origin).toString();

  const params = new URLSearchParams({
    redirect_origin: origin,
    next,
  });
  return `${API_BASE}/auth/google?${params.toString()}`;
}

export function getFacebookOAuthUrl(nextPath = '/apps'): string {
  const origin = getDevOrigin();
  const next =
    nextPath.startsWith('http') || nextPath.startsWith('/')
      ? nextPath.startsWith('/')
        ? new URL(nextPath, origin).toString()
        : nextPath
      : new URL(nextPath, origin).toString();

  const params = new URLSearchParams({
    redirect_origin: origin,
    next,
  });
  return `${API_BASE}/auth/facebook?${params.toString()}`;
}

export function resolveClientNext(
  nextParam: string | null,
  fallback = '/apps',
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
      host === base.hostname ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.rukny.io') ||
      host === 'rukny.io';
    if (!allowed) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

export { resolveSafeNext };
