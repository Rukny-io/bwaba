import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getServerAuthHeaders,
  mergeAuthSetCookies,
  persistAuthSetCookies,
} from '@rukny/auth/server';
import type { AuthUser } from '@/lib/api';
import { DEFAULT_APP_PATH } from '@/lib/auth-redirect';
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
  redirect(`/login?next=${encodeURIComponent(DEFAULT_APP_PATH)}`);
}

/** قائمة مساحات العمل المتاحة للمستخدم (شخصية + مساحات هو عضو فيها). */
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
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore.getAll());
  const backendUrl =
    process.env.API_BACKEND_URL ||
    process.env.API_URL ||
    'http://localhost:3001';

  try {
    const res = await fetch(`${backendUrl}/api/v1/workspace/accessible`, {
      headers: await getServerAuthHeaders(cookieHeader),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as AccessibleWorkspaceDto[]) : [];
  } catch {
    return [];
  }
}

const ACTIVE_WORKSPACE_COOKIE_NAME = 'active_workspace_id';
const ID_RE = /^[A-Za-z0-9_-]+$/;

function isValidWorkspaceId(value: string | undefined): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 128 &&
    ID_RE.test(value)
  );
}

/**
 * مساحة العمل النشطة الحالية (null إذا كانت شخصية).
 * تستخدمها التخطيطات لعرض شريط تنبيه ولحساب صلاحيات الأزرار.
 */
export async function resolveActiveWorkspace(
  currentUserId: string,
  workspaces?: AccessibleWorkspaceDto[],
): Promise<AccessibleWorkspaceDto | null> {
  const list = workspaces ?? (await fetchAccessibleWorkspaces());
  const cookieStore = await cookies();
  const active = cookieStore.get(ACTIVE_WORKSPACE_COOKIE_NAME)?.value;
  if (!isValidWorkspaceId(active)) return null;
  if (active === currentUserId) return null;
  const ws = list.find((w) => w.id === active);
  if (!ws || ws.isOwner) return null;
  return ws;
}
