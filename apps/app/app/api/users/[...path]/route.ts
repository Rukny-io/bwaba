import { NextRequest, NextResponse } from 'next/server';

/**
 * 🔒 Users API Route Handler — BFF Proxy
 *
 * Proxies /api/users/* → /api/v1/users/* on the NestJS backend.
 */

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || 'http://localhost:3001';

const FORWARD_REQUEST_HEADERS = [
  'content-type', 'accept', 'cookie', 'origin', 'referer',
  'user-agent', 'x-forwarded-for', 'x-real-ip',
];

/** Allowlist of user sub-paths */
const ALLOWED_USER_PREFIXES = [
  'profile', '2fa', 'sessions', 'security-logs', 'security-stats',
];

async function proxyToApi(request: NextRequest, pathSegments: string[]) {
  const firstSegment = pathSegments[0]?.toLowerCase();
  if (!firstSegment || !ALLOWED_USER_PREFIXES.includes(firstSegment)) {
    return new NextResponse(JSON.stringify({ error: 'Invalid path' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const path = pathSegments.join('/');
  const url = new URL(`/api/v1/user/${path}`, API_BACKEND_URL);

  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = new Headers();
  for (const key of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }

  const init: RequestInit = { method: request.method, headers, redirect: 'manual' };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  const apiRes = await fetch(url.toString(), init);

  const resHeaders = new Headers();
  const ct = apiRes.headers.get('content-type');
  if (ct) resHeaders.set('content-type', ct);

  const setCookies = apiRes.headers.getSetCookie();
  for (const cookie of setCookies) {
    resHeaders.append('set-cookie', cookie);
  }

  const body = await apiRes.arrayBuffer();
  return new NextResponse(body, { status: apiRes.status, headers: resHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyToApi(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyToApi(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyToApi(request, path);
}
