/**
 * Email API pricing catalog — single source of truth (IQD).
 * Competitive vs Resend at USD ≈ 1,320 IQD (~15–25% lower on paid tiers).
 */

import {
  buildMarketingInvoiceLabel,
  buildTransactionalInvoiceLabel,
  emailApiMarketingTierFromId,
  emailApiTransactionalTierFromId,
  planIdToSlug,
  tierMarketingName,
  type EmailApiPlanTier,
} from './plan-labels';

export type { EmailApiPlanTier } from './plan-labels';

export const EMAIL_API_CURRENCY = 'IQD';
export const EMAIL_API_USD_IQD_RATE = 1_320;

export enum DeveloperEmailPlanId {
  FREE = 'FREE',
  PRO_10K = 'PRO_10K',
  PRO_50K = 'PRO_50K',
  PRO_100K = 'PRO_100K',
  SCALE_100K = 'SCALE_100K',
  SCALE_200K = 'SCALE_200K',
  SCALE_500K = 'SCALE_500K',
  SCALE_1M = 'SCALE_1M',
  SCALE_1_5M = 'SCALE_1_5M',
  SCALE_2_5M = 'SCALE_2_5M',
  ENTERPRISE = 'ENTERPRISE',
}

export enum DeveloperEmailMarketingPlanId {
  FREE = 'FREE',
  PRO_5K = 'PRO_5K',
  PRO_10K = 'PRO_10K',
  PRO_15K = 'PRO_15K',
  PRO_25K = 'PRO_25K',
  PRO_50K = 'PRO_50K',
  PRO_100K = 'PRO_100K',
  PRO_150K = 'PRO_150K',
  ENTERPRISE = 'ENTERPRISE',
}

export type EmailApiPlanDefinition = {
  id: DeveloperEmailPlanId;
  /** @deprecated Use marketingNameAr */
  name: string;
  /** @deprecated Use marketingNameEn */
  nameEn: string;
  tier: EmailApiPlanTier;
  slug: string;
  marketingNameEn: string;
  marketingNameAr: string;
  invoiceLabelEn: string;
  invoiceLabelAr: string;
  monthlyQuota: number;
  priceMonthlyIqd: number;
  overagePer1kIqd: number;
  dailyLimit?: number;
  domainsIncluded: number;
  selfServe: boolean;
};

export type EmailApiMarketingPlanDefinition = {
  id: DeveloperEmailMarketingPlanId;
  /** @deprecated Use marketingNameAr */
  name: string;
  tier: EmailApiPlanTier;
  slug: string;
  marketingNameEn: string;
  marketingNameAr: string;
  invoiceLabelEn: string;
  invoiceLabelAr: string;
  contactsLimit: number;
  priceMonthlyIqd: number;
  selfServe: boolean;
};

type TransactionalPlanCore = {
  id: DeveloperEmailPlanId;
  monthlyQuota: number;
  priceMonthlyIqd: number;
  overagePer1kIqd: number;
  domainsIncluded: number;
  selfServe: boolean;
  dailyLimit?: number;
};

function defineTransactionalPlan(
  core: TransactionalPlanCore,
): EmailApiPlanDefinition {
  const tier = emailApiTransactionalTierFromId(core.id);
  const marketingNameEn = tierMarketingName(tier, 'en');
  const marketingNameAr = tierMarketingName(tier, 'ar');
  return {
    ...core,
    tier,
    slug: planIdToSlug(core.id),
    marketingNameEn,
    marketingNameAr,
    name: marketingNameAr,
    nameEn: marketingNameEn,
    invoiceLabelEn: buildTransactionalInvoiceLabel(
      tier,
      core.monthlyQuota,
      'en',
    ),
    invoiceLabelAr: buildTransactionalInvoiceLabel(
      tier,
      core.monthlyQuota,
      'ar',
    ),
  };
}

type MarketingPlanCore = {
  id: DeveloperEmailMarketingPlanId;
  contactsLimit: number;
  priceMonthlyIqd: number;
  selfServe: boolean;
};

