import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  applySecurityHeaders,
  applySecurityHeadersToRequest,
  createSecurityHeadersContext,
} from '@rukny/forms-shared/apply-security-headers';
import { parseApiConnectOrigins } from '@rukny/forms-shared/security-headers';

const isDev = process.env.NODE_ENV !== 'production';

const SECURITY_OPTS = {
  isDev,
  allowTurnstile: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()),
  apiConnectOrigins: parseApiConnectOrigins(process.env.NEXT_PUBLIC_API_URL),
} as const;

export function middleware(request: NextRequest) {
  const security = createSecurityHeadersContext(SECURITY_OPTS);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return applySecurityHeaders(NextResponse.next(), security);
  }

  const requestHeaders = applySecurityHeadersToRequest(request, security);
  return applySecurityHeaders(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
    security,
  );
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
