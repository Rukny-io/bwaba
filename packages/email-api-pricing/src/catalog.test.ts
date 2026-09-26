import { describe, expect, it } from 'vitest';
import {
  DeveloperEmailPlanId,
  EMAIL_API_AUTOMATION,
  EMAIL_API_MARKETING_PLANS,
  EMAIL_API_TRANSACTIONAL_PLANS,
  getEmailApiPlan,
  getEmailApiPlanTier,
} from '../src/catalog';
import {
  formatEmailApiInvoiceLine,
  formatEmailApiPlanTitle,
} from '../src/format';

describe('@rukny/email-api-pricing catalog', () => {
  it('keeps Resend-aligned free tier', () => {
    const free = getEmailApiPlan(DeveloperEmailPlanId.FREE);
    expect(free.monthlyQuota).toBe(3_000);
    expect(free.dailyLimit).toBe(100);
    expect(free.priceMonthlyIqd).toBe(0);
  });

  it('keeps competitive Pro 50K tier', () => {
    const pro50k = getEmailApiPlan(DeveloperEmailPlanId.PRO_50K);
    expect(pro50k.priceMonthlyIqd).toBe(16_000);
    expect(pro50k.monthlyQuota).toBe(50_000);
    expect(pro50k.overagePer1kIqd).toBe(700);
  });

  it('includes high-volume scale tiers', () => {
    const ids = EMAIL_API_TRANSACTIONAL_PLANS.map((plan) => plan.id);
    expect(ids).toContain(DeveloperEmailPlanId.SCALE_1_5M);
    expect(ids).toContain(DeveloperEmailPlanId.SCALE_2_5M);
    expect(getEmailApiPlan(DeveloperEmailPlanId.SCALE_1_5M).priceMonthlyIqd).toBe(660_000);
    expect(getEmailApiPlan(DeveloperEmailPlanId.SCALE_2_5M).priceMonthlyIqd).toBe(920_000);
  });

  it('aligns marketing free tier to 1,000 contacts', () => {
    const marketingFree = EMAIL_API_MARKETING_PLANS.find((plan) => plan.id === 'FREE');
    expect(marketingFree?.contactsLimit).toBe(1_000);
  });

  it('uses Resend-style automation allowance', () => {
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
      expect(['starter', 'growth', 'business', 'enterprise']).toContain(plan.tier);
      expect(formatEmailApiPlanTitle(plan, 'en')).toBe(plan.marketingNameEn);
      expect(formatEmailApiInvoiceLine(plan, 'ar')).toBe(plan.invoiceLabelAr);
      expect(getEmailApiPlanTier(plan.id)).toBe(plan.tier);
    }
  });

  it('maps growth tier to PRO plans and business tier to SCALE plans', () => {
    expect(getEmailApiPlan(DeveloperEmailPlanId.PRO_50K).marketingNameEn).toBe('Growth');
    expect(getEmailApiPlan(DeveloperEmailPlanId.SCALE_500K).marketingNameEn).toBe('Business');
    expect(getEmailApiPlan(DeveloperEmailPlanId.FREE).marketingNameEn).toBe('Starter');
    expect(getEmailApiPlan(DeveloperEmailPlanId.ENTERPRISE).marketingNameEn).toBe('Enterprise');
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
