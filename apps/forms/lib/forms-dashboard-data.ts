import { cookies } from 'next/headers';
import { getServerAuthHeaders } from '@rukny/auth/server';
import {
  formatNumber,
  formatPercent,
  formatTrendPercent,
} from '@/lib/dashboard-format';
import type { FormListItem } from '@/lib/forms-api';

interface DashboardFormsStats {
  active: number;
  total: number;
  submissions: number;
  submissionsThisMonth: number;
  submissionsLastMonth: number;
  views: number;
  completionRate: number;
  completionRateThisMonth: number;
  completionRateLastMonth: number;
  themed: number;
  createdThisMonth: number;
  createdLastMonth: number;
}

interface DashboardStatsResponse {
  forms: DashboardFormsStats;
}

export interface MetricCardData {
  value: string;
  trend?: string;
  trendPositive?: boolean;
}

export interface FormsDashboardMetrics {
  activeForms: MetricCardData;
  submissions: MetricCardData;
  themedForms: MetricCardData;
  completionRate: MetricCardData;
}

export interface DashboardActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string;
  createdAt: string;
}

export interface FormsDashboardHomeData {
  metrics: FormsDashboardMetrics;
  recentForms: FormListItem[];
  recentSubmissions: DashboardActivityItem[];
  recentActivity: DashboardActivityItem[];
}

const EMPTY_FORMS: DashboardFormsStats = {
  active: 0,
  total: 0,
  submissions: 0,
  submissionsThisMonth: 0,
  submissionsLastMonth: 0,
  views: 0,
  completionRate: 0,
  completionRateThisMonth: 0,
  completionRateLastMonth: 0,
  themed: 0,
  createdThisMonth: 0,
  createdLastMonth: 0,
};

const FORM_ACTIVITY_TYPES = new Set([
  'form_created',
  'form_updated',
  'form_submission',
]);

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

async function getAuthCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return buildCookieHeader(cookieStore.getAll());
}

async function fetchDashboardStats(): Promise<DashboardStatsResponse | null> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/dashboard/stats`, {
      headers: await getServerAuthHeaders(await getAuthCookieHeader()),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as DashboardStatsResponse;
  } catch {
    return null;
  }
}

async function fetchRecentForms(): Promise<FormListItem[]> {
  try {
    const url = new URL(`${getBackendUrl()}/api/v1/forms`);
    url.searchParams.set('page', '1');
    url.searchParams.set('limit', '3');
    url.searchParams.set('visibility', 'active');

    const res = await fetch(url.toString(), {
      headers: await getServerAuthHeaders(await getAuthCookieHeader()),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { forms?: FormListItem[] };
    return Array.isArray(data.forms) ? data.forms : [];
  } catch {
    return [];
  }
}

function normalizeActivityHref(href: string): string {
  return href
    .replace(/\/responses\/?$/, '/submissions')
    .replace(/\/responses\//, '/submissions/');
}

async function fetchRecentActivity(
  limit = 12,
): Promise<DashboardActivityItem[]> {
  try {
    const url = new URL(`${getBackendUrl()}/api/v1/dashboard/activity`);
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url.toString(), {
      headers: await getServerAuthHeaders(await getAuthCookieHeader()),
      cache: 'no-store',
    });
    if (!res.ok) return [];

    const data = (await res.json()) as DashboardActivityItem[];
    if (!Array.isArray(data)) return [];

    return data
      .filter((item) => FORM_ACTIVITY_TYPES.has(item.type))
      .map((item) => ({
        ...item,
        href: normalizeActivityHref(item.href || '#'),
        createdAt:
          typeof item.createdAt === 'string'
            ? item.createdAt
            : new Date(item.createdAt).toISOString(),
      }));
  } catch {
    return [];
  }
}

function toMetricCard(
  trend: ReturnType<typeof formatTrendPercent>,
  value: string,
): MetricCardData {
  return {
    value,
    trend: trend?.label,
    trendPositive: trend?.positive,
  };
}

function buildMetrics(forms: DashboardFormsStats): FormsDashboardMetrics {
  const activeTrend = formatTrendPercent(
    forms.createdThisMonth,
    forms.createdLastMonth,
  );
  const submissionsTrend = formatTrendPercent(
    forms.submissionsThisMonth,
    forms.submissionsLastMonth,
  );
  const completionTrend = formatTrendPercent(
    forms.completionRateThisMonth,
    forms.completionRateLastMonth,
  );

  return {
    activeForms: toMetricCard(activeTrend, formatNumber(forms.active)),
    submissions: toMetricCard(
      submissionsTrend,
      formatNumber(forms.submissions),
    ),
    themedForms: {
      value: formatNumber(forms.themed),
    },
    completionRate: toMetricCard(
      completionTrend,
      formatPercent(forms.completionRate),
    ),
  };
}

export async function getFormsDashboardMetrics(): Promise<FormsDashboardMetrics> {
  const stats = await fetchDashboardStats();
  return buildMetrics(stats?.forms ?? EMPTY_FORMS);
}

export async function getFormsDashboardHomeData(): Promise<FormsDashboardHomeData> {
  const [stats, recentForms, activity] = await Promise.all([
    fetchDashboardStats(),
    fetchRecentForms(),
    fetchRecentActivity(16),
  ]);

  const sortedForms = [...recentForms]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 3);

  const recentSubmissions = activity
    .filter((item) => item.type === 'form_submission')
    .slice(0, 3);

  const recentActivity = [...activity]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);

  return {
    metrics: buildMetrics(stats?.forms ?? EMPTY_FORMS),
    recentForms: sortedForms,
    recentSubmissions,
    recentActivity,
  };
}
