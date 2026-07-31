import type { PlanLimits } from './plan-limits.config';

export type TieredPlanFeature = 'formAnalytics' | 'conditionalLogic';

export type FormAnalyticsTier = false | 'basic' | 'advanced' | 'full';
export type ConditionalLogicTier = false | 'basic' | 'advanced' | 'full';

const TIER_RANK: Record<string, number> = {
  basic: 1,
  advanced: 2,
  full: 3,
};

export function tierRank(
  tier: false | string | undefined,
): number {
  if (tier === false || tier == null || tier === '') return 0;
  return TIER_RANK[tier] ?? 0;
}

export function hasMinFeatureTier(
  limits: PlanLimits,
  feature: TieredPlanFeature,
  minTier: Exclude<FormAnalyticsTier | ConditionalLogicTier, false>,
): boolean {
  const current = limits[feature];
  if (current === false || current == null) return false;
  if (typeof current !== 'string') return false;
  return tierRank(current) >= tierRank(minTier);
}

export function resolveFormAnalyticsTierForFree(
  plan: string,
  limits: PlanLimits,
): FormAnalyticsTier {
  const tier = limits.formAnalytics;
  if (tier === false && plan === 'FREE') return 'basic';
  return tier;
}
