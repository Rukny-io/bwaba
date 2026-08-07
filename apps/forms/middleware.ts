import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  applySecurityHeaders,
  applySecurityHeadersToRequest,
  createSecurityHeadersContext,
  type SecurityHeadersContext,
} from '@rukny/forms-shared/apply-security-headers';
import { parseApiConnectOrigins } from '@rukny/forms-shared/security-headers';
import { resolveApiBaseUrl } from './lib/dev-urls';
import { checkFormsAuth } from './lib/middleware-auth';

const isDev = process.env.NODE_ENV !== 'production';

const SECURITY_OPTS = {
  isDev,
  allowMapTiles: true,
  apiConnectOrigins: parseApiConnectOrigins(resolveApiBaseUrl()),
} as const;

const PROTECTED_PREFIXES = ['/app', '/forms/n'];
const AUTH_PAGES = ['/login', '/callback'];
/** Public form fill routes (no login required) */
const PUBLIC_PREFIXES = ['/f'];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  const path = pathname.toLowerCase();
  return prefixes.some(
    (p) => path === p.toLowerCase() || path.startsWith(`${p.toLowerCase()}/`),
  );
}

function secure(
  response: NextResponse,
  security: SecurityHeadersContext,
): NextResponse {
  return applySecurityHeaders(response, security);
}

function secureNext(
  request: NextRequest,
  security: SecurityHeadersContext,
): NextResponse {
  const requestHeaders = applySecurityHeadersToRequest(request, security);
  return secure(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
    security,
  );
}

export async function middleware(request: NextRequest) {
  const security = createSecurityHeadersContext(SECURITY_OPTS);
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return secure(NextResponse.next(), security);
  }

  if (pathname.startsWith('/api')) {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      (request as NextRequest & { ip?: string }).ip;
    if (clientIp) {
      const normalized = clientIp.replace(/^::ffff:/i, '');
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-forwarded-for', normalized);
      requestHeaders.set('x-real-ip', normalized);
      return secure(
        NextResponse.next({ request: { headers: requestHeaders } }),
        security,
      );
    }
    return secure(NextResponse.next(), security);
  }

  if (matchesPrefix(pathname, PUBLIC_PREFIXES)) {
    return secureNext(request, security);
  }

  const auth = await checkFormsAuth(request);
  const isProtected = matchesPrefix(pathname, PROTECTED_PREFIXES);
  const isAuthPage = matchesPrefix(pathname, AUTH_PAGES);

  if (isProtected && !auth.isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    const nextTarget = resolveSafeNext(request.nextUrl.pathname + request.nextUrl.search, request.url);
    if (nextTarget) {
      loginUrl.searchParams.set('next', nextTarget);
    }
    if (auth.tokenExpired) {
      loginUrl.searchParams.set('session', 'expired');
    }
    return secure(NextResponse.redirect(loginUrl), security);
  }

  if (isAuthPage && auth.isAuthenticated && auth.user && pathname !== '/callback') {
    const session = request.nextUrl.searchParams.get('session');
    const nextParam = request.nextUrl.searchParams.get('next');
    const target = resolveSafeNext(nextParam, request.url) || '/app';

    // session=expired في الرابط لا يعني أن الجلسة منتهية فعلاً — قد يكون
    // المستخدم مسجّل دخوله (مثلاً فتح الرابط يدوياً). إن كان التوكن صالحاً
    // نوجّه إلى next بدلاً من حذف الكوكيز وإظهار صفحة الدخول.
    if (session === 'expired' || session === 'invalid') {
      if (!auth.tokenExpired) {
        return secure(
          NextResponse.redirect(new URL(target, request.url)),
          security,
        );
      }
      const response = secureNext(request, security);
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

    return secure(NextResponse.redirect(new URL(target, request.url)), security);
  }

  const response = secureNext(request, security);
  if (auth.isAuthenticated && auth.user) {
    response.headers.set('x-user-id', auth.user.id);
    response.headers.set('x-user-email', auth.user.email);
    response.headers.set('x-user-role', auth.user.role);
  }
  return response;
}

function resolveSafeNext(
  nextParam: string | null,
  baseUrl: string,
): string | null {
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

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
