import { NextRequest, NextResponse } from 'next/server';

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || 'http://localhost:3001';

const FORWARD_REQUEST_HEADERS = [
  'content-type',
  'accept',
  'accept-language',
  'cookie',
  'origin',
  'referer',
  'user-agent',
  'x-forwarded-for',
  'x-real-ip',
  'x-forwarded-proto',
  'x-request-id',
  'x-csrf-token',
  'authorization',
  'x-workspace-id',
  'x-client-fingerprint',
  'sec-ch-ua',
  'sec-ch-ua-platform',
  'sec-ch-ua-mobile',
];

async function proxyToApi(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const url = new URL(`/api/v1/${path}`, API_BACKEND_URL);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = new Headers();
  for (const key of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
    }
  }

  const apiRes = await fetch(url.toString(), init);

  const resHeaders = new Headers();
  const contentType = apiRes.headers.get('content-type');
  if (contentType) resHeaders.set('content-type', contentType);

  for (const cookie of apiRes.headers.getSetCookie()) {
    resHeaders.append('set-cookie', cookie);
  }

  if (apiRes.status >= 300 && apiRes.status < 400) {
    const location = apiRes.headers.get('location');
    if (location) resHeaders.set('location', location);
    return new NextResponse(null, { status: apiRes.status, headers: resHeaders });
  }

  const responseBody = await apiRes.arrayBuffer();
  return new NextResponse(responseBody, {
    status: apiRes.status,
    headers: resHeaders,
  });
}

type RouteCtx = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxyToApi(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
