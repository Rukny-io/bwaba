import type { DeveloperEmailPlan } from '@prisma/client';

/**
 * Future Email API checkout sessions must send only `planId` from the client.
 * Amount, title, and invoice labels are resolved from @rukny/email-api-pricing
 * when the session is created (never trusted from the browser).
 *
 * On payment success: call EmailBillingService.activatePlan(userId, planId).
 * Wallet ledger description should use plan.invoiceLabelEn / invoiceLabelAr.
 */
export type EmailApiCheckoutSessionMeta = {
  product: 'email_api_transactional';
  planId: DeveloperEmailPlan;
};
