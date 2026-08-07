import { NextRequest, NextResponse } from 'next/server';

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || 'http://localhost:3001';

const FORWARD_REQUEST_HEADERS = [
  'content-type',
  'accept',
  'cookie',
  'origin',
  'referer',
  'user-agent',
  'x-forwarded-for',
  'x-real-ip',
  'x-forwarded-proto',
  'x-request-id',
  'x-csrf-token',
  'x-client-fingerprint',
  'accept-language',
  'sec-ch-ua',
  'sec-ch-ua-platform',
  'sec-ch-ua-mobile',
];

const ALLOWED_AUTH_PREFIXES = [
  'me',
  'refresh',
  'logout',
  'logout-all',
  'oauth',
  'google',
  'linkedin',
  'facebook',
  'quicksign',
  '2fa',
];

function normalizeIp(ip: string): string {
  const clean = ip.trim().replace(/^::ffff:/i, '');
  if (
    clean === '::1' ||
    clean === '0:0:0:0:0:0:0:1' ||
    clean === 'localhost'
  ) {
    return '127.0.0.1';
  }
  return clean;
}

/** Match accounts BFF — stable loopback IP for OAuth code binding in local dev. */
function resolveBffClientIp(request: NextRequest): string | null {
  if (process.env.NODE_ENV !== 'production') {
    return '127.0.0.1';
  }

  const cfIp = request.headers.get('cf-connecting-ip')?.trim();
  if (cfIp) return normalizeIp(cfIp);

  const xff = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (xff) return normalizeIp(xff);

  const xri = request.headers.get('x-real-ip')?.trim();
  if (xri) return normalizeIp(xri);

  const reqIp = (request as NextRequest & { ip?: string }).ip;
  if (reqIp) return normalizeIp(reqIp);

  return null;
}

async function proxyToApi(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const firstSegment = pathSegments[0]?.toLowerCase();
  if (!firstSegment || !ALLOWED_AUTH_PREFIXES.includes(firstSegment)) {
    return NextResponse.json({ error: 'Invalid auth path' }, { status: 400 });
  }

  const url = new URL(`/api/v1/auth/${path}`, API_BACKEND_URL);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = new Headers();
  for (const key of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }

  const clientIp = resolveBffClientIp(request);
  if (clientIp) {
    headers.set('x-forwarded-for', clientIp);
    headers.set('x-real-ip', clientIp);
    headers.set('cf-connecting-ip', clientIp);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  const apiRes = await fetch(url.toString(), init);

  const resHeaders = new Headers();
  const ct = apiRes.headers.get('content-type');
  if (ct) resHeaders.set('content-type', ct);

  for (const cookie of apiRes.headers.getSetCookie()) {
    resHeaders.append('set-cookie', cookie);
  }

  if (apiRes.status >= 300 && apiRes.status < 400) {
    const location = apiRes.headers.get('location');
    if (location) resHeaders.set('location', location);
    return new NextResponse(null, { status: apiRes.status, headers: resHeaders });
  }

  const body = await apiRes.arrayBuffer();
  return new NextResponse(body, { status: apiRes.status, headers: resHeaders });
}

type RouteCtx = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxyToApi(request, path);
}

export const GET = handle;
export const POST = handle;
