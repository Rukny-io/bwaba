import { cookies } from 'next/headers';
import { getServerAuthHeaders } from '@rukny/auth/server';
import type {
  CommerceAnalytics,
  HqDashboardData,
  OrdersStats,
  PlatformStats,
  SystemHealth,
  UsersStats,
  VerificationStats,
} from '@/lib/types/admin';

function buildCookieHeader(items: { name: string; value: string }[]): string {
  return items.map((c) => `${c.name}=${c.value}`).join('; ');
}

async function fetchAdmin<T>(path: string, cookieHeader: string): Promise<T | null> {
  const backendUrl =
    process.env.API_BACKEND_URL ||
    process.env.API_URL ||
    'http://localhost:3001';

  try {
    const res = await fetch(`${backendUrl}/api/v1${path}`, {
      headers: await getServerAuthHeaders(cookieHeader),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getHqDashboardData(): Promise<HqDashboardData> {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore.getAll());

  const [platform, users, orders, verification, health, commerce] =
    await Promise.all([
      fetchAdmin<PlatformStats>('/admin/stats', cookieHeader),
      fetchAdmin<UsersStats>('/admin/users/stats', cookieHeader),
      fetchAdmin<OrdersStats>('/admin/orders/stats', cookieHeader),
      fetchAdmin<VerificationStats>('/admin/verification/stats', cookieHeader),
      fetchAdmin<SystemHealth>('/admin/health', cookieHeader),
      fetchAdmin<CommerceAnalytics>(
        '/admin/analytics/commerce?range=30d&limit=5',
        cookieHeader,
      ),
    ]);

  return {
    platform: platform ?? {
      users: { total: 0, newToday: 0, newThisWeek: 0, newThisMonth: 0 },
      stores: { total: 0, active: 0 },
      forms: { total: 0, active: 0 },
      events: { total: 0, active: 0 },
      orders: { total: 0 },
      mail: { total: 0, active: 0 },
    },
    users: users ?? {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      byRole: { admin: 0, premium: 0, basic: 0, guest: 0 },
      verified: 0,
      profileCompleted: 0,
      twoFactorEnabled: 0,
      activeToday: 0,
      verificationRate: 0,
    },
    orders: orders ?? {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      byStatus: {},
      revenue: { total: 0, thisMonth: 0, today: 0 },
      averageOrderValue: 0,
      cancellationRate: 0,
    },
    verification: verification ?? {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      byStatus: { pending: 0, underReview: 0, approved: 0, rejected: 0 },
      approvalRate: 0,
    },
    health,
    commerce,
  };
}
