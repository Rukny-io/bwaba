'use client';

import {
  BarChart2,
  ClipboardList,
  Inbox,
  Timer,
} from 'lucide-react';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import type {
  FormAnalyticsIntro,
  FormAnalyticsResponse,
} from '@/lib/forms-api';
import {
  formatNumber,
  formatPercent,
} from '@/lib/dashboard-format';

function defaultIntro(data: FormAnalyticsResponse): FormAnalyticsIntro {
  return (
    data.intro ?? {
      fieldCount: 0,
      requiredFieldCount: 0,
      avgFieldCompletionRate: 0,
      formStatus: data.form?.status ?? 'DRAFT',
    }
  );
}

export function FormAnalyticsIntroSection({
  data,
  compact = false,
}: {
  data: FormAnalyticsResponse;
  compact?: boolean;
}) {
  const intro = defaultIntro(data);
  const { summary } = data;

  const content = (
    <div className="grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-4">
      <DashboardMetricCard
        icon={ClipboardList}
        label="عدد الحقول"
        value={formatNumber(intro.fieldCount)}
        comparisonPrimary={`${intro.requiredFieldCount} إلزامي`}
        comparisonSecondary="حقول إدخال"
      />
      <DashboardMetricCard
        icon={BarChart2}
        label="معدل استكمال الحقول"
        value={formatPercent(intro.avgFieldCompletionRate)}
        comparisonPrimary="متوسط الإجابة"
        comparisonSecondary="لكل استجابة"
      />
      <DashboardMetricCard
        icon={Inbox}
        label="عدد الإجابات"
        value={formatNumber(summary.totalSubmissions)}
        comparisonPrimary="في الفترة"
        comparisonSecondary="استجابات مكتملة"
      />
      <DashboardMetricCard
        icon={Timer}
        label="متوسط وقت الإكمال"
        value={
          summary.avgTimeToComplete > 0
            ? `${summary.avgTimeToComplete} ث`
            : '—'
        }
        comparisonPrimary="بالثواني"
        comparisonSecondary="متوسط"
      />
    </div>
  );

  if (compact) {
    return (
      <SettingsSectionCard
        plain
        title="مقدمة"
        description="نظرة سريعة على بنية النموذج وأدائه"
      >
        {content}
      </SettingsSectionCard>
    );
  }

  return <section>{content}</section>;
}
