const ACCOUNTS_URL =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'http://localhost:3005';
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const HQ_ORIGIN = process.env.NEXT_PUBLIC_HQ_URL || 'http://localhost:3002';

export function getHqOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return HQ_ORIGIN;
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
  const url = new URL('/login', ACCOUNTS_URL);
  url.searchParams.set('next', returnTo);
  return url.toString();
}

export function getGoogleOAuthUrl(nextPath = '/app'): string {
  const origin = getHqOrigin();
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
