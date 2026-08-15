import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import type { AuthUser } from '@/lib/api';
import type { DeveloperApp, DeveloperApiKey } from '@/lib/api/types';
import { isValidAppId } from '@/lib/api/types';
import { resolveMediaUrl } from '@/lib/media-url';
import type { InstalledProduct } from '@/lib/api/products';
import type { DeveloperProductId } from '@/lib/developer-products';
import { appProducts } from '@/lib/app-routes';
import { mergeAuthSetCookies, persistAuthSetCookies, getServerAuthHeaders } from '@rukny/auth/server';
import {
  ACTIVE_WORKSPACE_COOKIE,
  ACTIVE_WORKSPACE_HEADER,
  isValidWorkspaceId,
} from '@/lib/workspace';

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
    redirectToLogin(accessToken || refreshToken ? 'invalid' : undefined);
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

function redirectToLogin(session?: 'expired' | 'invalid'): never {
  const params = new URLSearchParams({ next: '/apps' });
  if (session) params.set('session', session);
  redirect(`/login?${params.toString()}`);
}

function getBackendUrl(): string {
  return (
    process.env.API_BACKEND_URL ||
    process.env.API_URL ||
    'http://localhost:3001'
  );
}

async function buildServerHeaders(cookieHeader: string): Promise<Record<string, string>> {
  const headers = { ...(await getServerAuthHeaders(cookieHeader)) };
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  if (isValidWorkspaceId(workspaceId)) {
    headers[ACTIVE_WORKSPACE_HEADER] = workspaceId;
  }
  return headers;
}

async function fetchWithAuth<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore.getAll());
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}/api/v1${path.startsWith('/') ? path : `/${path}`}`;

  try {
    let res = await fetch(url, {
      headers: await buildServerHeaders(cookieHeader),
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
        res = await fetch(url, {
          headers: await buildServerHeaders(merged),
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

/**
 * قائمة مساحات العمل التي يستطيع المستخدم الوصول إليها (شخصية + مساحات هو عضو نشط فيها).
 * تُستخدم لبناء مبدّل مساحات العمل.
 */
export interface AccessibleWorkspaceDto {
  id: string;
  ownerId: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'SUPPORT' | 'VIEWER';
  isOwner: boolean;
  owner: {
    email: string;
    profile: {
      name: string | null;
      username: string | null;
      avatar: string | null;
    } | null;
  };
}

export async function fetchAccessibleWorkspaces(): Promise<
  AccessibleWorkspaceDto[]
> {
  const data = await fetchWithAuth<AccessibleWorkspaceDto[]>(
    '/workspace/accessible',
  );
  return Array.isArray(data) ? data : [];
}

/**
 * يستنتج مساحة العمل النشطة الحالية من الـ cookie + قائمة المساحات المتاحة.
 * يُعيد `null` إذا كان المستخدم داخل مساحته الشخصية (لا داعي لتنبيه).
 */
export async function resolveActiveWorkspace(
  currentUserId: string,
  workspaces?: AccessibleWorkspaceDto[],
): Promise<AccessibleWorkspaceDto | null> {
  const list = workspaces ?? (await fetchAccessibleWorkspaces());
  const cookieStore = await cookies();
  const active = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  if (!isValidWorkspaceId(active)) return null;
  if (active === currentUserId) return null;
  const ws = list.find((w) => w.id === active);
  if (!ws || ws.isOwner) return null;
  return ws;
}
