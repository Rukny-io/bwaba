/**
 * Mail hosted-email cost estimator — mirrors Billing checkout rules.
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

export const MAIL_ESTIMATE_PACK_EMAILS = MAIL_OUTBOUND_PACK_EMAILS;

export function packPriceForPlan(planId: MailPlanId): number | null {
  return MAIL_OUTBOUND_PACK_PRICE_IQD[planId] ?? null;
}

/** Flat pack price on paid self-serve plans (Starter & Professional). */
export const MAIL_ESTIMATE_PACK_PRICE_IQD =
  MAIL_OUTBOUND_PACK_PRICE_IQD.starter ?? 800;

export const MAIL_ESTIMATE_VOLUME_PRESETS = [
  { label: "1K", emails: 1_000 },
  { label: "4K", emails: 4_000 },
  { label: "10K", emails: 10_000 },
  { label: "15K", emails: 15_000 },
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
  volumeCost: number;
  totalMonthly: number;
  overQuota: boolean;
  packsAvailable: boolean;
  upgradeRequired: boolean;
  packPriceIqd: number;
  highlights: string[];
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function packThousandsForEmails(billableEmails: number): number {
  const n = Math.max(0, Math.floor(billableEmails));
  if (n <= 0) return 0;
  return Math.ceil(n / MAIL_ESTIMATE_PACK_EMAILS);
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
  const packsAvailable = packPriceForPlan(input.planId) != null;
  const packPriceIqd = packsAvailable
    ? (packPriceForPlan(input.planId) as number)
    : MAIL_ESTIMATE_PACK_PRICE_IQD;
  const packThousands = packsAvailable ? packThousandsForEmails(billableEmails) : 0;
  const volumeCost = packThousands * packPriceIqd;
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
    packsAvailable,
    upgradeRequired: billableEmails > 0 && !packsAvailable,
    packPriceIqd,
    highlights: [
      ...mailPlanHighlights(plan),
      `${includedOutbound.toLocaleString("en-IQ")} outbound emails included / mo`,
      packsAvailable
        ? `${packPriceIqd.toLocaleString("en-IQ")} IQD / ${MAIL_ESTIMATE_PACK_EMAILS.toLocaleString("en-IQ")} extra emails`
        : "Outbound packs available on paid plans",
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

function minimumPlanForFeatures(
  features: MailEstimateFeatureNeeds,
): MailPlanId {
  if (
    features.openTracking ||
    features.linkAndFileTracking ||
    features.premiumDelivery
  ) {
    return "professional";
  }
  return "free";
}

function minimumPlanForVolume(input: {
  mailboxes: number;
  monthlyOutbound: number;
}): MailPlanId {
  if (
    input.mailboxes > getMailPlan("free").limits.mailboxesIncluded ||
    input.monthlyOutbound > MAIL_ESTIMATE_INCLUDED_OUTBOUND.free
  ) {
    if (input.monthlyOutbound > MAIL_ESTIMATE_INCLUDED_OUTBOUND.starter) {
      return "professional";
    }
    return "starter";
  }
  return "free";
}

/** Cheapest plan that satisfies seats, outbound, and feature gates. */
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

  const featureFloor = minimumPlanForFeatures(features);
  const volumeFloor = minimumPlanForVolume(input);
  const order: MailPlanId[] = ["free", "starter", "professional"];
  const floorIdx = Math.max(
    order.indexOf(featureFloor),
    order.indexOf(volumeFloor),
  );
  const candidates = order.slice(floorIdx);

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
