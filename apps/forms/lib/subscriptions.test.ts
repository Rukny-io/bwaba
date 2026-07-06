import { describe, expect, it } from 'vitest';
import {
  hasFormAnalyticsTier,
  isPlanFeatureEnabled,
  pickFormsPlanLimits,
  resolveFormAnalyticsTier,
} from '@/lib/api/subscriptions';
import type { PlanLimitsSnapshot } from '@/lib/api/subscriptions';

const PRO_LIMITS: PlanLimitsSnapshot = {
  forms: 10,
  fieldsPerForm: 50,
  submissionsPerMonth: 1000,
  multiStepForms: true,
  conditionalLogic: 'basic',
  googleSheets: false,
  googleDrive: false,
  webhook: false,
  formAnalytics: 'basic',
  emailFieldVerification: true,
  phoneWhatsappVerification: true,
  formTeam: true,
  teamMembers: 2,
  removeWatermark: true,
};

const WHALE_LIMITS: PlanLimitsSnapshot = {
  ...PRO_LIMITS,
  formAnalytics: 'advanced',
};

const BUSINESS_LIMITS: PlanLimitsSnapshot = {
  ...PRO_LIMITS,
  formAnalytics: 'full',
};

describe('plan feature gates', () => {
  it('enables WhatsApp verification for PRO limits', () => {
    expect(
      isPlanFeatureEnabled(PRO_LIMITS, 'phoneWhatsappVerification', 'PRO'),
    ).toBe(true);
  });

  it('falls back to plan when limits payload is missing', () => {
    expect(
      isPlanFeatureEnabled(null, 'emailFieldVerification', 'PRO'),
    ).toBe(true);
    expect(
      isPlanFeatureEnabled(null, 'emailFieldVerification', 'FREE'),
    ).toBe(false);
  });

  it('normalizes API limits objects', () => {
    const normalized = pickFormsPlanLimits({
      forms: Infinity,
      fieldsPerForm: 50,
      submissionsPerMonth: 1000,
      multiStepForms: true,
      conditionalLogic: 'basic',
      googleSheets: true,
      googleDrive: true,
      webhook: true,
      formAnalytics: 'basic',
      emailFieldVerification: true,
      phoneWhatsappVerification: true,
      formTeam: true,
      teamMembers: 2,
      removeWatermark: true,
    });

    expect(normalized?.phoneWhatsappVerification).toBe(true);
    expect(normalized?.emailFieldVerification).toBe(true);
    expect(normalized?.multiStepForms).toBe(true);
    expect(normalized?.forms).toBe(-1);
  });
});

describe('form analytics tiers', () => {
  it('FREE resolves to basic analytics', () => {
    expect(
      resolveFormAnalyticsTier('FREE', { ...PRO_LIMITS, formAnalytics: false }),
    ).toBe('basic');
  });

  it('PRO has basic but not advanced', () => {
    expect(hasFormAnalyticsTier(PRO_LIMITS, 'basic', 'PRO')).toBe(true);
    expect(hasFormAnalyticsTier(PRO_LIMITS, 'advanced', 'PRO')).toBe(false);
  });

  it('WHALE has advanced analytics', () => {
    expect(hasFormAnalyticsTier(WHALE_LIMITS, 'advanced', 'WHALE')).toBe(true);
    expect(hasFormAnalyticsTier(WHALE_LIMITS, 'full', 'WHALE')).toBe(false);
  });

  it('BUSINESS has full analytics', () => {
    expect(hasFormAnalyticsTier(BUSINESS_LIMITS, 'full', 'BUSINESS')).toBe(true);
  });
});
