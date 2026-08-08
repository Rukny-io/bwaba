'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '@heroui/react';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  Clock,
  Eye,
  Inbox,
  TrendingUp,
} from 'lucide-react';
import { APP_BASE } from '@/components/app/nav-config';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { DashboardErrorState } from '@/components/app/dashboard-error-state';
import {
  AnalyticsDeviceBreakdown,
} from '@/components/analytics/analytics-device-breakdown';
import {
  AnalyticsPeriodPicker,
  type AnalyticsPeriodDays,
} from '@/components/analytics/analytics-period-picker';
import { AnalyticsGeoMap } from '@/components/analytics/analytics-geo-map';
import { AnalyticsTrendChart } from '@/components/analytics/analytics-trend-chart';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
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
import {
  formDetailCardClass,
  formDetailCardSurfaceClass,
  submissionAnswerInsetClass,
} from '@/lib/form-detail-styles';
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
      <div className="flex flex-col gap-6 sm:gap-8">
        <Skeleton className="h-10 w-64 rounded-full" />
        <div className="grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[7.25rem] rounded-[25px]" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-[25px]" />
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
  const avgTimeLabel =
    summary.avgTimeToComplete >= 60
      ? `${(summary.avgTimeToComplete / 60).toFixed(1)} د`
      : `${summary.avgTimeToComplete} ث`;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SettingsSectionCard
        plain
        title="تحليلات"
        description="نظرة عامة على أداء جميع نماذجك"
      >
        <div className={cn(formDetailCardClass, 'items-center sm:flex-row sm:justify-between')}>
          <p className="text-[13px] text-[var(--muted-foreground)]">
            الفترة:{' '}
            <span dir="ltr" lang="en" className="tabular-nums">
              {formatFormDate(data.period.startDate)} —{' '}
              {formatFormDate(data.period.endDate)}
            </span>
          </p>
          <AnalyticsPeriodPicker value={days} onChange={setDays} />
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        plain
        title="ملخص الأداء"
        description="مقاييس رئيسية لجميع النماذج في الفترة المحددة"
      >
        <div className="grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-4">
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
          <DashboardMetricCard
            icon={Clock}
            label="متوسط وقت الإكمال"
            value={avgTimeLabel}
            comparisonPrimary="في الفترة"
            comparisonSecondary="متوسط وقت وصول الإكمال"
          />
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        plain
        title="الاتجاه والأجهزة"
        description="المشاهدات والاستجابات اليومية وتوزيع الأجهزة"
      >
        <div className="grid grid-cols-1 gap-[12px] xl:grid-cols-3">
          <article className={cn(formDetailCardClass, 'xl:col-span-2')}>
            <h2 className="text-[14px] font-semibold text-[var(--foreground)]">
              الاتجاه اليومي
            </h2>
            <AnalyticsTrendChart data={data.dailyTrend} height={220} />
          </article>

          <article className={formDetailCardClass}>
            <h2 className="text-[14px] font-semibold text-[var(--foreground)]">
              الأجهزة
            </h2>
            <AnalyticsDeviceBreakdown items={data.deviceBreakdown} />
          </article>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard plain title="التوزيع الجغرافي" description="خريطة تفاعلية لزوار النماذج">
        <div className={formDetailCardSurfaceClass}>
          <AnalyticsGeoMap data={data.geoBreakdown} />
        </div>
      </SettingsSectionCard>

      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
        <SettingsSectionCard plain title="أفضل النماذج" description="النماذج الأعلى استجابة في الفترة">
          {data.topForms.length === 0 ? (
            <p className="text-[13px] italic text-[var(--muted-foreground)]">
              لا توجد استجابات في هذه الفترة
            </p>
          ) : (
            <ul className="flex flex-col gap-[12px]">
              {data.topForms.map((form, i) => (
                <li key={form.id}>
                  <Link
                    href={`${APP_BASE}/forms/${form.id}/analytics`}
                    className={cn(
                      submissionAnswerInsetClass,
                      'flex items-center gap-3 transition-colors hover:bg-[var(--surface-secondary)]/70',
                    )}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-[var(--foreground)]">
                        {form.title}
                      </p>
                      <p className="text-[12px] text-[var(--muted-foreground)]">
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
        </SettingsSectionCard>

        <SettingsSectionCard
          plain
          title="يحتاج انتباهك"
          description="نماذج قد تحتاج مراجعة أو تحسين"
        >
          {data.needsAttention.length === 0 ? (
            <p className="text-[13px] text-[var(--muted-foreground)]">
              كل شيء يبدو جيداً في هذه الفترة.
            </p>
          ) : (
            <ul className="flex flex-col gap-[12px]">
              {data.needsAttention.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`${APP_BASE}/forms/${item.id}/analytics`}
                    className="block rounded-[25px] border border-[var(--warning)]/25 bg-[var(--warning)]/5 px-3.5 py-2.5 transition-colors hover:bg-[var(--warning)]/10"
                  >
                    <p className="text-[14px] font-medium text-[var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="text-[12px] text-[var(--muted-foreground)]">
                      {item.reason}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SettingsSectionCard>
      </div>

      <SettingsSectionCard plain title="كل النماذج" description="جدول تفصيلي لأداء كل نموذج">
        <div className={formDetailCardSurfaceClass}>
          {data.forms.length === 0 ? (
            <p className="text-[13px] italic text-[var(--muted-foreground)]">
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
        </div>
      </SettingsSectionCard>
    </div>
  );
}
