import { NextRequest, NextResponse } from 'next/server';
import { API_BACKEND_URL, FORWARD_UPLOAD_HEADERS } from '@/lib/api-proxy';

type RouteCtx = { params: Promise<{ appId: string }> };

/** Passthrough multipart to API — rebuild FormData in Node often drops file bytes. */
export async function POST(request: NextRequest, ctx: RouteCtx) {
  const { appId } = await ctx.params;
  const contentType = request.headers.get('content-type') ?? '';

  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return NextResponse.json(
      { message: 'Expected multipart upload' },
      { status: 400 },
    );
  }

  const body = await request.arrayBuffer();
  if (!body.byteLength) {
    return NextResponse.json({ message: 'No file provided' }, { status: 400 });
  }

  const headers = new Headers();
  for (const key of FORWARD_UPLOAD_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  headers.set('content-type', contentType);

  const apiRes = await fetch(
    `${API_BACKEND_URL}/api/v1/developer/apps/${encodeURIComponent(appId)}/upload/file`,
    {
      method: 'POST',
      headers,
      body,
    },
  );

  const resHeaders = new Headers();
  const ct = apiRes.headers.get('content-type');
  if (ct) resHeaders.set('content-type', ct);

  for (const cookie of apiRes.headers.getSetCookie()) {
    resHeaders.append('set-cookie', cookie);
  }

  const responseBody = await apiRes.arrayBuffer();
  return new NextResponse(responseBody, {
    status: apiRes.status,
    headers: resHeaders,
  });
}
