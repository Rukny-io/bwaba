/**
 * Email API plan catalog — re-exports shared package + API date helpers.
 */

export {
  DeveloperEmailPlanId,
  DeveloperEmailMarketingPlanId,
  EMAIL_API_ADDONS,
  EMAIL_API_ANNUAL_DISCOUNT_PERCENT,
  EMAIL_API_AUTOMATION,
  EMAIL_API_FREE,
  EMAIL_API_LEGACY_STARTER_PLAN,
  EMAIL_API_MARKETING_PLANS,
  EMAIL_API_OVERAGE_PACK,
  EMAIL_API_PLAN_PERKS,
  EMAIL_API_STARTER_MONTHLY_PRICE_IQD,
  EMAIL_API_STARTER_MONTHLY_QUOTA,
  EMAIL_API_TRANSACTIONAL_PLANS,
  EMAIL_API_TRIAL_QUOTA,
  EMAIL_API_UNIFIED_OVERAGE_PER_1K,
  emailApiDomainLimit,
  emailApiOveragePer1kIqd,
  getEmailApiMarketingPlan,
  getEmailApiPlan,
  getEmailApiPlanPerks,
  getMailLimitsForEmailPlan,
  listSelfServeMarketingPlans,
  listSelfServeTransactionalPlans,
  type EmailApiMarketingPlanDefinition,
  type EmailApiPlanDefinition,
} from '@rukny/email-api-pricing';

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
