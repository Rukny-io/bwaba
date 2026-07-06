import {
  hasMinFeatureTier,
  tierRank,
  resolveFormAnalyticsTierForFree,
} from './form-feature-tier.util';
import { PLAN_LIMITS } from './plan-limits.config';

describe('form-feature-tier.util', () => {
  it('ranks tiers correctly', () => {
    expect(tierRank('basic')).toBe(1);
    expect(tierRank('advanced')).toBe(2);
    expect(tierRank('full')).toBe(3);
    expect(tierRank(false)).toBe(0);
  });

  it('allows WHALE advanced analytics', () => {
    expect(
      hasMinFeatureTier(PLAN_LIMITS.WHALE, 'formAnalytics', 'advanced'),
    ).toBe(true);
  });

  it('denies PRO advanced analytics', () => {
    expect(
      hasMinFeatureTier(PLAN_LIMITS.PRO, 'formAnalytics', 'advanced'),
    ).toBe(false);
  });

  it('resolves FREE to basic analytics', () => {
    expect(
      resolveFormAnalyticsTierForFree('FREE', {
        ...PLAN_LIMITS.FREE,
        formAnalytics: false,
      }),
    ).toBe('basic');
  });
});
