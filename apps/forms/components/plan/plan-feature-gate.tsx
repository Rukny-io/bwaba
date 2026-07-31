'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  isPlanFeatureEnabled,
  isPlusPlanOrAbove,
  planDisplayName,
  planFeatureLabel,
  type PlanLimitsSnapshot,
} from '@/lib/api/subscriptions';
import { usePlanLimits } from '@/hooks/use-plan-limits';
import { PLUS_PLAN_LABEL } from '@/lib/form-field-plan';

type GatedFeature =
  | 'multiStepForms'
  | 'googleSheets'
  | 'googleDrive'
  | 'webhook'
  | 'conditionalLogic'
  | 'formAnalytics'
  | 'emailFieldVerification'
  | 'phoneWhatsappVerification'
  | 'formTeam'
  | 'removeWatermark';

export function PlanUpgradeBanner({
  feature,
  plan,
  description,
  upgradeHref,
  upgradeLabel = 'ترقية الخطة',
}: {
  feature: GatedFeature;
  plan: string;
  description?: string;
  upgradeHref?: string;
  upgradeLabel?: string;
}) {
  const detail =
    description ??
    `غير متاح في خطتك (${planDisplayName(plan)}).`;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)]/70 bg-[var(--surface)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
        {description ? (
          description
        ) : (
          <>
            <span className="font-medium text-[var(--foreground)]">
              {planFeatureLabel(feature)}
            </span>
            {' — '}
            {detail}
          </>
        )}
      </p>
      {upgradeHref ? (
        <Link
          href={upgradeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[13px] font-semibold text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--primary)] hover:decoration-[var(--primary)]/40"
        >
          {upgradeLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function PlanFeatureGate({
  feature,
  children,
  description,
  limits: limitsOverride,
}: {
  feature: GatedFeature;
  children: ReactNode;
  description?: string;
  limits?: PlanLimitsSnapshot | null;
}) {
  const { limits: fetchedLimits, plan, loading } = usePlanLimits();
  const limits = limitsOverride ?? fetchedLimits;

  if (loading && !limits) {
    return (
      <div className="h-14 animate-pulse rounded-2xl bg-[var(--surface-secondary)]/50" />
    );
  }

  if (!limits || !isPlanFeatureEnabled(limits, feature, plan)) {
    return (
      <PlanUpgradeBanner feature={feature} plan={plan} description={description} />
    );
  }

  return <>{children}</>;
}

export function PlusPlanGate({
  children,
  description,
}: {
  children: ReactNode;
  description?: string;
}) {
  const { plan, loading } = usePlanLimits();

  if (loading) {
    return (
      <div className="h-14 animate-pulse rounded-2xl bg-[var(--surface-secondary)]/50" />
    );
  }

  if (!isPlusPlanOrAbove(plan)) {
    return (
      <PlanUpgradeBanner
        feature="formAnalytics"
        plan={plan}
        description={
          description ??
          `تصدير الاستجابات من الحقول المحذوفة متاح في باقة ${PLUS_PLAN_LABEL} فما فوق.`
        }
      />
    );
  }

  return <>{children}</>;
}

export function usePlanFeature(feature: GatedFeature) {
  const { limits, plan, loading } = usePlanLimits();
  const enabled =
    !loading && isPlanFeatureEnabled(limits, feature, plan);
  return { enabled, limits, plan, loading };
}
