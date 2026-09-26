import {
  DeveloperEmailMarketingPlanId,
  DeveloperEmailPlanId,
  EMAIL_API_MARKETING_PLANS,
  EMAIL_API_TRANSACTIONAL_PLANS,
  type EmailApiMarketingPlanDefinition,
  type EmailApiPlanDefinition,
  getEmailApiMarketingPlan,
  getEmailApiPlan,
} from './catalog';

export type EmailApiPricingTier = 'free' | 'pro' | 'scale' | 'enterprise';

export type EmailApiVolumeStop = {
  volume: number;
  label: string;
  planId: DeveloperEmailPlanId;
};

/** Public self-serve slider stops (Free · Growth · Enterprise). */
export const EMAIL_API_TRANSACTIONAL_VOLUME_STOPS: EmailApiVolumeStop[] = [
  { volume: 3_000, label: '3K', planId: DeveloperEmailPlanId.FREE },
  { volume: 50_000, label: '50K', planId: DeveloperEmailPlanId.PRO_50K },
  { volume: 100_000, label: '100K', planId: DeveloperEmailPlanId.PRO_100K },
  { volume: 250_000, label: '250K+', planId: DeveloperEmailPlanId.ENTERPRISE },
];

export type EmailApiContactsStop = {
  contacts: number;
  label: string;
  planId: DeveloperEmailMarketingPlanId;
};

export const EMAIL_API_MARKETING_CONTACT_STOPS: EmailApiContactsStop[] = [
  { contacts: 1_000, label: '1K', planId: DeveloperEmailMarketingPlanId.FREE },
  { contacts: 5_000, label: '5K', planId: DeveloperEmailMarketingPlanId.PRO_5K },
  { contacts: 10_000, label: '10K', planId: DeveloperEmailMarketingPlanId.PRO_10K },
  { contacts: 15_000, label: '15K', planId: DeveloperEmailMarketingPlanId.PRO_15K },
  { contacts: 25_000, label: '25K', planId: DeveloperEmailMarketingPlanId.PRO_25K },
  { contacts: 50_000, label: '50K', planId: DeveloperEmailMarketingPlanId.PRO_50K },
  { contacts: 100_000, label: '100K', planId: DeveloperEmailMarketingPlanId.PRO_100K },
  { contacts: 150_000, label: '150K', planId: DeveloperEmailMarketingPlanId.PRO_150K },
  {
    contacts: 200_000,
    label: '150K+',
    planId: DeveloperEmailMarketingPlanId.ENTERPRISE,
  },
];

export function emailApiPlanTier(
  planId: DeveloperEmailPlanId | string,
): EmailApiPricingTier {
  if (planId === DeveloperEmailPlanId.FREE) return 'free';
  if (planId === DeveloperEmailPlanId.ENTERPRISE) return 'enterprise';
  if (String(planId).startsWith('SCALE')) return 'scale';
  return 'pro';
}

export function getTransactionalVolumeStop(index: number): EmailApiVolumeStop {
  const stops = EMAIL_API_TRANSACTIONAL_VOLUME_STOPS;
  const i = Math.max(0, Math.min(stops.length - 1, Math.floor(index)));
  return stops[i]!;
}

export function getMarketingContactsStop(index: number): EmailApiContactsStop {
  const stops = EMAIL_API_MARKETING_CONTACT_STOPS;
  const i = Math.max(0, Math.min(stops.length - 1, Math.floor(index)));
  return stops[i]!;
}

/** Cheapest self-serve plan that covers `volume` emails / month. */
export function recommendTransactionalPlanForVolume(
  volume: number,
): EmailApiPlanDefinition {
  if (volume <= getEmailApiPlan(DeveloperEmailPlanId.FREE).monthlyQuota) {
    return getEmailApiPlan(DeveloperEmailPlanId.FREE);
  }

  const paid = EMAIL_API_TRANSACTIONAL_PLANS.filter(
    (plan) =>
      plan.selfServe &&
      plan.id !== DeveloperEmailPlanId.FREE &&
      plan.id !== DeveloperEmailPlanId.ENTERPRISE,
  );

  const fits = paid.filter((plan) => plan.monthlyQuota >= volume);
  if (fits.length === 0) {
    return getEmailApiPlan(DeveloperEmailPlanId.ENTERPRISE);
  }

  return fits.reduce((best, plan) =>
    plan.priceMonthlyIqd < best.priceMonthlyIqd ? plan : best,
  );
}

