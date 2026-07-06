import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

export type SubscriptionAccessRow = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
};

export function isSubscriptionPeriodActive(
  currentPeriodEnd: Date | null,
  now: Date = new Date(),
): boolean {
  return !currentPeriodEnd || currentPeriodEnd > now;
}

/**
 * Resolves the plan that should grant features right now.
 * Cancelled and past-due subscriptions keep paid access until period end.
 */
export function resolveEffectiveSubscriptionPlan(
  subscription: SubscriptionAccessRow | null | undefined,
  now: Date = new Date(),
): SubscriptionPlan {
  if (!subscription || subscription.plan === 'FREE') {
    return 'FREE';
  }

  if (
    subscription.status === 'EXPIRED' ||
    !isSubscriptionPeriodActive(subscription.currentPeriodEnd, now)
  ) {
    return 'FREE';
  }

  if (
    subscription.status === 'ACTIVE' ||
    subscription.status === 'CANCELLED' ||
    subscription.status === 'PAST_DUE'
  ) {
    return subscription.plan;
  }

  return 'FREE';
}

export function shouldExpireActiveSubscription(
  subscription: SubscriptionAccessRow,
  now: Date = new Date(),
): boolean {
  return (
    subscription.status === 'ACTIVE' &&
    !!subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd <= now
  );
}