function defineMarketingPlan(
  core: MarketingPlanCore,
): EmailApiMarketingPlanDefinition {
  const tier = emailApiMarketingTierFromId(core.id);
  const marketingNameEn = tierMarketingName(tier, 'en');
  const marketingNameAr = tierMarketingName(tier, 'ar');
  return {
    ...core,
    tier,
    slug: planIdToSlug(core.id),
    marketingNameEn,
    marketingNameAr,
    name: marketingNameAr,
    invoiceLabelEn: buildMarketingInvoiceLabel(
      tier,
      core.contactsLimit,
      'en',
    ),
    invoiceLabelAr: buildMarketingInvoiceLabel(
      tier,
      core.contactsLimit,
      'ar',
    ),
  };
}

export const EMAIL_API_FREE = {
  monthlyQuota: 3_000,
  dailyLimit: 100,
  domainsIncluded: 3,
} as const;

export const EMAIL_API_OVERAGE_PACK = {
  emails: 1_000,
  priceIqd: 700,
} as const;

/** Resend: 10K runs/mo included; overage ~$0.0015/run ≈ 2 IQD */
export const EMAIL_API_AUTOMATION = {
  includedRunsPerMonth: 10_000,
  overagePriceIqdPerRun: 2,
} as const;

export const EMAIL_API_ADDONS = {
  domainsPack: { extraDomains: 100, priceMonthlyIqd: 20_000 },
  dedicatedIp: { priceMonthlyIqd: 30_000 },
  sso: { priceMonthlyIqd: 120_000 },
} as const;

export const EMAIL_API_ANNUAL_DISCOUNT_PERCENT = 17;

export const EMAIL_API_TRANSACTIONAL_PLANS: EmailApiPlanDefinition[] = [
  defineTransactionalPlan({
    id: DeveloperEmailPlanId.FREE,
    monthlyQuota: EMAIL_API_FREE.monthlyQuota,
    priceMonthlyIqd: 0,
    overagePer1kIqd: 0,
    dailyLimit: EMAIL_API_FREE.dailyLimit,
    domainsIncluded: EMAIL_API_FREE.domainsIncluded,
    selfServe: true,
  }),
  defineTransactionalPlan({
    id: DeveloperEmailPlanId.PRO_10K,
    monthlyQuota: 10_000,
    priceMonthlyIqd: 5_000,
    overagePer1kIqd: 700,
    domainsIncluded: 10,
    selfServe: true,
  }),
  defineTransactionalPlan({
    id: DeveloperEmailPlanId.PRO_50K,
    monthlyQuota: 50_000,
    priceMonthlyIqd: 16_000,
    overagePer1kIqd: 700,
    domainsIncluded: 10,
    selfServe: true,
  }),
  defineTransactionalPlan({
    id: DeveloperEmailPlanId.PRO_100K,
    monthlyQuota: 100_000,
    priceMonthlyIqd: 28_000,
    overagePer1kIqd: 700,
    domainsIncluded: 10,
    selfServe: true,
  }),
  defineTransactionalPlan({
    id: DeveloperEmailPlanId.SCALE_100K,
    monthlyQuota: 100_000,
    priceMonthlyIqd: 72_000,
    overagePer1kIqd: 650,
    domainsIncluded: 1_000,
    selfServe: true,
  }),
  defineTransactionalPlan({
    id: DeveloperEmailPlanId.SCALE_200K,
    monthlyQuota: 200_000,
    priceMonthlyIqd: 125_000,
    overagePer1kIqd: 600,
    domainsIncluded: 1_000,
    selfServe: true,
  }),
  defineTransactionalPlan({
    id: DeveloperEmailPlanId.SCALE_500K,
    monthlyQuota: 500_000,
    priceMonthlyIqd: 275_000,
    overagePer1kIqd: 550,
    domainsIncluded: 1_000,
    selfServe: true,
  }),
  defineTransactionalPlan({
    id: DeveloperEmailPlanId.SCALE_1M,
    monthlyQuota: 1_000_000,
    priceMonthlyIqd: 500_000,
    overagePer1kIqd: 500,
    domainsIncluded: 1_000,
    selfServe: true,
  }),
  defineTransactionalPlan({
    id: DeveloperEmailPlanId.SCALE_1_5M,
    monthlyQuota: 1_500_000,
    priceMonthlyIqd: 660_000,
    overagePer1kIqd: 450,
    domainsIncluded: 1_000,
    selfServe: true,
  }),
  defineTransactionalPlan({
    id: DeveloperEmailPlanId.SCALE_2_5M,
    monthlyQuota: 2_500_000,
    priceMonthlyIqd: 920_000,
    overagePer1kIqd: 400,
    domainsIncluded: 1_000,
    selfServe: true,
  }),
  defineTransactionalPlan({
    id: DeveloperEmailPlanId.ENTERPRISE,
    monthlyQuota: 0,
    priceMonthlyIqd: 0,
    overagePer1kIqd: 0,
    domainsIncluded: 1_000,
    selfServe: false,
  }),
];

