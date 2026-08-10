import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LAST_APP_COOKIE } from '@/lib/app-routes';
import { isValidAppId } from '@/lib/api/types';
import { resolveClientNext } from '@/lib/auth-redirect';
import { checkDeveloperAuth } from '@/lib/middleware-auth';

const PROTECTED_PREFIXES = ['/apps', '/settings'];
const AUTH_PAGES = ['/login', '/callback'];
const PUBLIC_PREFIXES = ['/check-email'];

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return rememberLastApp(request, NextResponse.next());
  }

  if (matchesPrefix(pathname, PUBLIC_PREFIXES)) {
    return rememberLastApp(request, NextResponse.next());
  }

  const auth = await checkDeveloperAuth(request);
  const isProtected = matchesPrefix(pathname, PROTECTED_PREFIXES);
  const isAuthPage = matchesPrefix(pathname, AUTH_PAGES);

  if (pathname === '/') {
    const target = auth.isAuthenticated ? '/apps' : '/login';
    return rememberLastApp(
      request,
      NextResponse.redirect(new URL(target, request.url)),
    );
  }

  if (isProtected && !auth.isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    const nextTarget = resolveClientNext(
      request.nextUrl.pathname + request.nextUrl.search,
      '/apps',
    );
    loginUrl.searchParams.set('next', nextTarget);
    if (auth.tokenExpired) {
      loginUrl.searchParams.set('session', 'expired');
    }
    return rememberLastApp(request, NextResponse.redirect(loginUrl));
  }

  if (isAuthPage && auth.isAuthenticated && auth.user && pathname !== '/callback') {
    const session = request.nextUrl.searchParams.get('session');
    const nextParam = request.nextUrl.searchParams.get('next');
    const target = resolveClientNext(nextParam, '/apps');

    if (session === 'expired' || session === 'invalid') {
      if (!auth.tokenExpired) {
        return rememberLastApp(
          request,
          NextResponse.redirect(new URL(target, request.url)),
        );
      }
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

    return rememberLastApp(
      request,
      NextResponse.redirect(new URL(target, request.url)),
    );
  }

  return rememberLastApp(request, NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
