import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkHqAuth } from './lib/middleware-auth';
import { resolveSafeNext } from './lib/auth-redirect';

const PROTECTED_PREFIXES = ['/app'];
const AUTH_PAGES = ['/login', '/callback'];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  const path = pathname.toLowerCase();
  return prefixes.some(
    (p) => path === p.toLowerCase() || path.startsWith(`${p.toLowerCase()}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const auth = await checkHqAuth(request);

  // Fast redirect — avoid compiling the `/` RSC page on every visit
  if (pathname === '/') {
    const target = auth.isAuthenticated ? '/app' : '/login';
    return NextResponse.redirect(new URL(target, request.url));
  }

  const isProtected = matchesPrefix(pathname, PROTECTED_PREFIXES);
  const isAuthPage = matchesPrefix(pathname, AUTH_PAGES);

  // Role (ADMIN) is verified in getDashboardUser via /auth/me — not in the JWT
  if (isProtected && !auth.isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', request.url);
    if (auth.tokenExpired) {
      loginUrl.searchParams.set('session', 'expired');
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && auth.isAuthenticated && auth.user) {
    const session = request.nextUrl.searchParams.get('session');
    const nextParam = request.nextUrl.searchParams.get('next');
    const target = resolveSafeNext(nextParam, request.url) || '/app';

    if (session === 'expired' || session === 'invalid') {
      if (!auth.tokenExpired) {
        return NextResponse.redirect(new URL(target, request.url));
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
      return response;
    }

    return NextResponse.redirect(new URL(target, request.url));
  }

  const response = NextResponse.next();
  if (auth.isAuthenticated && auth.user) {
    response.headers.set('x-user-id', auth.user.id);
    response.headers.set('x-user-email', auth.user.email);
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
