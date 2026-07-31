import 'server-only';

import { cookies } from 'next/headers';
import {
  getServerAuthHeaders,
  mergeAuthSetCookies,
  persistAuthSetCookies,
} from '@rukny/auth/server';

export function getBackendBaseUrl(): string {
  const raw =
    process.env.API_BACKEND_URL ||
    process.env.API_URL ||
    'http://localhost:3001';

  return raw.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}

export function buildCookieHeader(
  items: { name: string; value: string }[],
): string {
  return items.map((c) => `${c.name}=${c.value}`).join('; ');
}

/**
 * Authenticated server fetch to the Nest API (cookie + refresh retry).
 */
export async function serverApiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T | null> {
  const cookieStore = await cookies();
  let cookieHeader = buildCookieHeader(cookieStore.getAll());
  const url = `${getBackendBaseUrl()}/api/v1${path.startsWith('/') ? path : `/${path}`}`;

  try {
    let res = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string>),
        ...(await getServerAuthHeaders(cookieHeader)),
      },
      cache: 'no-store',
    });

    if (res.status === 401) {
      const refreshRes = await fetch(
        `${getBackendBaseUrl()}/api/v1/auth/refresh`,
        {
          method: 'POST',
          headers: await getServerAuthHeaders(cookieHeader),
          cache: 'no-store',
        },
      );

      if (refreshRes.ok) {
        const setCookies =
          typeof refreshRes.headers.getSetCookie === 'function'
            ? refreshRes.headers.getSetCookie()
            : [];
        await persistAuthSetCookies(setCookies);
        cookieHeader = mergeAuthSetCookies(cookieHeader, setCookies);
        res = await fetch(url, {
          ...init,
          headers: {
            ...(init.headers as Record<string, string>),
            ...(await getServerAuthHeaders(cookieHeader)),
          },
          cache: 'no-store',
        });
      }
    }

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
