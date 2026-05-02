import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 🌐 Subdomain Routing & Route Protection Middleware
 *
 * Handles:
 * 1. Subdomain routing (production only)
 *    - app.rukny.io       → Dashboard (clean URLs, rewrite to /app/*)
 *    - accounts.rukny.io  → Auth pages (/login, /complete-profile, etc.)
 *    - rukny.io           → Public pages
 *
 * 2. Route protection (all environments)
 *    - Protected routes without session → redirect to login
 *    - Auth routes with active session → redirect to dashboard
 *
 * Development (localhost): Path-based routing, only route protection active.
 */

const AUTH_PATHS = [
  '/login',
  '/check-email',
  '/verify-identity',
  '/verify-2fa',
  '/complete-profile',
  '/callback',
];

const COMPLETE_PROFILE_RE = /^\/complete-profile\/[a-f0-9]{32}(\?.*)?$/;

const APP_PATH_PREFIX = '/app';

const PROTECTED_PREFIXES = [
  '/app',
];

const SKIP_PATHS = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/icon.svg',
  '/manifest.json',
  '/sw.js',
  '/icons/',
  '/logos/',
];

const STATIC_EXTENSIONS = [
  '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
  '.css', '.js', '.woff', '.woff2', '.ttf', '.eot',
];

function getSubdomain(hostname: string): string | null {
  try {
    const url = new URL(`http://${hostname}`);
    const host = url.hostname;
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'rukny.io';

    if (host === rootDomain || host === `www.${rootDomain}`) {
      return null;
    }

    if (host.endsWith(`.${rootDomain}`)) {
      return host.replace(`.${rootDomain}`, '');
    }
  } catch {
    return null;
  }

  return null;
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isAppPath(pathname: string): boolean {
  return pathname === APP_PATH_PREFIX || pathname.startsWith(`${APP_PATH_PREFIX}/`);
}

function shouldSkip(pathname: string): boolean {
  if (SKIP_PATHS.some((path) => pathname.startsWith(path))) return true;
  const lowerPath = pathname.toLowerCase();
  return STATIC_EXTENSIONS.some((ext) => lowerPath.endsWith(ext));
}

function isLocalhost(hostname: string): boolean {
  try {
    const url = new URL(`http://${hostname}`);
    const host = url.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1';
  } catch {
    return false;
  }
}

function buildSubdomainUrl(
  subdomain: string | null,
  pathname: string,
  search: string,
  rootDomain: string,
  protocol: string,
): string {
  const domain = subdomain ? `${subdomain}.${rootDomain}` : rootDomain;
  return `${protocol}://${domain}${pathname}${search}`;
}

function hasAccessToken(request: NextRequest): boolean {
  return !!(
    request.cookies.get('__Secure-access_token')?.value ||
    request.cookies.get('access_token')?.value
  );
}

function hasSession(request: NextRequest): boolean {
  return hasAccessToken(request) || !!(
    request.cookies.get('__Secure-refresh_token')?.value ||
    request.cookies.get('refresh_token')?.value
  );
}

function isProtectedPath(resolvedPathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => resolvedPathname === prefix || resolvedPathname.startsWith(`${prefix}/`),
  );
}

function buildLoginUrl(
  callbackPath: string,
  subdomain: string | null,
  rootDomain: string,
  protocol: string,
): string {
  if (subdomain !== null) {
    return `${protocol}://accounts.${rootDomain}/login?callbackUrl=${encodeURIComponent(callbackPath)}`;
  }
  return `/login?callbackUrl=${encodeURIComponent(callbackPath)}`;
}

