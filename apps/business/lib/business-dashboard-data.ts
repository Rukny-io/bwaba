import { cookies } from 'next/headers';
import { getServerAuthHeaders } from '@rukny/auth/server';
import { formatNumber } from '@/lib/dashboard-format';

export interface MetricCardData {
  value: string;
  trend?: string;
  trendPositive?: boolean;
  chip?: string;
  chipTone?: 'success' | 'warning' | 'neutral' | 'danger';
  tabular?: boolean;
  comparisonPrimary?: string;
  comparisonSecondary?: string;
}

export interface InstagramAccountSummary {
  id: string;
  username: string;
  name?: string | null;
  profilePicUrl?: string | null;
  followersCount?: number | null;
  createdAt?: string;
}

export interface BusinessDashboardMetrics {
  connectedAccounts: MetricCardData;
  unreadMessages: MetricCardData;
  openThreads: MetricCardData;
  channelsReady: MetricCardData;
}

export interface BusinessDashboardHomeData {
  metrics: BusinessDashboardMetrics;
  connectedAccounts: InstagramAccountSummary[];
}

function buildCookieHeader(items: { name: string; value: string }[]): string {
  return items.map((c) => `${c.name}=${c.value}`).join('; ');
}

function getBackendUrl(): string {
  return (
    process.env.API_BACKEND_URL ||
    process.env.API_URL ||
    'http://localhost:3001'
  );
}

async function fetchInstagramConnections(): Promise<InstagramAccountSummary[]> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = buildCookieHeader(cookieStore.getAll());
    const res = await fetch(
      `${getBackendUrl()}/api/v1/integrations/instagram/connections`,
      {
        headers: await getServerAuthHeaders(cookieHeader),
        cache: 'no-store',
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      connections?: InstagramAccountSummary[];
    };
    return data.connections ?? [];
  } catch {
    return [];
  }
}

function buildMetrics(accounts: InstagramAccountSummary[]): BusinessDashboardMetrics {
  const count = accounts.length;
  const instagramReady = count > 0;

  return {
    connectedAccounts: {
      value: formatNumber(count),
      chip: instagramReady ? 'Instagram متصل' : 'لا حسابات بعد',
      chipTone: instagramReady ? 'success' : 'neutral',
      comparisonPrimary: 'حسابات Professional',
      tabular: true,
    },
    unreadMessages: {
      value: formatNumber(0),
      chip: 'قريباً',
      chipTone: 'warning',
      comparisonPrimary: 'رسائل غير مقروءة',
      tabular: true,
    },
    openThreads: {
      value: formatNumber(0),
      chip: 'قريباً',
      chipTone: 'warning',
      comparisonPrimary: 'محادثات مفتوحة',
      tabular: true,
    },
    channelsReady: {
      value: instagramReady ? 'Instagram' : '—',
      tabular: false,
      chip: instagramReady ? 'Messenger قريباً' : 'اربط قناة',
      chipTone: instagramReady ? 'neutral' : 'warning',
      comparisonPrimary: 'القنوات النشطة',
    },
  };
}

export async function getBusinessDashboardHomeData(): Promise<BusinessDashboardHomeData> {
  const connectedAccounts = await fetchInstagramConnections();

  return {
    metrics: buildMetrics(connectedAccounts),
    connectedAccounts: connectedAccounts.slice(0, 3),
  };
}
