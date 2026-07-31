const ACCOUNTS_URL =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'http://localhost:3005';
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const FORMS_ORIGIN =
  process.env.NEXT_PUBLIC_FORMS_URL || 'http://localhost:3007';

export function getFormsOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return FORMS_ORIGIN;
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
  const url = new URL('/login', ACCOUNTS_URL);
  url.searchParams.set('next', returnTo);
  return url.toString();
}

/** Google OAuth via API (sets cookies + redirects back) */
export function getGoogleOAuthUrl(nextPath = '/app'): string {
  const origin = getFormsOrigin();
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
