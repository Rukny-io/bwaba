/**
 * 🔐 Server-side API Client
 *
 * Forwards httpOnly cookies from the browser request to the NestJS backend.
 * Used inside Server Components, Server Actions, and the DAL.
 */

import { cookies, headers } from 'next/headers';

const API_URL = process.env.API_BACKEND_URL || process.env.API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1';

type FetchOptions = RequestInit & {
  skipCookies?: boolean;
};

export async function apiServer<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<{ data: T | null; error: string | null; status: number }> {
  const { skipCookies = false, ...fetchOptions } = options;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_URL}${API_PREFIX}${normalizedPath}`;

  const reqHeaders = new Headers(fetchOptions.headers as HeadersInit);

  if (!skipCookies) {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      reqHeaders.set('Cookie', cookieHeader);
    }

    // Forward CSRF for mutating requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(fetchOptions.method?.toUpperCase() ?? '')) {
      const csrf =
        cookieStore.get('__Secure-csrf_token')?.value || cookieStore.get('csrf_token')?.value;
      if (csrf) reqHeaders.set('x-csrf-token', csrf);
    }
  }

  const headersList = await headers();
  const origin = headersList.get('origin');
  const referer = headersList.get('referer');
  if (origin) reqHeaders.set('origin', origin);
  if (referer) reqHeaders.set('referer', referer);

  if (
    !reqHeaders.has('content-type') &&
    fetchOptions.body &&
    typeof fetchOptions.body === 'string'
  ) {
    reqHeaders.set('content-type', 'application/json');
  }

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      headers: reqHeaders,
      redirect: 'manual',
      cache: 'no-store',
    });

    if (res.status >= 300 && res.status < 400) {
      return {
        data: { redirectUrl: res.headers.get('location') } as T,
        error: null,
        status: res.status,
      };
    }

    const text = await res.text();
    let data: T | null = null;
    try {
      data = text ? (JSON.parse(text) as T) : null;
    } catch {
      // not JSON
    }

    if (!res.ok) {
      const json = data as Record<string, unknown> | null;
      const msg = Array.isArray(json?.message)
        ? (json!.message as string[])[0]
        : ((json?.message as string) ?? res.statusText);
      return { data: null, error: msg, status: res.status };
    }

    return { data, error: null, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { data: null, error: message, status: 0 };
  }
}
