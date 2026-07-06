import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import type { AuthUser } from '@/lib/api';
import type { DeveloperApp, DeveloperApiKey } from '@/lib/api/types';
import { isValidAppId } from '@/lib/api/types';
import { resolveMediaUrl } from '@/lib/media-url';
import type { InstalledProduct } from '@/lib/api/products';
import type { DeveloperProductId } from '@/lib/developer-products';
import { appProducts } from '@/lib/app-routes';
import { mergeAuthSetCookies, persistAuthSetCookies } from '@rukny/auth/server';

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
        await persistAuthSetCookies(setCookies);
        const merged = mergeAuthSetCookies(cookieHeader, setCookies);
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

function redirectToLogin(): never {
  redirect('/login?next=/apps');
}

function getBackendUrl(): string {
  return (
    process.env.API_BACKEND_URL ||
    process.env.API_URL ||
    'http://localhost:3001'
  );
}

async function fetchWithAuth<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore.getAll());
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}/api/v1${path.startsWith('/') ? path : `/${path}`}`;

  try {
    let res = await fetch(url, {
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
        await persistAuthSetCookies(setCookies);
        const merged = mergeAuthSetCookies(cookieHeader, setCookies);
        res = await fetch(url, {
          headers: merged ? { Cookie: merged } : {},
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

export async function fetchUserApps(): Promise<DeveloperApp[]> {
  await getDashboardUser();
  const data = await fetchWithAuth<DeveloperApp[]>('/developer/apps');
  return Array.isArray(data) ? data : [];
}

export async function requireAppForUser(appId: string): Promise<DeveloperApp> {
  if (!isValidAppId(appId)) {
    notFound();
  }

  await getDashboardUser();
  const app = await fetchWithAuth<DeveloperApp>(`/developer/apps/${appId}`);
  if (!app) {
    notFound();
  }

  return app;
}

export async function fetchInstalledProducts(
  appId: string,
): Promise<InstalledProduct[]> {
  await getDashboardUser();
  const data = await fetchWithAuth<InstalledProduct[]>(
    `/developer/apps/${encodeURIComponent(appId)}/products`,
  );
  return Array.isArray(data) ? data : [];
}

export async function requireProductInstalled(
  appId: string,
  productId: DeveloperProductId,
): Promise<void> {
  const installed = await fetchInstalledProducts(appId);
  if (!installed.some((p) => p.productId === productId)) {
    redirect(`${appProducts(appId)}?need=${encodeURIComponent(productId)}`);
  }
}

export async function fetchApiKeysForApp(
  developerAppId: string,
): Promise<DeveloperApiKey[]> {
  await getDashboardUser();
  const data = await fetchWithAuth<DeveloperApiKey[]>(
    `/developer/api-keys?developerAppId=${encodeURIComponent(developerAppId)}`,
  );
  return Array.isArray(data) ? data : [];
}
