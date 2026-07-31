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
import { DashboardSurface } from '@/components/app/dashboard-surface';

export function FormAnalyticsView({ formId }: { formId: string }) {
  const [days, setDays] = useState<AnalyticsPeriodDays>(() =>
    readFormsPreferences().analyticsDefaultPeriod,
  );
  const [form, setForm] = useState<FormDetail | null>(null);
  const [data, setData] = useState<FormAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const { hasFull, loading: planLoading, plan } = useFormAnalyticsTier();
  const accessRole = form ? resolveFormAccessRole(form) : 'OWNER';
  const permissionDeniedCopy = getPermissionDeniedCopy('view_analytics', accessRole);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAccessDenied(false);
    try {
      const formData = await getForm(formId);
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
      } else {
        setError(
          e instanceof ApiException ? e.message : 'تعذّر تحميل التحليلات',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [formId, days]);

  useEffect(() => {
    void load();
  }, [load]);

  if ((loading || planLoading) && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="mx-auto h-11 w-full max-w-2xl rounded-full" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-3xl" />
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
          <DashboardSurface className="space-y-5">
            <p className="text-sm text-[var(--muted-foreground)]">
              اختر الفترة الزمنية لعرض التحليلات
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-between">
              <AnalyticsPeriodPicker value={days} onChange={setDays} />
              {data.period ? (
                <p className="text-xs text-[var(--muted-foreground)] sm:text-sm">
                  <span dir="ltr" lang="en" className="tabular-nums">
                    {formatFormDate(data.period.startDate)} —{' '}
                    {formatFormDate(data.period.endDate)}
                  </span>
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
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
              <Link
                href={`${APP_BASE}/forms/${formId}/submissions`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]/80"
              >
                <Inbox className="size-4" />
                عرض الاستجابات
              </Link>
            </div>
          </DashboardSurface>
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
