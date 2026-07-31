import { cookies } from 'next/headers';
import { getServerAuthHeaders } from '@rukny/auth/server';
import { buildAppInsights } from '@/lib/analytics/insights';
import {
  normalizeAnalyticsOverview,
  type AnalyticsOverview,
} from '@/lib/analytics/types';
import {
  EMPTY_COMMERCE,
  type CommerceSnapshot,
  type LowStockProduct,
  type OrderStats,
  type ProductStats,
  type StoreOrderSummary,
  type StoreStats,
  type TopProduct,
  type WeeklySalesDay,
} from '@/lib/commerce/types';
import type { DashboardHomeData, ProfileMe } from '@/lib/dashboard/types';
import type { SocialLink } from '@/lib/links/types';

const EMPTY_ANALYTICS: AnalyticsOverview = {
  summary: {
    totalClicks: 0,
    totalLinkViews: 0,
    linksCount: 0,
    changes: { clicks: 0 },
  },
  chartData: [],
  deviceBreakdown: [],
  countryBreakdown: [],
  referrerBreakdown: [],
  topLinks: [],
};

function buildCookieHeader(items: { name: string; value: string }[]): string {
  return items.map((c) => `${c.name}=${c.value}`).join('; ');
}

async function apiFetch<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore.getAll());
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

interface MyProductRow {
  id: string;
  name: string;
  quantity: number;
  status: string;
}

interface StoreOrderRow {
  id: string;
  orderNumber?: string | null;
  status: string;
  total: number;
  currency?: string;
  createdAt: string;
  customer?: { name?: string | null };
  itemsCount?: number;
}

async function fetchCommerceSnapshot(): Promise<CommerceSnapshot> {
  const [
    storeStats,
    orderStats,
    productStats,
    weeklySalesRes,
    topProductsRes,
    recentOrders,
    myProducts,
  ] = await Promise.all([
    apiFetch<StoreStats>('/stores/stats'),
    apiFetch<OrderStats>('/orders/store/stats'),
    apiFetch<ProductStats>('/products/stats'),
    apiFetch<{ days: WeeklySalesDay[] }>('/stores/stats/weekly-sales'),
    apiFetch<{ data: TopProduct[] }>('/products/store/top?limit=5'),
    apiFetch<StoreOrderRow[]>('/orders/store/orders?limit=5'),
    apiFetch<MyProductRow[]>('/products/my-products'),
  ]);

  const products = myProducts ?? [];
  const lowStockProducts: LowStockProduct[] = products
    .filter(
      (p) =>
        p.status === 'ACTIVE' &&
        typeof p.quantity === 'number' &&
        p.quantity > 0 &&
        p.quantity <= 5,
    )
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      status: p.status,
    }));

  return {
    storeStats: storeStats ?? EMPTY_COMMERCE.storeStats,
    orderStats: orderStats ?? EMPTY_COMMERCE.orderStats,
    productStats: productStats ?? EMPTY_COMMERCE.productStats,
    weeklySales: weeklySalesRes?.days ?? [],
    topProducts: topProductsRes?.data ?? [],
    recentOrders: (recentOrders ?? []).map(
      (order): StoreOrderSummary => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: Number(order.total),
        currency: order.currency,
        createdAt: order.createdAt,
        customerName: order.customer?.name,
        itemsCount: order.itemsCount,
      }),
    ),
    lowStockProducts,
  };
}

export async function getDashboardHomeData(days = 30): Promise<DashboardHomeData> {
  const [analyticsRaw, commerce, links, profile] = await Promise.all([
    apiFetch<Record<string, unknown>>(`/analytics/overview?days=${days}`),
    fetchCommerceSnapshot(),
    apiFetch<SocialLink[]>('/social-links/my-links'),
    apiFetch<ProfileMe>('/profiles/me'),
  ]);

  const analytics = analyticsRaw
    ? normalizeAnalyticsOverview(analyticsRaw)
    : EMPTY_ANALYTICS;
  const linkList = links ?? [];

  return {
    analytics,
    commerce,
    links: linkList,
    insights: buildAppInsights({ analytics, commerce, links: linkList }),
    profile: profile ?? null,
  };
}
