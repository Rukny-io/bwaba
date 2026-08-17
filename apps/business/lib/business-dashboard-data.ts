import { cookies } from 'next/headers';
import { getServerAuthHeaders } from '@rukny/auth/server';
import { formatNumber } from '@/lib/dashboard-format';
import type { InboxConversation } from '@/lib/inbox';

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
  recentConversations: InboxConversation[];
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

async function fetchWithAuth<T>(path: string): Promise<T | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = buildCookieHeader(cookieStore.getAll());
    const res = await fetch(`${getBackendUrl()}${path}`, {
      headers: await getServerAuthHeaders(cookieHeader),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchInstagramConnections(): Promise<InstagramAccountSummary[]> {
  const data = await fetchWithAuth<{ connections?: InstagramAccountSummary[] }>(
    '/api/v1/integrations/instagram/connections',
  );
  return data?.connections ?? [];
}

async function fetchInboxConversations(): Promise<InboxConversation[]> {
  const data = await fetchWithAuth<{ conversations?: InboxConversation[] }>(
    '/api/v1/integrations/instagram/inbox/conversations?channel=instagram',
  );
  return data?.conversations ?? [];
}

function buildMetrics(
  accounts: InstagramAccountSummary[],
  conversations: InboxConversation[],
): BusinessDashboardMetrics {
  const count = accounts.length;
  const instagramReady = count > 0;
  const unreadTotal = conversations.reduce(
    (sum, conversation) => sum + conversation.unreadCount,
    0,
  );
  const openThreads = conversations.length;

  return {
    connectedAccounts: {
      value: formatNumber(count),
      chip: instagramReady ? 'Instagram متصل' : 'لا حسابات بعد',
      chipTone: instagramReady ? 'success' : 'neutral',
      comparisonPrimary: 'حسابات Professional',
      tabular: true,
    },
    unreadMessages: {
      value: formatNumber(unreadTotal),
      chip: unreadTotal > 0 ? 'تحتاج متابعة' : instagramReady ? 'لا رسائل جديدة' : 'اربط Instagram',
      chipTone: unreadTotal > 0 ? 'warning' : instagramReady ? 'success' : 'neutral',
      comparisonPrimary: 'رسائل غير مقروءة',
      tabular: true,
    },
    openThreads: {
      value: formatNumber(openThreads),
      chip:
        openThreads > 0
          ? 'Instagram Direct'
          : instagramReady
            ? 'لا محادثات بعد'
            : 'اربط Instagram',
      chipTone: openThreads > 0 ? 'success' : instagramReady ? 'neutral' : 'warning',
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
  const [connectedAccounts, conversations] = await Promise.all([
    fetchInstagramConnections(),
    fetchInboxConversations(),
  ]);

  return {
    metrics: buildMetrics(connectedAccounts, conversations),
    connectedAccounts: connectedAccounts.slice(0, 3),
    recentConversations: conversations.slice(0, 3),
  };
}
