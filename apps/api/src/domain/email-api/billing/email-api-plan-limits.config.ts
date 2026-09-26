/**
 * Email API plan catalog — single source of truth for quotas and IQD pricing.
 * Competitive positioning vs Resend (USD ≈ 1,320 IQD).
 */

export enum DeveloperEmailPlanId {
  FREE = 'FREE',
  PRO_10K = 'PRO_10K',
  PRO_50K = 'PRO_50K',
  PRO_100K = 'PRO_100K',
  SCALE_100K = 'SCALE_100K',
  SCALE_200K = 'SCALE_200K',
  SCALE_500K = 'SCALE_500K',
  SCALE_1M = 'SCALE_1M',
  ENTERPRISE = 'ENTERPRISE',
}

export enum DeveloperEmailMarketingPlanId {
  FREE = 'FREE',
  PRO_5K = 'PRO_5K',
  PRO_10K = 'PRO_10K',
  PRO_25K = 'PRO_25K',
  PRO_50K = 'PRO_50K',
  PRO_100K = 'PRO_100K',
  ENTERPRISE = 'ENTERPRISE',
}

export type EmailApiPlanDefinition = {
  id: DeveloperEmailPlanId;
  name: string;
  nameEn: string;
  monthlyQuota: number;
  priceMonthlyIqd: number;
  overagePer1kIqd: number;
  dailyLimit?: number;
  domainsIncluded: number;
  selfServe: boolean;
};

export type EmailApiMarketingPlanDefinition = {
  id: DeveloperEmailMarketingPlanId;
  name: string;
  contactsLimit: number;
  priceMonthlyIqd: number;
  selfServe: boolean;
};

export const EMAIL_API_FREE = {
  monthlyQuota: 3_000,
  dailyLimit: 100,
  domainsIncluded: 3,
} as const;

export const EMAIL_API_OVERAGE_PACK = {
  emails: 1_000,
  priceIqd: 700,
} as const;

export const EMAIL_API_AUTOMATION = {
  includedRunsPerMonth: 15_000,
  overagePriceIqdPerRun: 1,
} as const;

export const EMAIL_API_ADDONS = {
  domainsPack: { extraDomains: 100, priceMonthlyIqd: 20_000 },
  dedicatedIp: { priceMonthlyIqd: 30_000 },
  sso: { priceMonthlyIqd: 120_000 },
} as const;

export const EMAIL_API_ANNUAL_DISCOUNT_PERCENT = 17;

export const EMAIL_API_TRANSACTIONAL_PLANS: EmailApiPlanDefinition[] = [
  {
    id: DeveloperEmailPlanId.FREE,
    name: 'مجاني',
    nameEn: 'Free',
    monthlyQuota: EMAIL_API_FREE.monthlyQuota,
    priceMonthlyIqd: 0,
    overagePer1kIqd: 0,
    dailyLimit: EMAIL_API_FREE.dailyLimit,
    domainsIncluded: EMAIL_API_FREE.domainsIncluded,
    selfServe: true,
  },
  {
    id: DeveloperEmailPlanId.PRO_10K,
    name: 'Pro 10K',
    nameEn: 'Pro 10K',
    monthlyQuota: 10_000,
    priceMonthlyIqd: 5_000,
    overagePer1kIqd: 700,
    domainsIncluded: 10,
    selfServe: true,
  },
  {
    id: DeveloperEmailPlanId.PRO_50K,
    name: 'Pro 50K',
    nameEn: 'Pro 50K',
    monthlyQuota: 50_000,
    priceMonthlyIqd: 16_000,
    overagePer1kIqd: 700,
    domainsIncluded: 10,
    selfServe: true,
  },
  {
    id: DeveloperEmailPlanId.PRO_100K,
    name: 'Pro 100K',
    nameEn: 'Pro 100K',
    monthlyQuota: 100_000,
    priceMonthlyIqd: 28_000,
    overagePer1kIqd: 700,
    domainsIncluded: 10,
    selfServe: true,
  },
  {
    id: DeveloperEmailPlanId.SCALE_100K,
    name: 'Scale 100K',
    nameEn: 'Scale 100K',
    monthlyQuota: 100_000,
    priceMonthlyIqd: 72_000,
    overagePer1kIqd: 650,
    domainsIncluded: 1_000,
    selfServe: true,
  },
  {
    id: DeveloperEmailPlanId.SCALE_200K,
    name: 'Scale 200K',
    nameEn: 'Scale 200K',
    monthlyQuota: 200_000,
    priceMonthlyIqd: 125_000,
    overagePer1kIqd: 600,
    domainsIncluded: 1_000,
    selfServe: true,
  },
  {
    id: DeveloperEmailPlanId.SCALE_500K,
    name: 'Scale 500K',
    nameEn: 'Scale 500K',
    monthlyQuota: 500_000,
    priceMonthlyIqd: 275_000,
    overagePer1kIqd: 550,
    domainsIncluded: 1_000,
    selfServe: true,
  },
  {
    id: DeveloperEmailPlanId.SCALE_1M,
    name: 'Scale 1M',
    nameEn: 'Scale 1M',
    monthlyQuota: 1_000_000,
    priceMonthlyIqd: 500_000,
    overagePer1kIqd: 500,
    domainsIncluded: 1_000,
    selfServe: true,
  },
  {
    id: DeveloperEmailPlanId.ENTERPRISE,
    name: 'Enterprise',
    nameEn: 'Enterprise',
    monthlyQuota: 0,
    priceMonthlyIqd: 0,
    overagePer1kIqd: 0,
    domainsIncluded: 1_000,
    selfServe: false,
  },
];

