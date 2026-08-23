import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const PREVIEW_QUERY_PARAM = 'preview';
export const PREVIEW_COOKIE_NAME = 'rukny_preview';
export const PREVIEW_UNAVAILABLE_PATH = '/unavailable';

const PREVIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function previewAccessKey(): string {
  return process.env.RUKNY_PREVIEW_ACCESS_KEY?.trim() ?? '';
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function shouldSkipPreviewGate(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return isLoopbackHostname(request.nextUrl.hostname);
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

function matchesPreviewKey(value: string | null | undefined, expected: string): boolean {
  if (!expected || !value) return false;
  return timingSafeEqual(value, expected);
}

function withPreviewCookie(
  response: NextResponse,
  key: string,
  request: NextRequest,
): NextResponse {
  response.cookies.set(PREVIEW_COOKIE_NAME, key, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: PREVIEW_COOKIE_MAX_AGE,
  });
  return response;
}

function isUnavailablePath(pathname: string): boolean {
  return (
    pathname === PREVIEW_UNAVAILABLE_PATH ||
    pathname.startsWith(`${PREVIEW_UNAVAILABLE_PATH}/`)
  );
}

/**
 * Lock app / business / developer in production unless `?preview=<key>`
 * (or the matching httpOnly cookie) is present.
 *
 * Returns a response that should short-circuit middleware, or null to continue.
 * If the env key is empty in production, the surface stays fully locked.
 */
export function applyPreviewAccessGate(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return null;
  }

  if (isUnavailablePath(pathname)) {
    return null;
  }

  if (shouldSkipPreviewGate(request)) {
    return null;
  }

  const expected = previewAccessKey();
  const queryKey = request.nextUrl.searchParams.get(PREVIEW_QUERY_PARAM);

  if (matchesPreviewKey(queryKey, expected)) {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete(PREVIEW_QUERY_PARAM);
    if (isUnavailablePath(clean.pathname)) {
      clean.pathname = '/';
    }
    return withPreviewCookie(NextResponse.redirect(clean), expected, request);
  }

  if (matchesPreviewKey(request.cookies.get(PREVIEW_COOKIE_NAME)?.value, expected)) {
    return null;
  }

  if (pathname.startsWith('/api')) {
    return NextResponse.json({ error: 'unavailable' }, { status: 403 });
  }

  return NextResponse.rewrite(new URL(PREVIEW_UNAVAILABLE_PATH, request.url));
}
