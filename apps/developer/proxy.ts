import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LAST_APP_COOKIE } from '@/lib/app-routes';
import { isValidAppId } from '@/lib/api/types';

const MAX_AGE = 60 * 60 * 24 * 90;

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/apps\/(\d{16})(?:\/|$)/);
  const appId = match?.[1];

  if (!appId || !isValidAppId(appId)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(LAST_APP_COOKIE, appId, {
    path: '/',
    maxAge: MAX_AGE,
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  matcher: ['/apps/:appId/:path*', '/apps/:appId'],
};
