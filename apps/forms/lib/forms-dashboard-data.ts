import { cookies } from 'next/headers';
import { getServerAuthHeaders } from '@rukny/auth/server';
import {
  formatNumber,
  formatPercent,
  formatTrendPercent,
} from '@/lib/dashboard-format';

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

function buildCookieHeader(items: { name: string; value: string }[]): string {
  return items.map((c) => `${c.name}=${c.value}`).join('; ');
}

async function fetchDashboardStats(): Promise<DashboardStatsResponse | null> {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore.getAll());
  const backendUrl =
    process.env.API_BACKEND_URL ||
    process.env.API_URL ||
    'http://localhost:3001';

  try {
    const res = await fetch(`${backendUrl}/api/v1/dashboard/stats`, {
      headers: await getServerAuthHeaders(cookieHeader),
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return (await res.json()) as DashboardStatsResponse;
  } catch {
    return null;
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

export async function getFormsDashboardMetrics(): Promise<FormsDashboardMetrics> {
  const stats = await fetchDashboardStats();
  const forms = stats?.forms ?? EMPTY_FORMS;

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
