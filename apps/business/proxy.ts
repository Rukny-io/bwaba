import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  applySecurityHeaders,
  applySecurityHeadersToRequest,
  createSecurityHeadersContext,
  type SecurityHeadersContext,
} from '@rukny/forms-shared/apply-security-headers';
import { parseApiConnectOrigins } from '@rukny/forms-shared/security-headers';
import { resolveApiBaseUrl } from '@rukny/auth/client/env-urls';
import { applyPreviewAccessGate } from '@rukny/auth/edge/preview-access';
import { checkBusinessAuth } from '@/lib/middleware-auth';

const isDev = process.env.NODE_ENV !== 'production';

const SECURITY_OPTS = {
  isDev,
  allowMapTiles: false,
  apiConnectOrigins: parseApiConnectOrigins(resolveApiBaseUrl()),
} as const;

const PROTECTED_PREFIXES = ['/app', '/dashboard'];
const AUTH_PAGES = ['/login', '/callback'];

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

export async function proxy(request: NextRequest) {
  const security = createSecurityHeadersContext(SECURITY_OPTS);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return secure(NextResponse.next(), security);
  }

  if (pathname === '/unavailable' || pathname.startsWith('/unavailable/')) {
    return secureNext(request, security);
  }

  const previewGate = applyPreviewAccessGate(request);
  if (previewGate) {
    return secure(previewGate, security);
  }

  if (pathname.startsWith('/api')) {
    return secure(NextResponse.next(), security);
  }

  const auth = await checkBusinessAuth(request);
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
