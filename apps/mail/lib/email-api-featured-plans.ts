import {
  EMAIL_API_TRANSACTIONAL_PLANS,
  FEATURED_TRANSACTIONAL_PLAN_COPY,
  FEATURED_TRANSACTIONAL_PLAN_IDS,
  type EmailApiPlanDefinition,
  type FeaturedTransactionalPlanId,
} from "@rukny/email-api-pricing";

export {
  FEATURED_TRANSACTIONAL_PLAN_COPY,
  FEATURED_TRANSACTIONAL_PLAN_IDS,
  type FeaturedTransactionalPlanId,
};

export const FEATURED_TRANSACTIONAL_PLANS: EmailApiPlanDefinition[] =
  EMAIL_API_TRANSACTIONAL_PLANS.filter((plan) =>
    FEATURED_TRANSACTIONAL_PLAN_IDS.includes(
      plan.id as FeaturedTransactionalPlanId,
    ),
  );

export function featuredPlanCopy(planId: FeaturedTransactionalPlanId) {
  return FEATURED_TRANSACTIONAL_PLAN_COPY[planId];
}