function buildAppRedirectUrl(
  rootDomain: string,
  protocol: string,
): string {
  return `${protocol}://app.${rootDomain}/`;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host');

  if (!hostname) {
    return NextResponse.next();
  }

  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  const isLocal = isLocalhost(hostname);
  const userHasSession = hasSession(request);
  const response = NextResponse.next();

  // 🔒 Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
  }

  if (isLocal) {
    // Localhost fallback logic
    if (isProtectedPath(pathname) && !userHasSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAuthPath(pathname) && hasAccessToken(request)) {
      const isTokenizedCompleteProfile = COMPLETE_PROFILE_RE.test(pathname + (request.nextUrl.search ?? ''));
      const authExceptions = ['/callback'];
      const isException = authExceptions.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
      ) || isTokenizedCompleteProfile;
      const hasSessionExpired =
        request.nextUrl.searchParams.get('session') === 'expired' ||
        request.nextUrl.searchParams.get('session') === 'invalid';

      if (!isException && !hasSessionExpired) {
        return NextResponse.redirect(new URL('/app', request.url));
      }
    }
    return response;
  }

  const subdomain = getSubdomain(hostname);
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'rukny.io';
  const protocol =
    request.headers.get('x-forwarded-proto') ||
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const search = request.nextUrl.search;

  if (subdomain === 'app') {
    if (isAuthPath(pathname)) {
      return NextResponse.redirect(
        new URL(buildSubdomainUrl('accounts', pathname, search, rootDomain, protocol)),
      );
    }

    if (isAppPath(pathname)) {
      const cleanPath = pathname.replace(/^\/app/, '') || '/';
      return NextResponse.redirect(
        new URL(buildSubdomainUrl('app', cleanPath, search, rootDomain, protocol)),
      );
    }

    if (!userHasSession) {
      const callbackPath = pathname === '/' ? '/' : pathname;
      return NextResponse.redirect(
        new URL(buildLoginUrl(callbackPath, subdomain, rootDomain, protocol)),
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = `/app${pathname}`;
    // We rewrite instead of returning response directly so Next.js handles it
    const rewriteRes = NextResponse.rewrite(url);
    // Preserve security headers
    rewriteRes.headers.set('X-Frame-Options', 'DENY');
    rewriteRes.headers.set('X-Content-Type-Options', 'nosniff');
    return rewriteRes;
  }

  if (subdomain === 'accounts') {
    if (pathname === '/') {
      const hasSessionExpired =
        request.nextUrl.searchParams.get('session') === 'expired' ||
        request.nextUrl.searchParams.get('session') === 'invalid';

      if (hasAccessToken(request) && !hasSessionExpired) {
        return NextResponse.redirect(
          new URL(buildAppRedirectUrl(rootDomain, protocol)),
        );
      }

      return NextResponse.redirect(
        new URL(buildSubdomainUrl('accounts', '/login', search, rootDomain, protocol)),
      );
    }

    if (isAppPath(pathname)) {
      const cleanPath = pathname.replace(/^\/app/, '') || '/';
      return NextResponse.redirect(
        new URL(buildSubdomainUrl('app', cleanPath, search, rootDomain, protocol)),
      );
    }

    if (isAuthPath(pathname)) {
      const isTokenizedCompleteProfile = COMPLETE_PROFILE_RE.test(pathname + (request.nextUrl.search ?? ''));
      const authExceptions = ['/callback'];
      const isException = authExceptions.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
      ) || isTokenizedCompleteProfile;
      
      const hasSessionExpired =
        request.nextUrl.searchParams.get('session') === 'expired' ||
        request.nextUrl.searchParams.get('session') === 'invalid';

      if (hasAccessToken(request) && !isException && !hasSessionExpired) {
        return NextResponse.redirect(
          new URL(buildAppRedirectUrl(rootDomain, protocol)),
        );
      }
      return response;
    }

    return NextResponse.redirect(
      new URL(buildSubdomainUrl(null, pathname, search, rootDomain, protocol)),
    );
  }

  // rukny.io
  if (pathname === '/') {
    return response;
  }

  if (isAppPath(pathname)) {
    const cleanPath = pathname.replace(/^\/app/, '') || '/';
    return NextResponse.redirect(
      new URL(buildSubdomainUrl('app', cleanPath, search, rootDomain, protocol)),
    );
  }

  if (isAuthPath(pathname)) {
    return NextResponse.redirect(
      new URL(buildSubdomainUrl('accounts', pathname, search, rootDomain, protocol)),
    );
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
