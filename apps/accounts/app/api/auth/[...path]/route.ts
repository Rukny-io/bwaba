import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api-proxy';

const ALLOWED_AUTH_PREFIXES = [
  'me',
  'refresh',
  'logout',
  'logout-all',
  'sessions',
  'activity',
  'ws-token',
  'google',
  'linkedin',
  'facebook',
  'oauth',
  'quicksign',
  'lockout',
  '2fa',
  'linking',
  'update-profile',
  'identity',
  'verified',
];

async function proxyToApi(request: NextRequest, pathSegments: string[]) {
  return proxyToBackend(request, pathSegments, {
    apiPrefix: 'auth',
    allowedPrefixes: ALLOWED_AUTH_PREFIXES,
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