export function recommendMarketingPlanForContacts(
  contacts: number,
): EmailApiMarketingPlanDefinition {
  if (contacts <= getEmailApiMarketingPlan(DeveloperEmailMarketingPlanId.FREE).contactsLimit) {
    return getEmailApiMarketingPlan(DeveloperEmailMarketingPlanId.FREE);
  }

  const paid = EMAIL_API_MARKETING_PLANS.filter(
    (plan) =>
      plan.selfServe && plan.id !== DeveloperEmailMarketingPlanId.ENTERPRISE,
  );

  const fits = paid.filter((plan) => plan.contactsLimit >= contacts);
  if (fits.length === 0) {
    return getEmailApiMarketingPlan(DeveloperEmailMarketingPlanId.ENTERPRISE);
  }

  return fits.reduce((best, plan) =>
    plan.priceMonthlyIqd < best.priceMonthlyIqd ? plan : best,
  );
}

export type EmailApiTransactionalEstimate = {
  stop: EmailApiVolumeStop;
  plan: EmailApiPlanDefinition;
  tier: EmailApiPricingTier;
  monthlyCostIqd: number;
  effectivePer1kIqd: number | null;
  overagePer1kIqd: number | null;
};

export function estimateTransactionalAtStop(
  stopIndex: number,
): EmailApiTransactionalEstimate {
  const stop = getTransactionalVolumeStop(stopIndex);
  const plan = getEmailApiPlan(stop.planId);
  const tier = emailApiPlanTier(plan.id);

  const monthlyCostIqd = plan.priceMonthlyIqd;
  const effectivePer1kIqd =
    plan.monthlyQuota > 0 && plan.priceMonthlyIqd > 0
      ? Math.round(plan.priceMonthlyIqd / (plan.monthlyQuota / 1_000))
      : null;

  return {
    stop,
    plan,
    tier,
    monthlyCostIqd,
    effectivePer1kIqd,
    overagePer1kIqd:
      plan.overagePer1kIqd > 0 ? plan.overagePer1kIqd : null,
  };
}

export type EmailApiMarketingEstimate = {
  stop: EmailApiContactsStop;
  plan: EmailApiMarketingPlanDefinition;
  tier: 'free' | 'pro' | 'enterprise';
  monthlyCostIqd: number;
};

export function estimateMarketingAtStop(
  stopIndex: number,
): EmailApiMarketingEstimate {
  const stop = getMarketingContactsStop(stopIndex);
  const plan = getEmailApiMarketingPlan(stop.planId);
  const tier =
    plan.id === DeveloperEmailMarketingPlanId.FREE
      ? 'free'
      : plan.id === DeveloperEmailMarketingPlanId.ENTERPRISE
        ? 'enterprise'
        : 'pro';

  return {
    stop,
    plan,
    tier,
    monthlyCostIqd: plan.priceMonthlyIqd,
  };
}

/** Display plan for a tier card when that tier is not the active selection. */
export function emailApiTransactionalTierAnchor(
  tier: EmailApiPricingTier,
): EmailApiPlanDefinition {
  switch (tier) {
    case 'free':
      return getEmailApiPlan(DeveloperEmailPlanId.FREE);
    case 'pro':
      return getEmailApiPlan(DeveloperEmailPlanId.PRO_50K);
    case 'scale':
      return getEmailApiPlan(DeveloperEmailPlanId.PRO_100K);
    default:
      return getEmailApiPlan(DeveloperEmailPlanId.ENTERPRISE);
  }
}
