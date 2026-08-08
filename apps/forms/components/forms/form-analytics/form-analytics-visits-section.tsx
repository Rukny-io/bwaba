'use client';

import { BarChart2, Eye, Share2 } from 'lucide-react';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { AnalyticsSingleMetricChart } from '@/components/analytics/analytics-single-metric-chart';
import { formDetailCardClass } from '@/lib/form-detail-styles';
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

  const metrics = (
    <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3">
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
  );

  const charts = (
    <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-2">
      <article className={formDetailCardClass}>
        <h4 className="text-[14px] font-semibold text-[var(--foreground)]">
          المشاهدات اليومية
        </h4>
        <AnalyticsSingleMetricChart
          data={trendData}
          metric="views"
          label="مشاهدات"
          height={200}
        />
      </article>

      <article className={formDetailCardClass}>
        <h4 className="text-[14px] font-semibold text-[var(--foreground)]">
          الإجابات اليومية
        </h4>
        <AnalyticsSingleMetricChart
          data={trendData}
          metric="submissions"
          label="استجابات"
          height={200}
        />
      </article>
    </div>
  );

  if (compact) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8">
        <SettingsSectionCard
          plain
          title="الزيارات"
          description="مشاهدات النموذج ومشاركات الرابط ومعدل الإجابات"
        >
          {metrics}
        </SettingsSectionCard>
        <SettingsSectionCard
          plain
          title="الاتجاه اليومي"
          description="مقارنة المشاهدات والإجابات يوماً بيوم"
        >
          {charts}
        </SettingsSectionCard>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {metrics}
      {charts}
    </section>
  );
}
