'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '@heroui/react';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  Eye,
  Inbox,
  TrendingUp,
} from 'lucide-react';
import { APP_BASE } from '@/components/app/nav-config';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { DashboardErrorState } from '@/components/app/dashboard-error-state';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import {
  AnalyticsDeviceBreakdown,
} from '@/components/analytics/analytics-device-breakdown';
import {
  AnalyticsPeriodPicker,
  type AnalyticsPeriodDays,
} from '@/components/analytics/analytics-period-picker';
import { AnalyticsGeoMap } from '@/components/analytics/analytics-geo-map';
import { AnalyticsTrendChart } from '@/components/analytics/analytics-trend-chart';
import { ApiException } from '@/lib/api-client';
import { readFormsPreferences } from '@/lib/forms-preferences';
import {
  getAnalyticsOverview,
  type AnalyticsOverviewResponse,
} from '@/lib/forms-api';
import {
  FORM_STATUS_LABELS,
  formatFormDate,
  getFormTypeLabel,
} from '@/lib/forms-format';
import {
  formatNumber,
  formatPercent,
  formatTrendBadge,
} from '@/lib/dashboard-format';
import type { FormStatus, FormType } from '@/lib/forms-api';
import { cn } from '@/lib/utils';

export function AnalyticsOverviewView() {
  const [days, setDays] = useState<AnalyticsPeriodDays>(() =>
    readFormsPreferences().analyticsDefaultPeriod,
  );
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAnalyticsOverview(days);
      setData(res);
    } catch (e) {
      setError(
        e instanceof ApiException ? e.message : 'تعذّر تحميل التحليلات',
      );
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-full" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[7.25rem] rounded-2xl sm:h-28 sm:rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-2xl sm:h-64 sm:rounded-3xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <DashboardErrorState
        variant="inline"
        message={error ?? 'لا توجد بيانات'}
        onRetry={() => void load()}
      />
    );
  }

  const { summary } = data;

  return (
    <>
      <DashboardPageHeader
        title="تحليلات"
        description={
          <>
            نظرة عامة على أداء جميع نماذجك ·{' '}
            <span dir="ltr" lang="en" className="tabular-nums">
              {formatFormDate(data.period.startDate)} —{' '}
              {formatFormDate(data.period.endDate)}
            </span>
          </>
        }
        actions={<AnalyticsPeriodPicker value={days} onChange={setDays} />}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <DashboardMetricCard
          icon={Eye}
          label="المشاهدات"
          value={formatNumber(summary.views)}
          trend={formatTrendBadge(summary.viewsTrend)}
          trendPositive={summary.viewsTrend >= 0}
          comparisonPrimary="في الفترة"
          comparisonSecondary="مقابل السابقة"
        />
        <DashboardMetricCard
          icon={Inbox}
          label="الاستجابات"
          value={formatNumber(summary.submissions)}
          trend={formatTrendBadge(summary.submissionsTrend)}
          trendPositive={summary.submissionsTrend >= 0}
          comparisonPrimary="في الفترة"
          comparisonSecondary="مقابل السابقة"
        />
        <DashboardMetricCard
          icon={BarChart2}
          label="معدل الإكمال"
          value={formatPercent(summary.completionRate)}
          trend={formatTrendBadge(summary.completionRateTrend)}
          trendPositive={summary.completionRateTrend >= 0}
          comparisonPrimary="استجابات ÷ مشاهدات"
          comparisonSecondary="في الفترة"
        />
        <DashboardMetricCard
          icon={TrendingUp}
          label="نماذج نشطة"
          value={formatNumber(data.forms.filter((f) => f.status === 'PUBLISHED').length)}
          comparisonPrimary="منشورة"
          comparisonSecondary={`من ${data.forms.length}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-3">
        <DashboardSurface as="article" className="xl:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)] sm:mb-4">
            الاتجاه اليومي
          </h2>
          <AnalyticsTrendChart data={data.dailyTrend} height={220} />
        </DashboardSurface>

        <DashboardSurface as="article">
          <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
            الأجهزة
          </h2>
          <AnalyticsDeviceBreakdown items={data.deviceBreakdown} />
        </DashboardSurface>
      </div>

      <DashboardSurface as="article">
        <AnalyticsGeoMap data={data.geoBreakdown} />
      </DashboardSurface>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <DashboardSurface as="article">
          <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
            أفضل النماذج
          </h2>
          {data.topForms.length === 0 ? (
            <p className="text-sm italic text-[var(--muted-foreground)]">
              لا توجد استجابات في هذه الفترة
            </p>
          ) : (
            <ul className="space-y-2">
              {data.topForms.map((form, i) => (
                <li key={form.id}>
                  <Link
                    href={`${APP_BASE}/forms/${form.id}/analytics`}
                    className="flex items-center gap-3 rounded-xl bg-[var(--surface-secondary)] px-3.5 py-2.5 transition-colors hover:bg-[var(--surface-secondary)]/80"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {form.title}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        <span dir="ltr" lang="en" className="tabular-nums">
                          {formatNumber(form.submissions)}
                        </span>{' '}
                        استجابة ·{' '}
                        <span dir="ltr" lang="en" className="tabular-nums">
                          {formatPercent(form.completionRate)}
                        </span>{' '}
                        إكمال
                      </p>
                    </div>
                    <ArrowLeft className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardSurface>

        <DashboardSurface as="article">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            <AlertTriangle className="size-4 text-[var(--warning)]" />
            يحتاج انتباهك
          </h2>
          {data.needsAttention.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              كل شيء يبدو جيداً في هذه الفترة.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.needsAttention.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`${APP_BASE}/forms/${item.id}/analytics`}
                    className="block rounded-xl border border-[var(--warning)]/20 bg-[var(--warning)]/5 px-3.5 py-2.5 transition-colors hover:bg-[var(--warning)]/10"
                  >
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {item.reason}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardSurface>
      </div>

      <DashboardSurface as="article">
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
          كل النماذج
        </h2>
        {data.forms.length === 0 ? (
          <p className="text-sm italic text-[var(--muted-foreground)]">
            لا توجد نماذج بعد
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-start text-xs text-[var(--muted-foreground)]">
                  <th className="pb-3 pe-4 font-medium">النموذج</th>
                  <th className="pb-3 pe-4 font-medium">الحالة</th>
                  <th className="pb-3 pe-4 font-medium">النوع</th>
                  <th className="pb-3 pe-4 text-end font-medium">مشاهدات</th>
                  <th className="pb-3 pe-4 text-end font-medium">استجابات</th>
                  <th className="pb-3 text-end font-medium">إكمال</th>
                </tr>
              </thead>
              <tbody>
                {data.forms.map((form) => (
                  <tr
                    key={form.id}
                    className="border-b border-[var(--border)]/60 last:border-0"
                  >
                    <td className="py-3 pe-4">
                      <Link
                        href={`${APP_BASE}/forms/${form.id}/analytics`}
                        className="font-medium text-[var(--foreground)] hover:text-[var(--primary)]"
                      >
                        {form.title}
                      </Link>
                    </td>
                    <td className="py-3 pe-4">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          form.status === 'PUBLISHED'
                            ? 'bg-[var(--success)]/15 text-[var(--success)]'
                            : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
                        )}
                      >
                        {FORM_STATUS_LABELS[form.status as FormStatus] ??
                          form.status}
                      </span>
                    </td>
                    <td className="py-3 pe-4 text-[var(--muted-foreground)]">
                      {getFormTypeLabel(form.type as FormType)}
                    </td>
                    <td className="py-3 pe-4 text-end tabular-nums">
                      {formatNumber(form.views)}
                    </td>
                    <td className="py-3 pe-4 text-end tabular-nums font-medium">
                      {formatNumber(form.submissions)}
                    </td>
                    <td className="py-3 text-end tabular-nums">
                      {formatPercent(form.completionRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSurface>
    </>
  );
}
