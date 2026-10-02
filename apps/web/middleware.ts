import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  applySecurityHeaders,
  applySecurityHeadersToRequest,
  createSecurityHeadersContext,
} from '@rukny/forms-shared/apply-security-headers';
import { parseApiConnectOrigins } from '@rukny/forms-shared/security-headers';

const isDev = process.env.NODE_ENV !== 'production';

function resolveAppOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'https://app.rukny.io';
  try {
    return new URL(raw).origin;
  } catch {
    return 'https://app.rukny.io';
  }
}

function resolveFrameAncestors(
  request: NextRequest,
): 'none' | '*' | string[] {
  const embed = request.nextUrl.searchParams.get('embed') === '1';
  if (!embed) return 'none';
  if (isDev) return '*';
  return [resolveAppOrigin()];
}

export function middleware(request: NextRequest) {
  const isEmbed = request.nextUrl.searchParams.get('embed') === '1';
  const security = createSecurityHeadersContext({
    isDev,
    allowTurnstile: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()),
    apiConnectOrigins: parseApiConnectOrigins(process.env.NEXT_PUBLIC_API_URL),
    frameAncestors: resolveFrameAncestors(request),
  });
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    const response = applySecurityHeaders(NextResponse.next(), security);
    if (isEmbed) {
      response.headers.set('Cache-Control', 'no-store');
    }
    return response;
  }

  const requestHeaders = applySecurityHeadersToRequest(request, security);
  const response = applySecurityHeaders(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
    security,
  );
  if (isEmbed) {
    response.headers.set(
      'Cache-Control',
      'private, no-store, no-cache, must-revalidate',
    );
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
