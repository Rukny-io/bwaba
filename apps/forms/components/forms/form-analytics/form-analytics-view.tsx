'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Skeleton } from '@heroui/react';
import { Download, Inbox } from 'lucide-react';
import { APP_BASE } from '@/components/app/nav-config';
import {
  AnalyticsPeriodPicker,
  type AnalyticsPeriodDays,
} from '@/components/analytics/analytics-period-picker';
import { ApiException } from '@/lib/api-client';
import { readFormsPreferences } from '@/lib/forms-preferences';
import {
  getForm,
  getFormAnalytics,
  type FormAnalyticsResponse,
  type FormDetail,
} from '@/lib/forms-api';
import {
  getPermissionDeniedCopy,
  hasFormTeamPermission,
  resolveFormAccessRole,
} from '@/lib/form-team-permissions';
import { formatFormDate } from '@/lib/forms-format';
import {
  PlanAnalyticsSectionGate,
  useFormAnalyticsTier,
} from '@/components/plan/plan-analytics-section-gate';
import { downloadFormAnalyticsCsv } from '@/lib/analytics-export';
import { FormAnalyticsIntroSection } from '@/components/forms/form-analytics/form-analytics-intro-section';
import { FormAnalyticsVisitsSection } from '@/components/forms/form-analytics/form-analytics-visits-section';
import { FormAnalyticsAdvancedSection } from '@/components/forms/form-analytics/form-analytics-advanced-section';
import { FormAnalyticsAdvancedPaywall } from '@/components/forms/form-analytics/form-analytics-advanced-paywall';
import { FormAnalyticsSectionTabs } from '@/components/forms/form-analytics/form-analytics-section-tabs';
import { FormPermissionDeniedState } from '@/components/forms/shared/form-permission-denied-state';
import { DashboardErrorState } from '@/components/app/dashboard-error-state';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { formDetailCardClass } from '@/lib/form-detail-styles';
import { useFormWorkspaceSeed } from '@/lib/use-form-workspace-seed';

export function FormAnalyticsView({ formId }: { formId: string }) {
  const seedForm = useFormWorkspaceSeed(formId);
  const [days, setDays] = useState<AnalyticsPeriodDays>(() =>
    readFormsPreferences().analyticsDefaultPeriod,
  );
  const [form, setForm] = useState<FormDetail | null>(seedForm);
  const [data, setData] = useState<FormAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(!seedForm);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const { hasFull, loading: planLoading, plan } = useFormAnalyticsTier();
  const accessRole = form ? resolveFormAccessRole(form) : 'OWNER';
  const permissionDeniedCopy = getPermissionDeniedCopy('view_analytics', accessRole);

  const load = useCallback(async () => {
    const hasCachedForm = seedForm !== null;
    if (!hasCachedForm) setLoading(true);
    setError(null);
    setAccessDenied(false);
    try {
      const formData = seedForm ?? (await getForm(formId));
      setForm(formData);
      const role = resolveFormAccessRole(formData);
      if (!hasFormTeamPermission(role, 'view_analytics')) {
        setAccessDenied(true);
        setData(null);
        return;
      }
      const res = await getFormAnalytics(formId, days);
      setData(res);
    } catch (e) {
      if (e instanceof ApiException && e.statusCode === 403) {
        setAccessDenied(true);
        setData(null);
      } else if (!hasCachedForm) {
        setError(
          e instanceof ApiException ? e.message : 'تعذّر تحميل التحليلات',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [formId, days, seedForm]);

  useEffect(() => {
    void load();
  }, [load]);

  if ((loading || planLoading) && !data) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8">
        <Skeleton className="mx-auto h-11 w-full max-w-2xl rounded-full" />
        <div className="grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[7.25rem] rounded-[25px]" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-[25px]" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <FormPermissionDeniedState
        title={permissionDeniedCopy.title}
        description={permissionDeniedCopy.description}
        actionHref={`/app/forms/${formId}`}
        actionLabel="العودة لإعدادات النموذج"
      />
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

  return (
    <FormAnalyticsSectionTabs
      defaultSection="intro"
      panels={{
        filters: (
          <SettingsSectionCard
            plain
            title="الفترة الزمنية"
            description="اختر الفترة الزمنية لعرض التحليلات وتصدير البيانات"
          >
            <div className={formDetailCardClass}>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-between">
                <AnalyticsPeriodPicker value={days} onChange={setDays} />
                {data.period ? (
                  <p className="text-[12px] text-[var(--muted-foreground)] sm:text-[13px]">
                    <span dir="ltr" lang="en" className="tabular-nums">
                      {formatFormDate(data.period.startDate)} —{' '}
                      {formatFormDate(data.period.endDate)}
                    </span>
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {hasFull ? (
                  <Button
                    variant="tertiary"
                    size="sm"
                    className="rounded-xl"
                    onPress={() => downloadFormAnalyticsCsv(data)}
                  >
                    <Download className="size-4" />
                    تصدير CSV
                  </Button>
                ) : null}
                <Link href={`${APP_BASE}/forms/${formId}/submissions`}>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <Inbox className="size-4" />
                    عرض الاستجابات
                  </Button>
                </Link>
              </div>
            </div>
          </SettingsSectionCard>
        ),
        intro: <FormAnalyticsIntroSection data={data} compact />,
        visits: <FormAnalyticsVisitsSection data={data} compact />,
        advanced: (
          <PlanAnalyticsSectionGate
            minTier="advanced"
            preview={
              <FormAnalyticsAdvancedSection data={data} compact demo />
            }
            lockedContent={<FormAnalyticsAdvancedPaywall plan={plan} />}
          >
            <FormAnalyticsAdvancedSection data={data} compact />
          </PlanAnalyticsSectionGate>
        ),
      }}
    />
  );
}
