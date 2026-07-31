import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AuthUser } from '@/lib/api';
import { mergeAuthSetCookies, persistAuthSetCookies, getServerAuthHeaders } from '@rukny/auth/server';
import { ADMIN_ROLE } from '@/lib/auth-cookies';
import { resolveMediaUrl } from '@/lib/media-url';

export type DashboardUser = AuthUser;

export async function getDashboardUser(): Promise<DashboardUser> {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore.getAll());

  const accessToken =
    cookieStore.get('__Secure-access_token')?.value ||
    cookieStore.get('access_token')?.value;

  const refreshToken =
    cookieStore.get('__Secure-refresh_token')?.value ||
    cookieStore.get('refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    redirectToLogin();
  }

  const user = await fetchCurrentUser(cookieHeader);
  if (!user) {
    redirectToLogin();
  }

  if (user.role !== ADMIN_ROLE) {
    redirect('/forbidden');
  }

  return user;
}

function buildCookieHeader(items: { name: string; value: string }[]): string {
  return items.map((c) => `${c.name}=${c.value}`).join('; ');
}

async function fetchCurrentUser(
  cookieHeader: string,
): Promise<DashboardUser | null> {
  const backendUrl =
    process.env.API_BACKEND_URL ||
    process.env.API_URL ||
    'http://localhost:3001';
  const meUrl = `${backendUrl}/api/v1/auth/me`;

  try {
    let res = await fetch(meUrl, {
      headers: await getServerAuthHeaders(cookieHeader),
      cache: 'no-store',
    });

    if (res.status === 401) {
      const refreshRes = await fetch(`${backendUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: await getServerAuthHeaders(cookieHeader),
        cache: 'no-store',
      });

      if (refreshRes.ok) {
        const setCookies =
          typeof refreshRes.headers.getSetCookie === 'function'
            ? refreshRes.headers.getSetCookie()
            : [];
        await persistAuthSetCookies(setCookies);
        const merged = mergeAuthSetCookies(cookieHeader, setCookies);
        res = await fetch(meUrl, {
          headers: await getServerAuthHeaders(merged),
          cache: 'no-store',
        });
      }
    }

    if (!res.ok) return null;
    const data = await res.json();
    const user =
      data && typeof data === 'object' && 'user' in data
        ? (data as { user: DashboardUser }).user
        : (data as DashboardUser);
    return {
      ...user,
      avatar: resolveMediaUrl(user.avatar) ?? undefined,
    };
  } catch {
    return null;
  }
}

function redirectToLogin(): never {
  redirect('/login?next=/app');
}
