const ACCOUNTS_URL =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'http://localhost:3005';
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const DEFAULT_APP_PATH = '/app/links';

export function getAppOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return APP_ORIGIN;
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
  const url = new URL('/login', ACCOUNTS_URL);
  url.searchParams.set('next', returnTo);
  return url.toString();
}

/** Google OAuth via API (sets cookies + redirects back) */
export function getGoogleOAuthUrl(nextPath = DEFAULT_APP_PATH): string {
  const origin = getAppOrigin();
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
  fallback = DEFAULT_APP_PATH,
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
      host === 'rukny.io' ||
      host === 'rukny.work'
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
