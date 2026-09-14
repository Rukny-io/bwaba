/**
 * Marketing estimate catalog for /pricing/estimate.
 * Seat prices mirror mail-plans; outbound volume rates are estimate-only
 * until usage billing ships in the console.
 */

import {
  formatMailIqD,
  getMailPlan,
  listMailPlans,
  mailPlanHighlights,
  mailPlanMonthlyTotal,
  type MailPlanId,
} from "@/lib/mail-plans";

export const MAIL_ESTIMATE_OUTBOUND_MIN = 100;
export const MAIL_ESTIMATE_OUTBOUND_MAX = 200_000;
export const MAIL_ESTIMATE_MAILBOX_MIN = 1;
export const MAIL_ESTIMATE_MAILBOX_MAX = 500;

/**
 * Included outbound / month — clear ladder:
 * Starter for light use, Standard for teams, Premium for high volume.
 */
export const MAIL_ESTIMATE_INCLUDED_OUTBOUND: Record<MailPlanId, number> = {
  starter: 5_000,
  standard: 25_000,
  premium: 100_000,
};

/**
 * Marginal overage rates (IQD per 1,000 emails), applied in order.
 * Example: 50K overage = 10×1000 + 40×700 = 10,000 + 28,000 = 38,000 IQD.
 */
export const MAIL_ESTIMATE_OVERAGE_BRACKETS = [
  { upToEmails: 10_000, iqdPerThousand: 1_000 },
  { upToEmails: 50_000, iqdPerThousand: 700 },
  { upToEmails: 100_000, iqdPerThousand: 500 },
  { upToEmails: Number.POSITIVE_INFINITY, iqdPerThousand: 400 },
] as const;

/** Preset chips — answers “what does N emails cost?” */
export const MAIL_ESTIMATE_VOLUME_PRESETS = [
  { label: "1K", emails: 1_000 },
  { label: "5K", emails: 5_000 },
  { label: "10K", emails: 10_000 },
  { label: "50K", emails: 50_000 },
  { label: "100K", emails: 100_000 },
] as const;

/**
 * Public rate card rows for the estimate UI (overage only, if nothing included).
 */
export const MAIL_ESTIMATE_RATE_CARD = [
  { label: "1,000 emails", emails: 1_000 },
  { label: "10,000 emails", emails: 10_000 },
  { label: "50,000 emails", emails: 50_000 },
  { label: "100,000 emails", emails: 100_000 },
] as const;

export type MailEstimateFeatureNeeds = {
  openTracking: boolean;
  linkAndFileTracking: boolean;
  premiumDelivery: boolean;
};

export type MailEstimateInput = {
  planId: MailPlanId;
  mailboxes: number;
  monthlyOutbound: number;
};

