/**
 * Client catalog — mirrors @rukny/mail-pricing / GET /api/v1/mail/plans.
 */

import {
  getMailPlan as getCatalogPlan,
  isMailUnlimited,
  MAIL_ANNUAL_DISCOUNT_PERCENT,
  MAIL_CURRENCY,
  MAIL_OUTBOUND_PACK_EMAILS,
  MAIL_SELF_SERVE_PLAN_ORDER,
  MailPlanId as CatalogMailPlanId,
  mailIncludedOutbound,
  mailMonthlyTotal,
  mailOutboundPackPrice,
  type MailPlanLimits,
} from "@rukny/mail-pricing";

export {
  MAIL_ANNUAL_DISCOUNT_PERCENT,
  MAIL_CURRENCY,
  MAIL_OUTBOUND_PACK_EMAILS,
  isMailUnlimited,
  type MailPlanLimits,
};

export type MailBillingPeriod = "monthly" | "yearly";

export const MAIL_CURRENCY_LABEL = MAIL_CURRENCY;
export const MAIL_UNLIMITED = Number.MAX_SAFE_INTEGER;

export type MailPlanId = "free" | "starter" | "professional";

export type MailPlanDefinition = {
  id: MailPlanId;
  name: string;
  nameAr: string;
  bestFor: string;
  priceMonthly: number;
  priceExtraMailbox: number;
  domainsIncluded: number;
  monthlyOutbound: number;
  limits: MailPlanLimits;
  benefits: string[];
  popular?: boolean;
};

const SHARED_BENEFITS: string[] = [
  "AI email assistant",
  "Webmail & Calendar",
  "Anti-Spam protection",
  "2FA protection",
];

function toClientId(planId: CatalogMailPlanId): MailPlanId {
  if (planId === CatalogMailPlanId.FREE) return "free";
  if (planId === CatalogMailPlanId.PROFESSIONAL) return "professional";
  return "starter";
}

function toCatalogId(planId: MailPlanId): CatalogMailPlanId {
  if (planId === "free") return CatalogMailPlanId.FREE;
  if (planId === "professional") return CatalogMailPlanId.PROFESSIONAL;
  return CatalogMailPlanId.STARTER;
}

function buildDefinition(planId: CatalogMailPlanId): MailPlanDefinition {
  const catalog = getCatalogPlan(planId);
  const benefits = [...SHARED_BENEFITS];
  if (catalog.limits.premiumDelivery) {
    benefits.push("Premium email delivery");
  }
  return {
    id: toClientId(planId),
    name: catalog.nameEn,
    nameAr: catalog.nameAr,
    bestFor: catalog.bestForEn,
    priceMonthly: catalog.priceMonthlyIqd,
    priceExtraMailbox: catalog.priceExtraMailboxIqd,
    domainsIncluded: catalog.domainsIncluded,
    monthlyOutbound: catalog.monthlyOutbound,
    limits: catalog.limits,
    benefits,
    popular: catalog.popular,
  };
}

export const MAIL_PLANS: Record<MailPlanId, MailPlanDefinition> = {
  free: buildDefinition(CatalogMailPlanId.FREE),
  starter: buildDefinition(CatalogMailPlanId.STARTER),
  professional: buildDefinition(CatalogMailPlanId.PROFESSIONAL),
};

export const MAIL_PLAN_IDS: MailPlanId[] = ["free", "starter", "professional"];

export function formatMailAliasLimit(value: number): string {
  return isMailUnlimited(value) ? "Unlimited" : String(value);
}

export function mailPlanHighlights(plan: MailPlanDefinition): string[] {
  const included = plan.limits.mailboxesIncluded;
  const mailboxLine =
    included === 1 ? "1 mailbox included" : `${included} mailboxes included`;
  const consoleLine =
    plan.limits.consoleMembersIncluded === 0
      ? "Owner-only console"
      : `${plan.limits.consoleMembersIncluded} console members included`;
  const aliasLine = isMailUnlimited(plan.limits.emailAliases)
    ? "Unlimited aliases per mailbox"
    : `${plan.limits.emailAliases} aliases per mailbox`;
  return [
    mailboxLine,
    consoleLine,
    `${plan.limits.storageGbPerMailbox} GB for emails`,
    `${plan.domainsIncluded} domains`,
    aliasLine,
    ...plan.benefits,
  ];
}

