'use client';

import type { ReactNode } from 'react';
import {
  hasFormAnalyticsTier,
  planDisplayName,
  resolveFormAnalyticsTier,
  type AnalyticsTier,
} from '@/lib/api/subscriptions';
import { usePlanLimits } from '@/hooks/use-plan-limits';
import { PlanUpgradeBanner } from '@/components/plan/plan-feature-gate';
import { cn } from '@/lib/utils';

type MinTier = Exclude<AnalyticsTier, false>;

const TIER_UPGRADE_COPY: Record<MinTier, string> = {
  basic:
    'تحليلات النماذج الأساسية غير متاحة في خطتك الحالية. قم بالترقية لتفعيلها.',
  advanced:
    'التحليلات المتقدمة (مسار الإكمال، تحليل الحقول، NPS، الخرائط) متاحة في باقة الحوت وما فوق.',
  full: 'تصدير CSV والتحليلات الكاملة متاحة في باقة الأعمال.',
};

export function useFormAnalyticsTier() {
  const { limits, plan, loading } = usePlanLimits();
  const effectiveTier = limits ? resolveFormAnalyticsTier(plan, limits) : false;
  return {
    limits,
    plan,
    loading,
    tier: effectiveTier,
    hasBasic: limits ? hasFormAnalyticsTier(limits, 'basic', plan) : plan === 'FREE',
    hasAdvanced: limits ? hasFormAnalyticsTier(limits, 'advanced', plan) : false,
    hasFull: limits ? hasFormAnalyticsTier(limits, 'full', plan) : false,
  };
}

export function PlanAnalyticsSectionGate({
  minTier,
  children,
  preview,
  lockedContent,
  className,
}: {
  minTier: MinTier;
  children: ReactNode;
  preview?: ReactNode;
  lockedContent?: ReactNode;
  className?: string;
}) {
  const { limits, plan, loading } = usePlanLimits();
  const enabled = limits
    ? hasFormAnalyticsTier(limits, minTier, plan)
    : minTier === 'basic' && plan === 'FREE';

  if (loading && !limits) {
    return (
      <div className={cn('animate-pulse rounded-3xl bg-[var(--surface-secondary)]/50 h-48', className)} />
    );
  }

  if (!enabled) {
    return (
      <div
        className={cn(
          'relative min-h-[28rem] overflow-hidden  rounded-3xl bg-[var(--surface)]',
          className,
        )}
      >
        {preview ? (
          <div
            className="pointer-events-none  rounded-3xl select-none blur-[5px] opacity-55 saturate-50"
            aria-hidden
          >
            {preview}
          </div>
        ) : null}
        <div
          className={cn(
            'flex items-center justify-center p-6 sm:p-10',
            preview
              ? 'absolute inset-0 bg-gradient-to-b from-[var(--surface)]/75 via-[var(--surface)]/55 to-[var(--surface)]/85 backdrop-blur-[1px]'
              : '',
          )}
        >
          {lockedContent ?? (
            <PlanUpgradeBanner
              feature="formAnalytics"
              plan={plan}
              description={
                TIER_UPGRADE_COPY[minTier] ??
                `خطتك الحالية (${planDisplayName(plan)}) لا تتضمن هذه الميزة.`
              }
            />
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
