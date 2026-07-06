import { describe, expect, it } from '@jest/globals';
import {
  resolveEffectiveSubscriptionPlan,
  shouldExpireActiveSubscription,
} from './subscription-effective-plan.util';

const future = new Date('2030-01-01T00:00:00.000Z');
const past = new Date('2020-01-01T00:00:00.000Z');

describe('resolveEffectiveSubscriptionPlan', () => {
  it('returns FREE when there is no subscription', () => {
    expect(resolveEffectiveSubscriptionPlan(null)).toBe('FREE');
  });

  it('returns PRO for active paid subscriptions', () => {
    expect(
      resolveEffectiveSubscriptionPlan({
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: future,
      }),
    ).toBe('PRO');
  });

  it('keeps paid access for cancelled subscriptions until period end', () => {
    expect(
      resolveEffectiveSubscriptionPlan({
        plan: 'PRO',
        status: 'CANCELLED',
        currentPeriodEnd: future,
      }),
    ).toBe('PRO');
  });

  it('keeps paid access for past-due subscriptions until period end', () => {
    expect(
      resolveEffectiveSubscriptionPlan({
        plan: 'WHALE',
        status: 'PAST_DUE',
        currentPeriodEnd: future,
      }),
    ).toBe('WHALE');
  });

  it('downgrades to FREE after period end', () => {
    expect(
      resolveEffectiveSubscriptionPlan({
        plan: 'PRO',
        status: 'CANCELLED',
        currentPeriodEnd: past,
      }),
    ).toBe('FREE');
  });
});

describe('shouldExpireActiveSubscription', () => {
  it('flags active subscriptions past their end date', () => {
    expect(
      shouldExpireActiveSubscription({
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: past,
      }),
    ).toBe(true);
  });
});
