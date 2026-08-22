import { sessionFetch } from "@/lib/api-client";
import { isValidMailAppId, readMailAppIdFromDocument } from "@/lib/mail-app-id";
import {
  isMailPlanId,
  toApiMailPlan,
  type MailPlanId,
  type MailPlanLimits,
} from "@/lib/mail-plans";

export type MailSubscriptionView = {
  id: string;
  mailAppId: string | null;
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
  storageQuotaBytesPerMailbox: number;
  features: {
    agenticMail: boolean;
    aiToolsUnlimited: boolean;
    openTracking: boolean;
    smartAiReplies: boolean;
    automaticReplies: boolean;
    linkAndFileTracking: boolean;
  };
};

export type MailPendingPlanRequest = {
  ticketId: string;
  ticketNumber: string;
  plan: string | null;
  mailboxCount: number;
  monthlyTotal: number | null;
  createdAt: string;
};

export type MailAppSubscriptionSnapshot = {
  app: { appId: string; name: string; primaryDomain: string | null } | null;
  subscription: MailSubscriptionView | null;
  pendingRequest: MailPendingPlanRequest | null;
  needsApp: boolean;
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

function emptyFeatures(): MailSubscriptionView["features"] {
  return {
    agenticMail: false,
    aiToolsUnlimited: false,
    openTracking: false,
    smartAiReplies: false,
    automaticReplies: false,
    linkAndFileTracking: false,
  };
}

function normalizeSubscription(sub: MailSubscriptionView): MailSubscriptionView {
  return {
    ...sub,
    planId: isMailPlanId(sub.planId)
      ? sub.planId
      : ((sub.plan || "").toLowerCase() as MailPlanId),
    renewsAt: sub.renewsAt ?? sub.currentPeriodEnd,
    storageQuotaBytesPerMailbox: Number(sub.storageQuotaBytesPerMailbox) || 0,
    features: sub.features ?? emptyFeatures(),
  };
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

export async function fetchMailSubscription(
  appId = readMailAppIdFromDocument(),
): Promise<MailAppSubscriptionSnapshot> {
  if (!isValidMailAppId(appId)) {
    return {
      app: null,
      subscription: null,
      pendingRequest: null,
      needsApp: true,
    };
  }

  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/subscription`,
  );
  const data = await readJson<{
    app?: MailAppSubscriptionSnapshot["app"];
    subscription?: MailSubscriptionView | null;
    pendingRequest?: MailPendingPlanRequest | null;
  }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load subscription."));
  }
  const sub = data.subscription ?? null;
  return {
    app: data.app ?? null,
    subscription: sub ? normalizeSubscription(sub) : null,
    pendingRequest: data.pendingRequest ?? null,
    needsApp: false,
  };
}

export async function requestMailPlan(
  planId: MailPlanId,
  mailboxCount: number,
  appId = readMailAppIdFromDocument(),
): Promise<{ alreadyPending: boolean; ticket: MailPendingPlanRequest }> {
  if (!isValidMailAppId(appId)) {
    throw new Error("Open a Mail app first, then request a plan for that app.");
  }
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/subscription/request`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: toApiMailPlan(planId),
        mailboxCount,
      }),
    },
  );
  const data = await readJson<{
    alreadyPending?: boolean;
    ticket?: MailPendingPlanRequest;
  }>(response);
  if (!response.ok || !data.ticket) {
    throw new Error(errorMessage(data, "Could not submit this plan request."));
  }
  return {
    alreadyPending: Boolean(data.alreadyPending),
    ticket: data.ticket,
  };
}
