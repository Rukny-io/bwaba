import {
  BarChart2,
  FileText,
  Inbox,
  LayoutTemplate,
} from 'lucide-react';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import type { FormsDashboardMetrics } from '@/lib/forms-dashboard-data';

interface SettingsUsageSectionProps {
  metrics: FormsDashboardMetrics;
}

export function SettingsUsageSection({ metrics }: SettingsUsageSectionProps) {
  return (
    <SettingsSectionCard
      icon={BarChart2}
      title="استخدام Forms"
      description="ملخص سريع لنشاط نماذجك داخل التطبيق."
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
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
    </SettingsSectionCard>
  );
}