export function isMailPlanId(value: string | null | undefined): value is MailPlanId {
  return Boolean(value && value in MAIL_PLANS);
}

export function toApiMailPlan(planId: MailPlanId): string {
  return toCatalogId(planId);
}

export function getMailPlan(planId: MailPlanId): MailPlanDefinition {
  return MAIL_PLANS[planId];
}

export function listMailPlans(): MailPlanDefinition[] {
  return MAIL_SELF_SERVE_PLAN_ORDER
    .filter((id) => id !== CatalogMailPlanId.CUSTOM)
    .map((id) => buildDefinition(id));
}

export type MailCustomPricingPlan = {
  name: string;
  bestFor: string;
  highlights: string[];
};

/** Enterprise / Custom tier — sourced from @rukny/mail-pricing catalog. */
export function getMailCustomPricingPlan(): MailCustomPricingPlan {
  const catalog = getCatalogPlan(CatalogMailPlanId.CUSTOM);
  const limits = catalog.limits;

  return {
    name: catalog.nameEn,
    bestFor: catalog.bestForEn,
    highlights: [
      "Everything in Professional, plus:",
      "Unlimited mailboxes & console members",
      "Unlimited domains",
      `${limits.storageGbPerMailbox} GB storage per mailbox`,
      "Unlimited aliases, forwarding & filter rules",
      "Custom outbound volume — no monthly cap",
      "Premium delivery, open & link tracking",
      "Dedicated support, onboarding & custom SLAs",
    ],
  };
}

export function mailPlanMonthlyTotal(planId: MailPlanId, mailboxCount: number): number {
  return mailMonthlyTotal(toCatalogId(planId), mailboxCount);
}

export function formatMailIqD(amount: number): string {
  return `${amount.toLocaleString("en-IQ")} ${MAIL_CURRENCY_LABEL}`;
}

export function mailYearlyPrice(monthly: number): number {
  if (monthly <= 0) return 0;
  return Math.round(monthly * 12 * (1 - MAIL_ANNUAL_DISCOUNT_PERCENT / 100));
}

export function mailMonthlyFromYearly(yearly: number): number {
  return Math.round(yearly / 12);
}

export function mailDisplayPrice(
  priceMonthly: number,
  period: MailBillingPeriod,
): number {
  if (priceMonthly <= 0) return 0;
  return period === "yearly"
    ? mailMonthlyFromYearly(mailYearlyPrice(priceMonthly))
    : priceMonthly;
}

export const MAIL_INCLUDED_OUTBOUND: Record<MailPlanId, number> = {
  free: mailIncludedOutbound(CatalogMailPlanId.FREE),
  starter: mailIncludedOutbound(CatalogMailPlanId.STARTER),
  professional: mailIncludedOutbound(CatalogMailPlanId.PROFESSIONAL),
};

export const MAIL_OUTBOUND_PACK_PRICE_IQD: Partial<Record<MailPlanId, number>> = {
  starter: mailOutboundPackPrice(CatalogMailPlanId.STARTER) ?? undefined,
  professional: mailOutboundPackPrice(CatalogMailPlanId.PROFESSIONAL) ?? undefined,
};

export function mailOutboundPackTotal(
  planId: MailPlanId,
  thousands: number,
): number | null {
  const unit = MAIL_OUTBOUND_PACK_PRICE_IQD[planId];
  if (unit == null) return null;
  return Math.max(1, Math.floor(thousands)) * unit;
}

export function formatMailStorage(bytes: number, quotaBytes: number): string {
  const used = formatMailStorageAmount(bytes);
  const quota = formatMailStorageAmount(quotaBytes);
  return `${used} / ${quota}`;
}

export function formatMailStorageAmount(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
