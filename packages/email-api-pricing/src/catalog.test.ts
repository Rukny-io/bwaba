import { describe, expect, it } from 'vitest';
import {
  DeveloperEmailPlanId,
  EMAIL_API_AUTOMATION,
  EMAIL_API_MARKETING_PLANS,
  EMAIL_API_OVERAGE_PACK,
  EMAIL_API_TRANSACTIONAL_PLANS,
  EMAIL_API_UNIFIED_OVERAGE_PER_1K,
  getEmailApiPlan,
  getEmailApiPlanPerks,
  getEmailApiPlanTier,
  listSelfServeTransactionalPlans,
} from '../src/catalog';
import {
  formatEmailApiInvoiceLine,
  formatEmailApiPlanTitle,
} from '../src/format';

describe('@rukny/email-api-pricing catalog', () => {
  it('keeps unified free tier', () => {
    const free = getEmailApiPlan(DeveloperEmailPlanId.FREE);
    expect(free.monthlyQuota).toBe(3_000);
    expect(free.dailyLimit).toBe(100);
    expect(free.priceMonthlyIqd).toBe(0);
  });

  it('exposes three self-serve paid tiers', () => {
    const selfServe = listSelfServeTransactionalPlans();
    expect(selfServe.map((plan) => plan.id)).toEqual([
      DeveloperEmailPlanId.PRO_50K,
      DeveloperEmailPlanId.PRO_100K,
    ]);
    expect(getEmailApiPlan(DeveloperEmailPlanId.PRO_50K).priceMonthlyIqd).toBe(
      16_000,
    );
    expect(getEmailApiPlan(DeveloperEmailPlanId.PRO_100K).priceMonthlyIqd).toBe(
      130_000,
    );
  });

  it('uses unified overage pricing', () => {
    expect(EMAIL_API_OVERAGE_PACK.priceIqd).toBe(
      EMAIL_API_UNIFIED_OVERAGE_PER_1K,
    );
    expect(getEmailApiPlan(DeveloperEmailPlanId.PRO_50K).overagePer1kIqd).toBe(
      1_000,
    );
    expect(getEmailApiPlan(DeveloperEmailPlanId.PRO_100K).overagePer1kIqd).toBe(
      1_000,
    );
  });

  it('keeps legacy scale tiers admin-only', () => {
    expect(getEmailApiPlan(DeveloperEmailPlanId.SCALE_500K).selfServe).toBe(
      false,
    );
    expect(getEmailApiPlan(DeveloperEmailPlanId.PRO_10K).selfServe).toBe(false);
  });

  it('aligns marketing free tier to 1,000 contacts', () => {
    const marketingFree = EMAIL_API_MARKETING_PLANS.find(
      (plan) => plan.id === 'FREE',
    );
    expect(marketingFree?.contactsLimit).toBe(1_000);
  });

  it('uses automation allowance', () => {
    expect(EMAIL_API_AUTOMATION.includedRunsPerMonth).toBe(10_000);
    expect(EMAIL_API_AUTOMATION.overagePriceIqdPerRun).toBe(2);
  });

  it('defines marketing names and invoice labels for every transactional plan', () => {
    for (const plan of EMAIL_API_TRANSACTIONAL_PLANS) {
      expect(plan.marketingNameEn.trim().length).toBeGreaterThan(0);
      expect(plan.marketingNameAr.trim().length).toBeGreaterThan(0);
      expect(plan.invoiceLabelEn.trim().length).toBeGreaterThan(0);
      expect(plan.invoiceLabelAr.trim().length).toBeGreaterThan(0);
      expect(plan.slug.trim().length).toBeGreaterThan(0);
      expect(['starter', 'growth', 'business', 'enterprise']).toContain(
        plan.tier,
      );
      expect(formatEmailApiPlanTitle(plan, 'en')).toBe(plan.marketingNameEn);
      expect(formatEmailApiInvoiceLine(plan, 'ar')).toBe(plan.invoiceLabelAr);
      expect(getEmailApiPlanTier(plan.id)).toBe(plan.tier);
    }
  });

  it('maps public tiers to Starter, Growth, and Enterprise', () => {
    expect(getEmailApiPlan(DeveloperEmailPlanId.FREE).marketingNameEn).toBe(
      'Starter',
    );
    expect(getEmailApiPlan(DeveloperEmailPlanId.PRO_50K).marketingNameEn).toBe(
      'Growth',
    );
    expect(getEmailApiPlan(DeveloperEmailPlanId.PRO_100K).marketingNameEn).toBe(
      'Enterprise',
    );
  });

  it('assigns enterprise perks to PRO_100K', () => {
    expect(getEmailApiPlanPerks(DeveloperEmailPlanId.PRO_100K)).toEqual({
      webhooksIncluded: 10,
      aiCreditsMonthly: 500,
      slackChannelEnabled: true,
    });
  });

  it('defines marketing names and invoice labels for every marketing plan', () => {
    for (const plan of EMAIL_API_MARKETING_PLANS) {
      expect(plan.marketingNameEn.trim().length).toBeGreaterThan(0);
      expect(plan.marketingNameAr.trim().length).toBeGreaterThan(0);
      expect(plan.invoiceLabelEn.trim().length).toBeGreaterThan(0);
      expect(plan.invoiceLabelAr.trim().length).toBeGreaterThan(0);
      expect(plan.slug.trim().length).toBeGreaterThan(0);
    }
  });
});
