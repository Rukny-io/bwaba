import {
  BarChart2,
  FileText,
  Inbox,
  LayoutTemplate,
} from 'lucide-react';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import type { FormsDashboardMetrics } from '@/lib/forms-dashboard-data';

interface SettingsUsageSectionProps {
  metrics: FormsDashboardMetrics;
}

export function SettingsUsageSection({ metrics }: SettingsUsageSectionProps) {
  return (
    <section className="space-y-2.5">
      <div className="px-0.5">
        <h3 className="text-[13px] font-semibold text-[var(--foreground)]">
          نشاط نماذجك
        </h3>
        <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
          ملخص سريع لأداء النماذج داخل التطبيق.
        </p>
      </div>

      <div className="grid auto-rows-fr grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
        <DashboardMetricCard
          icon={FileText}
          label="النماذج النشطة"
          value={metrics.activeForms.value}
          trend={metrics.activeForms.trend}
          trendPositive={metrics.activeForms.trendPositive}
          comparisonPrimary="نماذج منشورة"
          comparisonSecondary="مقابل الشهر الماضي"
        />
        <DashboardMetricCard
          icon={Inbox}
          label="إجمالي الاستجابات"
          value={metrics.submissions.value}
          trend={metrics.submissions.trend}
          trendPositive={metrics.submissions.trendPositive}
          comparisonPrimary="استجابات"
          comparisonSecondary="مقابل الشهر الماضي"
        />
        <DashboardMetricCard
          icon={LayoutTemplate}
          label="نماذج مخصّصة"
          value={metrics.themedForms.value}
          trend={metrics.themedForms.trend}
          trendPositive={metrics.themedForms.trendPositive}
          comparisonPrimary="بتصميم مخصص"
          comparisonSecondary="من إجمالي نماذجك"
        />
        <DashboardMetricCard
          icon={BarChart2}
          label="معدل الإكمال"
          value={metrics.completionRate.value}
          trend={metrics.completionRate.trend}
          trendPositive={metrics.completionRate.trendPositive}
          comparisonPrimary="إكمال"
          comparisonSecondary="مقابل الشهر الماضي"
        />
      </div>
    </section>
  );
}