export type MailEstimateBreakdown = {
  planId: MailPlanId;
  planName: string;
  mailboxes: number;
  monthlyOutbound: number;
  includedOutbound: number;
  billableEmails: number;
  seatsCost: number;
  basePlanCost: number;
  extraMailboxes: number;
  extraMailboxUnit: number;
  extraSeatsCost: number;
  volumeCost: number;
  totalMonthly: number;
  /** IQD per 1,000 billable emails; null if no overage */
  costPerThousandBillable: number | null;
  /** totalMonthly / (monthlyOutbound/1000) when outbound > 0 */
  effectiveCostPerThousand: number | null;
  highlights: string[];
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Cost in IQD for billable (overage) emails using marginal brackets. */
export function rateForBillableEmails(billableEmails: number): number {
  let remaining = Math.max(0, Math.floor(billableEmails));
  if (remaining <= 0) return 0;

  let cost = 0;
  let covered = 0;

  for (const bracket of MAIL_ESTIMATE_OVERAGE_BRACKETS) {
    const bracketSize = bracket.upToEmails - covered;
    if (bracketSize <= 0) continue;
    const take = Math.min(remaining, bracketSize);
    cost += (take / 1000) * bracket.iqdPerThousand;
    remaining -= take;
    covered += take;
    if (remaining <= 0) break;
  }

  return Math.round(cost);
}

/** Overage cost if the full volume were billable (no plan included). */
export function estimateRawVolumeCost(emails: number): number {
  return rateForBillableEmails(emails);
}

export function estimateMailMonthlyCost(
  input: MailEstimateInput,
): MailEstimateBreakdown {
  const plan = getMailPlan(input.planId);
  const mailboxes = clamp(
    Math.floor(input.mailboxes) || 1,
    MAIL_ESTIMATE_MAILBOX_MIN,
    MAIL_ESTIMATE_MAILBOX_MAX,
  );
  const monthlyOutbound = clamp(
    Math.floor(input.monthlyOutbound) || 0,
    MAIL_ESTIMATE_OUTBOUND_MIN,
    MAIL_ESTIMATE_OUTBOUND_MAX,
  );

  const includedOutbound = MAIL_ESTIMATE_INCLUDED_OUTBOUND[input.planId];
  const billableEmails = Math.max(0, monthlyOutbound - includedOutbound);
  const volumeCost = rateForBillableEmails(billableEmails);
  const seatsCost = mailPlanMonthlyTotal(input.planId, mailboxes);
  const extraMailboxes = Math.max(0, mailboxes - plan.limits.mailboxesIncluded);
  const extraSeatsCost = extraMailboxes * plan.priceExtraMailbox;
  const totalMonthly = seatsCost + volumeCost;

  const costPerThousandBillable =
    billableEmails > 0
      ? Math.round((volumeCost / billableEmails) * 1000)
      : null;
  const effectiveCostPerThousand =
    monthlyOutbound > 0
      ? Math.round((totalMonthly / monthlyOutbound) * 1000)
      : null;

  return {
    planId: input.planId,
    planName: plan.name,
    mailboxes,
    monthlyOutbound,
    includedOutbound,
    billableEmails,
    seatsCost,
    basePlanCost: plan.priceMonthly,
    extraMailboxes,
    extraMailboxUnit: plan.priceExtraMailbox,
    extraSeatsCost,
    volumeCost,
    totalMonthly,
    costPerThousandBillable,
    effectiveCostPerThousand,
    highlights: [
      ...mailPlanHighlights(plan),
      `${includedOutbound.toLocaleString("en-IQ")} outbound emails included / mo`,
    ],
  };
}

export function estimateAllPlans(input: Omit<MailEstimateInput, "planId">) {
  return listMailPlans().map((plan) =>
    estimateMailMonthlyCost({
      planId: plan.id,
      mailboxes: input.mailboxes,
      monthlyOutbound: input.monthlyOutbound,
    }),
  );
}

/**
 * Recommend cheapest plan that satisfies feature gates.
 * Also bumps minimum plan when volume clearly needs higher included quota.
 */
export function recommendMailPlan(input: {
  mailboxes: number;
  monthlyOutbound: number;
  features?: Partial<MailEstimateFeatureNeeds>;
}): MailPlanId {
  const features: MailEstimateFeatureNeeds = {
    openTracking: Boolean(input.features?.openTracking),
    linkAndFileTracking: Boolean(input.features?.linkAndFileTracking),
    premiumDelivery: Boolean(input.features?.premiumDelivery),
  };

  let minPlan: MailPlanId = "starter";
  if (
    features.openTracking ||
    input.monthlyOutbound > MAIL_ESTIMATE_INCLUDED_OUTBOUND.starter
  ) {
    minPlan = "standard";
  }
  if (
    features.linkAndFileTracking ||
    features.premiumDelivery ||
    input.monthlyOutbound > MAIL_ESTIMATE_INCLUDED_OUTBOUND.standard
  ) {
    minPlan = "premium";
  }

  const order: MailPlanId[] = ["starter", "standard", "premium"];
  const startIdx = order.indexOf(minPlan);
  const candidates = order.slice(startIdx);

  let best = candidates[0];
  let bestTotal = Number.POSITIVE_INFINITY;

  for (const planId of candidates) {
    const est = estimateMailMonthlyCost({
      planId,
      mailboxes: input.mailboxes,
      monthlyOutbound: input.monthlyOutbound,
    });
    if (est.totalMonthly < bestTotal) {
      bestTotal = est.totalMonthly;
      best = planId;
    }
  }

  return best;
}

export function formatEstimateIqD(amount: number): string {
  return formatMailIqD(Math.round(amount));
}

export function formatOutboundLabel(emails: number): string {
  if (emails >= 1000) {
    const k = emails / 1000;
    return Number.isInteger(k) ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return String(emails);
}
