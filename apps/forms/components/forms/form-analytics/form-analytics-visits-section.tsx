'use client';

import { BarChart2, Eye, Share2 } from 'lucide-react';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import { AnalyticsSingleMetricChart } from '@/components/analytics/analytics-single-metric-chart';
import type { FormAnalyticsResponse } from '@/lib/forms-api';
import {
  formatNumber,
  formatPercent,
  formatTrendBadge,
} from '@/lib/dashboard-format';

export function FormAnalyticsVisitsSection({
  data,
  compact = false,
}: {
  data: FormAnalyticsResponse;
  compact?: boolean;
}) {
  const { summary } = data;
  const visits = data.visits ?? { totalShares: 0, sharesTrend: 0 };
  const trendData =
    data.dailyTrend ??
    data.submissionsByDay.map((d) => ({
      date: d.date,
      views: 0,
      submissions: d.count,
    }));

  return (
    <section className="space-y-4">
      {!compact ? (
        <header>
          <h3 className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
            الزيارات
          </h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            مشاهدات النموذج ومشاركات الرابط ومعدل الإجابات
          </p>
        </header>
      ) : null}

      <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3">
        <DashboardMetricCard
          icon={Eye}
          label="مشاهدات النموذج"
          value={formatNumber(summary.totalViews)}
          trend={formatTrendBadge(summary.viewsTrend)}
          trendPositive={(summary.viewsTrend ?? 0) >= 0}
          comparisonPrimary="في الفترة"
          comparisonSecondary="مقابل السابقة"
        />
        <DashboardMetricCard
          icon={Share2}
          label="المشاركات"
          value={formatNumber(visits.totalShares)}
          trend={formatTrendBadge(visits.sharesTrend)}
          trendPositive={(visits.sharesTrend ?? 0) >= 0}
          comparisonPrimary="نسخ / مشاركة الرابط"
          comparisonSecondary="في الفترة"
        />
        <DashboardMetricCard
          icon={BarChart2}
          label="معدل الإجابات"
          value={formatPercent(summary.completionRate)}
          trend={formatTrendBadge(summary.completionRateTrend)}
          trendPositive={(summary.completionRateTrend ?? 0) >= 0}
          comparisonPrimary="استجابات ÷ مشاهدات"
          comparisonSecondary="في الفترة"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <DashboardSurface as="article">
          <h4 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            المشاهدات اليومية
          </h4>
          <AnalyticsSingleMetricChart
            data={trendData}
            metric="views"
            label="مشاهدات"
            height={200}
          />
        </DashboardSurface>

        <DashboardSurface as="article">
          <h4 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            الإجابات اليومية
          </h4>
          <AnalyticsSingleMetricChart
            data={trendData}
            metric="submissions"
            label="استجابات"
            height={200}
          />
        </DashboardSurface>
      </div>
    </section>
  );
}
