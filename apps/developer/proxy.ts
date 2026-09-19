import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LAST_APP_COOKIE } from '@/lib/app-routes';
import { isValidAppId } from '@/lib/api/types';
import { resolveClientNext } from '@/lib/auth-redirect';
import { checkDeveloperAuth } from '@/lib/middleware-auth';

/** Portal surfaces that always require a signed-in session. */
const PROTECTED_PREFIXES = ['/apps', '/settings'];

/** Auth entry points (guests OK; signed-in users are redirected away). */
const AUTH_PAGES = ['/login', '/callback'];

/**
 * Explicit public marketing / docs allowlist.
 * Anything else (except `/` for guests and `/unavailable`) requires auth.
 */
const PUBLIC_PREFIXES = [
  '/check-email',
  '/documentation',
  '/pricing',
];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  const path = pathname.toLowerCase();
  return prefixes.some(
    (p) => path === p.toLowerCase() || path.startsWith(`${p.toLowerCase()}/`),
  );
}

function rememberLastApp(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const match = request.nextUrl.pathname.match(/^\/apps\/(\d{16})(?:\/|$)/);
  const appId = match?.[1];
  if (!appId || !isValidAppId(appId)) {
    return response;
  }

  response.cookies.set(LAST_APP_COOKIE, appId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
    sameSite: 'lax',
  });
  return response;
}

function redirectToLogin(
  request: NextRequest,
  auth: { tokenExpired?: boolean },
  fallbackNext = '/apps',
): NextResponse {
  const loginUrl = new URL('/login', request.url);
  const nextTarget = resolveClientNext(
    request.nextUrl.pathname + request.nextUrl.search,
    fallbackNext,
  );
  loginUrl.searchParams.set('next', nextTarget);
  if (auth.tokenExpired) {
    loginUrl.searchParams.set('session', 'expired');
  }
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return rememberLastApp(request, NextResponse.next());
  }

  if (pathname === '/unavailable' || pathname.startsWith('/unavailable/')) {
    return rememberLastApp(request, NextResponse.next());
  }

  // Next route handlers / BFF under this app — not a public HTML surface.
  if (pathname.startsWith('/api')) {
    return rememberLastApp(request, NextResponse.next());
  }

  if (matchesPrefix(pathname, PUBLIC_PREFIXES)) {
    return rememberLastApp(request, NextResponse.next());
  }

  const auth = await checkDeveloperAuth(request);
  const isProtected = matchesPrefix(pathname, PROTECTED_PREFIXES);
  const isAuthPage = matchesPrefix(pathname, AUTH_PAGES);

  // Public marketing landing for guests; console home for signed-in users.
  if (pathname === '/') {
    if (auth.isAuthenticated) {
      return rememberLastApp(
        request,
        NextResponse.redirect(new URL('/apps', request.url)),
      );
    }
    return rememberLastApp(request, NextResponse.next());
  }

  if (isAuthPage) {
    if (auth.isAuthenticated && auth.user && pathname !== '/callback') {
      const session = request.nextUrl.searchParams.get('session');
      const nextParam = request.nextUrl.searchParams.get('next');
      const target = resolveClientNext(nextParam, '/apps');

      if (session === 'expired' || session === 'invalid') {
        if (auth.tokenExpired) {
          const response = NextResponse.next();
          for (const name of [
            'access_token',
            'refresh_token',
            '__Secure-access_token',
            '__Secure-refresh_token',
          ]) {
            response.cookies.delete(name);
          }
          return rememberLastApp(request, response);
        }
        return rememberLastApp(request, NextResponse.next());
      }

      return rememberLastApp(
        request,
        NextResponse.redirect(new URL(target, request.url)),
      );
    }
    return rememberLastApp(request, NextResponse.next());
  }

  // Deny-by-default: portal prefixes and any unknown path require a session.
  if (!auth.isAuthenticated) {
    return rememberLastApp(request, redirectToLogin(request, auth));
  }

  if (isProtected) {
    return rememberLastApp(request, NextResponse.next());
  }

  // Signed-in user on an unrecognized path — still allow Next to render
  // (avoids breaking future authenticated pages), but guests never reach here.
  return rememberLastApp(request, NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