export const EMAIL_API_MARKETING_PLANS: EmailApiMarketingPlanDefinition[] = [
  defineMarketingPlan({
    id: DeveloperEmailMarketingPlanId.FREE,
    contactsLimit: 1_000,
    priceMonthlyIqd: 0,
    selfServe: true,
  }),
  defineMarketingPlan({
    id: DeveloperEmailMarketingPlanId.PRO_5K,
    contactsLimit: 5_000,
    priceMonthlyIqd: 35_000,
    selfServe: true,
  }),
  defineMarketingPlan({
    id: DeveloperEmailMarketingPlanId.PRO_10K,
    contactsLimit: 10_000,
    priceMonthlyIqd: 65_000,
    selfServe: true,
  }),
  defineMarketingPlan({
    id: DeveloperEmailMarketingPlanId.PRO_15K,
    contactsLimit: 15_000,
    priceMonthlyIqd: 95_000,
    selfServe: true,
  }),
  defineMarketingPlan({
    id: DeveloperEmailMarketingPlanId.PRO_25K,
    contactsLimit: 25_000,
    priceMonthlyIqd: 140_000,
    selfServe: true,
  }),
  defineMarketingPlan({
    id: DeveloperEmailMarketingPlanId.PRO_50K,
    contactsLimit: 50_000,
    priceMonthlyIqd: 190_000,
    selfServe: true,
  }),
  defineMarketingPlan({
    id: DeveloperEmailMarketingPlanId.PRO_100K,
    contactsLimit: 100_000,
    priceMonthlyIqd: 340_000,
    selfServe: true,
  }),
  defineMarketingPlan({
    id: DeveloperEmailMarketingPlanId.PRO_150K,
    contactsLimit: 150_000,
    priceMonthlyIqd: 490_000,
    selfServe: true,
  }),
  defineMarketingPlan({
    id: DeveloperEmailMarketingPlanId.ENTERPRISE,
    contactsLimit: 0,
    priceMonthlyIqd: 0,
    selfServe: false,
  }),
];

const TRANSACTIONAL_BY_ID = Object.fromEntries(
  EMAIL_API_TRANSACTIONAL_PLANS.map((plan) => [plan.id, plan]),
) as Record<DeveloperEmailPlanId, EmailApiPlanDefinition>;

const MARKETING_BY_ID = Object.fromEntries(
  EMAIL_API_MARKETING_PLANS.map((plan) => [plan.id, plan]),
) as Record<DeveloperEmailMarketingPlanId, EmailApiMarketingPlanDefinition>;

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

export function listSelfServeTransactionalPlans(): EmailApiPlanDefinition[] {
  return EMAIL_API_TRANSACTIONAL_PLANS.filter(
    (plan) => plan.selfServe && plan.id !== DeveloperEmailPlanId.FREE,
  );
}

export function listSelfServeMarketingPlans(): EmailApiMarketingPlanDefinition[] {
  return EMAIL_API_MARKETING_PLANS.filter((plan) => plan.selfServe);
}

export function getEmailApiPlanTier(
  planId: DeveloperEmailPlanId | string | null | undefined,
): EmailApiPlanTier {
  return emailApiTransactionalTierFromId(
    (planId as DeveloperEmailPlanId) || DeveloperEmailPlanId.FREE,
  );
}