export const EMAIL_API_MARKETING_PLANS: EmailApiMarketingPlanDefinition[] = [
  {
    id: DeveloperEmailMarketingPlanId.FREE,
    name: 'Marketing Free',
    contactsLimit: 1_500,
    priceMonthlyIqd: 0,
    selfServe: true,
  },
  {
    id: DeveloperEmailMarketingPlanId.PRO_5K,
    name: 'Marketing 5K',
    contactsLimit: 5_000,
    priceMonthlyIqd: 35_000,
    selfServe: true,
  },
  {
    id: DeveloperEmailMarketingPlanId.PRO_10K,
    name: 'Marketing 10K',
    contactsLimit: 10_000,
    priceMonthlyIqd: 65_000,
    selfServe: true,
  },
  {
    id: DeveloperEmailMarketingPlanId.PRO_25K,
    name: 'Marketing 25K',
    contactsLimit: 25_000,
    priceMonthlyIqd: 140_000,
    selfServe: true,
  },
  {
    id: DeveloperEmailMarketingPlanId.PRO_50K,
    name: 'Marketing 50K',
    contactsLimit: 50_000,
    priceMonthlyIqd: 190_000,
    selfServe: true,
  },
  {
    id: DeveloperEmailMarketingPlanId.PRO_100K,
    name: 'Marketing 100K',
    contactsLimit: 100_000,
    priceMonthlyIqd: 340_000,
    selfServe: true,
  },
  {
    id: DeveloperEmailMarketingPlanId.ENTERPRISE,
    name: 'Marketing Enterprise',
    contactsLimit: 0,
    priceMonthlyIqd: 0,
    selfServe: false,
  },
];

const TRANSACTIONAL_BY_ID = Object.fromEntries(
  EMAIL_API_TRANSACTIONAL_PLANS.map((plan) => [plan.id, plan]),
) as Record<DeveloperEmailPlanId, EmailApiPlanDefinition>;

const MARKETING_BY_ID = Object.fromEntries(
  EMAIL_API_MARKETING_PLANS.map((plan) => [plan.id, plan]),
) as Record<DeveloperEmailMarketingPlanId, EmailApiMarketingPlanDefinition>;

/** Legacy Starter maps to PRO_10K for existing subscriptions. */
export const EMAIL_API_LEGACY_STARTER_PLAN = DeveloperEmailPlanId.PRO_10K;

/** @deprecated Use EMAIL_API_FREE.monthlyQuota */
export const EMAIL_API_TRIAL_QUOTA = EMAIL_API_FREE.monthlyQuota;

/** @deprecated Use PRO_10K catalog */
export const EMAIL_API_STARTER_MONTHLY_QUOTA = 10_000;

/** @deprecated Use PRO_10K catalog */
export const EMAIL_API_STARTER_MONTHLY_PRICE_IQD = 5_000;

export function getEmailApiPlan(
  planId: DeveloperEmailPlanId | string | null | undefined,
): EmailApiPlanDefinition {
  const id = (planId as DeveloperEmailPlanId) || DeveloperEmailPlanId.FREE;
  return TRANSACTIONAL_BY_ID[id] ?? TRANSACTIONAL_BY_ID[DeveloperEmailPlanId.FREE];
}

export function getEmailApiMarketingPlan(
  planId: DeveloperEmailMarketingPlanId | string | null | undefined,
): EmailApiMarketingPlanDefinition {
  const id =
    (planId as DeveloperEmailMarketingPlanId) ||
    DeveloperEmailMarketingPlanId.FREE;
  return (
    MARKETING_BY_ID[id] ?? MARKETING_BY_ID[DeveloperEmailMarketingPlanId.FREE]
  );
}

export function emailApiOveragePer1kIqd(
  planId: DeveloperEmailPlanId | string | null | undefined,
): number {
  const plan = getEmailApiPlan(planId);
  if (plan.overagePer1kIqd > 0) return plan.overagePer1kIqd;
  return EMAIL_API_OVERAGE_PACK.priceIqd;
}

export function emailApiDomainLimit(
  planId: DeveloperEmailPlanId | string | null | undefined,
  addonDomainsExtra: number,
): number {
  const plan = getEmailApiPlan(planId);
  return plan.domainsIncluded + addonDomainsExtra * EMAIL_API_ADDONS.domainsPack.extraDomains;
}

export function addOneEmailBillingMonth(from = new Date()): Date {
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export function startOfUtcDay(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
