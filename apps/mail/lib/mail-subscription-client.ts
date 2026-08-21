import { sessionFetch } from "@/lib/api-client";
import {
  isMailPlanId,
  toApiMailPlan,
  type MailPlanId,
  type MailPlanLimits,
} from "@/lib/mail-plans";

export type MailSubscriptionView = {
  id: string;
  planId: MailPlanId;
  plan: string;
  planName: string;
  status: string;
  mailboxCount: number;
  priceMonthlyPerMailbox: number;
  monthlyTotal: number;
  renewsAt: string | null;
  currentPeriodEnd: string | null;
  limits: MailPlanLimits;
};

type PlansResponse = {
  currency: string;
  plans: Array<{
    id: string;
    planId: string;
    name: string;
    bestFor: string;
    priceMonthly: number;
    popular: boolean;
    highlights: string[];
    limits: MailPlanLimits;
    benefits: string[];
  }>;
};

async function readJson<T>(response: Response): Promise<T & { message?: string | string[]; error?: string }> {
  return (await response.json().catch(() => ({}))) as T & {
    message?: string | string[];
    error?: string;
  };
}

function errorMessage(data: { message?: string | string[]; error?: string }, fallback: string) {
  const raw = data.message ?? data.error;
  if (Array.isArray(raw)) return raw[0] || fallback;
  return raw || fallback;
}

export async function fetchMailPlans() {
  const response = await sessionFetch("/api/v1/mail/plans");
  const data = await readJson<PlansResponse>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load plans."));
  }
  return {
    currency: data.currency,
    plans: (data.plans ?? []).map((plan) => ({
      id: (plan.planId || plan.id || "").toLowerCase() as MailPlanId,
      name: plan.name,
      bestFor: plan.bestFor,
      priceMonthly: plan.priceMonthly,
      popular: Boolean(plan.popular),
      highlights: plan.highlights ?? [],
      limits: plan.limits,
      benefits: plan.benefits ?? [],
    })),
  };
}

export async function fetchMailSubscription(): Promise<MailSubscriptionView | null> {
  const response = await sessionFetch("/api/v1/mail/subscription");
  const data = await readJson<{ subscription?: MailSubscriptionView | null }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load subscription."));
  }
  const sub = data.subscription ?? null;
  if (!sub) return null;
  return {
    ...sub,
    planId: isMailPlanId(sub.planId)
      ? sub.planId
      : ((sub.plan || "").toLowerCase() as MailPlanId),
    renewsAt: sub.renewsAt ?? sub.currentPeriodEnd,
  };
}

export async function activateMailSubscription(
  planId: MailPlanId,
  mailboxCount: number,
): Promise<MailSubscriptionView> {
  const response = await sessionFetch("/api/v1/mail/subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plan: toApiMailPlan(planId),
      mailboxCount,
      billingCycle: "MONTHLY",
    }),
  });
  const data = await readJson<{ subscription?: MailSubscriptionView }>(response);
  if (!response.ok || !data.subscription) {
    throw new Error(errorMessage(data, "Could not activate this plan."));
  }
  const sub = data.subscription;
  return {
    ...sub,
    planId: isMailPlanId(sub.planId)
      ? sub.planId
      : ((sub.plan || "").toLowerCase() as MailPlanId),
    renewsAt: sub.renewsAt ?? sub.currentPeriodEnd,
  };
}

export async function cancelMailSubscription(): Promise<void> {
  const response = await sessionFetch("/api/v1/mail/subscription", {
    method: "DELETE",
  });
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not cancel subscription."));
  }
}
