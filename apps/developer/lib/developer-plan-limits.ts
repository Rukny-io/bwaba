import type { DeveloperSubscription } from '@/lib/api/types';

export type DeveloperPlanTier = 'FREE' | 'PRO';

/** يطابق apps/api dev-plan-limits.config.ts */
export const DEVELOPER_PLAN_LIMITS = {
  FREE: {
    maxApps: 10,
    maxApiKeys: 5,
  },
  PRO: {
    maxApps: -1,
    maxApiKeys: -1,
  },
} as const;

export const PLATFORM_PLANS_GRANTING_DEV_PRO = [
  'PRO',
  'WHALE',
  'BUSINESS',
] as const;

const LEGACY_PRO_PLANS = new Set(['STARTER', 'GROWTH', 'ENTERPRISE', 'PRO']);

export function normalizeDeveloperPlan(
  plan: string | null | undefined,
): DeveloperPlanTier {
  if (!plan) return 'FREE';
  if (LEGACY_PRO_PLANS.has(plan)) return 'PRO';
  return 'FREE';
}

export function platformPlanGrantsDeveloperPro(
  platformPlan: string | null | undefined,
): boolean {
  if (!platformPlan || platformPlan === 'FREE') return false;
  return (PLATFORM_PLANS_GRANTING_DEV_PRO as readonly string[]).includes(
    platformPlan,
  );
}

export function resolveLimitValue(limit: number): number {
  return limit === -1 ? Number.MAX_SAFE_INTEGER : limit;
}

export function isUnlimitedLimit(limit: number): boolean {
  return limit === -1 || limit >= Number.MAX_SAFE_INTEGER / 2;
}

export function formatPlanLimit(limit: number): string {
  if (isUnlimitedLimit(limit)) return '';
  return String(limit);
}

/** @deprecated Use ApiKeyQuotaIndicator + quota labels instead */
export function formatQuotaRatio(used: number, limit: number): string {
  if (isUnlimitedLimit(limit)) return String(used);
  return `${used}/${formatPlanLimit(limit)}`;
}

export function formatUsageCount(
  template: string,
  used: number,
  limit: number,
  unlimitedTemplate?: string,
): string {
  if (isUnlimitedLimit(limit) && unlimitedTemplate) {
    return unlimitedTemplate.replace('{used}', String(used));
  }
  return template
    .replace('{used}', String(used))
    .replace('{limit}', isUnlimitedLimit(limit) ? '' : String(limit));
}

export function isQuotaAtLimit(used: number, limit: number): boolean {
  if (isUnlimitedLimit(limit)) return false;
  return used >= limit;
}

export function resolveQuotaUsagePercent(used: number, limit: number): number {
  if (isUnlimitedLimit(limit)) return 0;
  return Math.min((used / Math.max(limit, 1)) * 100, 100);
}

export function resolveEffectiveDeveloperPlan(
  subscription: DeveloperSubscription | null | undefined,
): DeveloperPlanTier {
  const stored = subscription?.effectivePlan ?? subscription?.plan;
  if (normalizeDeveloperPlan(stored) === 'PRO') return 'PRO';
  if (platformPlanGrantsDeveloperPro(subscription?.platformPlan)) return 'PRO';
  return 'FREE';
}

export function resolveApiKeyQuota(
  subscription: DeveloperSubscription | null | undefined,
  activeKeyCount: number,
) {
  const effectivePlan = resolveEffectiveDeveloperPlan(subscription);
  const tierLimits = DEVELOPER_PLAN_LIMITS[effectivePlan];

  const limit = Math.max(
    subscription?.apiKeysLimit ?? 0,
    resolveLimitValue(tierLimits.maxApiKeys),
  );

  const used = Math.max(subscription?.apiKeysUsed ?? 0, activeKeyCount);

  return {
    used,
    limit,
    effectivePlan,
    platformPlan: subscription?.platformPlan ?? null,
    billingModel: 'usage' as const,
  };
}

export function resolveAppQuota(
  subscription: DeveloperSubscription | null | undefined,
  activeAppCount: number,
) {
  const effectivePlan = resolveEffectiveDeveloperPlan(subscription);
  const tierLimits = DEVELOPER_PLAN_LIMITS[effectivePlan];

  const limit = Math.max(
    subscription?.appsLimit ?? 0,
    resolveLimitValue(tierLimits.maxApps),
  );

  const used = Math.max(subscription?.appsUsed ?? 0, activeAppCount);

  return { used, limit, effectivePlan };
}
