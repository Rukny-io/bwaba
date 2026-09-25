'use client';

import { useTranslations } from 'next-intl';
import {
  PRICING_PLANS,
  type PlanId,
  type PricingPlan,
} from '@rukny/forms-shared/pricing-plans';

export type LocalizedPricingPlan = PricingPlan & {
  localizedHighlights: string[];
};

export function useLocalizedPricingPlans(): LocalizedPricingPlan[] {
  const t = useTranslations('pricing');

  return PRICING_PLANS.map((plan) => {
    const id = plan.id as PlanId;
    const highlights = t.raw(`plans.${id}.highlights`) as string[];
    const badgeKey = `plans.${id}.badge` as const;

    return {
      ...plan,
      name: t(`plans.${id}.name`),
      description: t(`plans.${id}.description`),
      ctaLabel: t(`plans.${id}.ctaLabel`),
      badge: plan.badge ? t(badgeKey) : undefined,
      highlights,
      localizedHighlights: highlights,
    };
  });
}
