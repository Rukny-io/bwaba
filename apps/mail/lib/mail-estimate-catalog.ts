/**
 * Marketing estimate catalog for /pricing/estimate.
 * Seat prices + prepaid outbound packs (800 IQD / 1,000) match Billing.
 */

import {
  formatMailIqD,
  getMailPlan,
  listMailPlans,
  mailPlanHighlights,
  mailPlanMonthlyTotal,
  MAIL_INCLUDED_OUTBOUND,
  MAIL_OUTBOUND_PACK_EMAILS,
  MAIL_OUTBOUND_PACK_PRICE_IQD,
  type MailPlanId,
} from "@/lib/mail-plans";

export const MAIL_ESTIMATE_OUTBOUND_MIN = 100;
export const MAIL_ESTIMATE_OUTBOUND_MAX = 200_000;
export const MAIL_ESTIMATE_MAILBOX_MIN = 1;
export const MAIL_ESTIMATE_MAILBOX_MAX = 500;

export const MAIL_ESTIMATE_INCLUDED_OUTBOUND: Record<MailPlanId, number> =
  MAIL_INCLUDED_OUTBOUND;

/** Flat pack price used for overage (same on every plan). */
export const MAIL_ESTIMATE_PACK_PRICE_IQD =
  MAIL_OUTBOUND_PACK_PRICE_IQD.starter ?? 800;

export const MAIL_ESTIMATE_PACK_EMAILS = MAIL_OUTBOUND_PACK_EMAILS;

/** Volume chips aligned with plan quotas. */
export const MAIL_ESTIMATE_VOLUME_PRESETS = [
  { label: "4K", emails: 4_000 },
  { label: "10K", emails: 10_000 },
  { label: "30K", emails: 30_000 },
  { label: "50K", emails: 50_000 },
  { label: "100K", emails: 100_000 },
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
  packThousands: number;
  seatsCost: number;
  basePlanCost: number;
  extraMailboxes: number;
  extraMailboxUnit: number;
  extraSeatsCost: number;
  /** Prepaid packs for overage (ceil to 1K units × 800 IQD). */
  volumeCost: number;
  /** Seats + packs — what Billing charges. */
  totalMonthly: number;
  overQuota: boolean;
  packPriceIqd: number;
  highlights: string[];
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Packs needed for billable emails (whole thousands, min 0). */
export function packThousandsForEmails(billableEmails: number): number {
  const n = Math.max(0, Math.floor(billableEmails));
  if (n <= 0) return 0;
  return Math.ceil(n / MAIL_ESTIMATE_PACK_EMAILS);
}

export function rateForBillableEmails(billableEmails: number): number {
  return packThousandsForEmails(billableEmails) * MAIL_ESTIMATE_PACK_PRICE_IQD;
}

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
  const packThousands = packThousandsForEmails(billableEmails);
  const volumeCost = packThousands * MAIL_ESTIMATE_PACK_PRICE_IQD;
  const seatsCost = mailPlanMonthlyTotal(input.planId, mailboxes);
  const extraMailboxes = Math.max(0, mailboxes - plan.limits.mailboxesIncluded);
  const extraSeatsCost = extraMailboxes * plan.priceExtraMailbox;

  return {
    planId: input.planId,
    planName: plan.name,
    mailboxes,
    monthlyOutbound,
    includedOutbound,
    billableEmails,
    packThousands,
    seatsCost,
    basePlanCost: plan.priceMonthly,
    extraMailboxes,
    extraMailboxUnit: plan.priceExtraMailbox,
    extraSeatsCost,
    volumeCost,
    totalMonthly: seatsCost + volumeCost,
    overQuota: billableEmails > 0,
    packPriceIqd: MAIL_ESTIMATE_PACK_PRICE_IQD,
    highlights: [
      ...mailPlanHighlights(plan),
      `${includedOutbound.toLocaleString("en-IQ")} outbound emails included / mo`,
      `${MAIL_ESTIMATE_PACK_PRICE_IQD.toLocaleString("en-IQ")} IQD / ${MAIL_ESTIMATE_PACK_EMAILS.toLocaleString("en-IQ")} extra emails`,
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
 * Recommend the cheapest plan that satisfies feature gates and quota ladder.
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
