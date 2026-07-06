import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveMediaUrl } from '@/lib/media-url';

export interface DashboardUser {
  id: string;
  email: string;
  role: string;
  name?: string;
  username?: string;
  avatar?: string;
}

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
  if (user) return user;

  redirectToLogin();
}

function buildCookieHeader(
  items: { name: string; value: string }[],
): string {
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
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      cache: 'no-store',
    });

    if (res.status === 401) {
      const refreshRes = await fetch(`${backendUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: cookieHeader ? { Cookie: cookieHeader } : {},
        cache: 'no-store',
      });

      if (refreshRes.ok) {
        const setCookies =
          typeof refreshRes.headers.getSetCookie === 'function'
            ? refreshRes.headers.getSetCookie()
            : [];
        const merged = mergeSetCookies(cookieHeader, setCookies);
        res = await fetch(meUrl, {
          headers: merged ? { Cookie: merged } : {},
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

function mergeSetCookies(existing: string, setCookies: string[]): string {
  const jar = new Map<string, string>();

  for (const part of existing
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)) {
    const eq = part.indexOf('=');
    if (eq > 0) jar.set(part.slice(0, eq), part.slice(eq + 1));
  }

  for (const raw of setCookies) {
    const pair = raw.split(';')[0]?.trim();
    if (!pair) continue;
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }

  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function redirectToLogin(): never {
  redirect('/login?next=/app');
}
