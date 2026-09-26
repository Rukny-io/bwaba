import { describe, expect, it } from 'vitest';
import { DeveloperEmailPlanId } from './catalog';
import {
  EMAIL_API_TRANSACTIONAL_VOLUME_STOPS,
  emailApiPlanTier,
  estimateTransactionalAtStop,
  recommendTransactionalPlanForVolume,
} from './estimate';

describe('email-api-pricing estimate', () => {
  it('maps slider stops to public tiers', () => {
    expect(EMAIL_API_TRANSACTIONAL_VOLUME_STOPS).toHaveLength(4);
    expect(estimateTransactionalAtStop(0).plan.id).toBe(DeveloperEmailPlanId.FREE);
    expect(estimateTransactionalAtStop(1).plan.id).toBe(
      DeveloperEmailPlanId.PRO_50K,
    );
    expect(estimateTransactionalAtStop(2).plan.id).toBe(
      DeveloperEmailPlanId.PRO_100K,
    );
    expect(estimateTransactionalAtStop(3).tier).toBe('enterprise');
  });

  it('recommends cheapest self-serve plan for arbitrary volume', () => {
    expect(recommendTransactionalPlanForVolume(45_000).id).toBe(
      DeveloperEmailPlanId.PRO_50K,
    );
    expect(recommendTransactionalPlanForVolume(100_000).id).toBe(
      DeveloperEmailPlanId.PRO_100K,
    );
    expect(recommendTransactionalPlanForVolume(5_000_000).id).toBe(
      DeveloperEmailPlanId.ENTERPRISE,
    );
  });

  it('classifies plan families', () => {
    expect(emailApiPlanTier(DeveloperEmailPlanId.PRO_50K)).toBe('pro');
    expect(emailApiPlanTier(DeveloperEmailPlanId.PRO_100K)).toBe('pro');
    expect(emailApiPlanTier(DeveloperEmailPlanId.SCALE_1M)).toBe('scale');
    expect(emailApiPlanTier(DeveloperEmailPlanId.ENTERPRISE)).toBe(
      'enterprise',
    );
  });
});
