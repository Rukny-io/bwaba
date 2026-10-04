import { MailPlan } from '@prisma/client';
import {
  getMailPlan,
  isMailUnlimited,
  MAIL_CURRENCY,
  MAIL_OUTBOUND_PACK_EMAILS,
  MAIL_PLANS,
  MailPlanId,
  mailDomainsLimit,
  mailIncludedOutbound,
  mailMonthlyTotal,
  mailOutboundPackPrice,
  type MailPlanLimits,
} from '@rukny/mail-pricing';

export {
  MAIL_CURRENCY,
  MAIL_OUTBOUND_PACK_EMAILS,
  isMailUnlimited,
  mailMonthlyTotal,
  type MailPlanLimits,
};

export const MAIL_UNLIMITED = Number.MAX_SAFE_INTEGER;

export type MailPlanDefinition = {
  id: MailPlan;
  name: string;
  bestFor: string;
  priceMonthly: number;
  priceExtraMailbox: number;
  popular: boolean;
  domainsIncluded: number;
  limits: MailPlanLimits;
  benefits: string[];
};

const SHARED_BENEFITS: string[] = [
  'AI email assistant',
  'Webmail & Calendar',
  'Anti-Spam protection',
  '2FA protection',
];

const PRISMA_TO_CATALOG: Record<MailPlan, MailPlanId> = {
  [MailPlan.FREE]: MailPlanId.FREE,
  [MailPlan.STARTER]: MailPlanId.STARTER,
  [MailPlan.PROFESSIONAL]: MailPlanId.PROFESSIONAL,
  [MailPlan.CUSTOM]: MailPlanId.CUSTOM,
};

function catalogId(plan: MailPlan): MailPlanId {
  return PRISMA_TO_CATALOG[plan];
}

export function formatMailAliasLimit(value: number, locale: 'en' | 'ar' = 'en'): string {
  if (isMailUnlimited(value)) {
    return locale === 'ar' ? 'غير محدود' : 'Unlimited';
  }
  return String(value);
}

export function mailPlanHighlights(plan: MailPlanDefinition): string[] {
  const included = plan.limits.mailboxesIncluded;
  const mailboxLine =
    included === 1 ? '1 mailbox included' : `${included} mailboxes included`;
  const consoleLine =
    plan.limits.consoleMembersIncluded === 0
      ? 'Owner-only console'
      : `${plan.limits.consoleMembersIncluded} console members included`;
  const aliasLine = isMailUnlimited(plan.limits.emailAliases)
    ? 'Unlimited aliases per mailbox'
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

function toDefinition(plan: MailPlan): MailPlanDefinition {
  const catalog = getMailPlan(catalogId(plan));
  const benefits = [...SHARED_BENEFITS];
  if (catalog.limits.premiumDelivery) {
    benefits.push('Premium email delivery');
  }
  return {
    id: plan,
    name: catalog.nameEn,
    bestFor: catalog.bestForEn,
    priceMonthly: catalog.priceMonthlyIqd,
    priceExtraMailbox: catalog.priceExtraMailboxIqd,
    popular: catalog.popular ?? false,
    domainsIncluded: catalog.domainsIncluded,
    limits: catalog.limits,
    benefits,
  };
}

export const MAIL_PLAN_LIMITS: Record<MailPlan, MailPlanLimits> = {
  [MailPlan.FREE]: getMailPlan(MailPlanId.FREE).limits,
  [MailPlan.STARTER]: getMailPlan(MailPlanId.STARTER).limits,
  [MailPlan.PROFESSIONAL]: getMailPlan(MailPlanId.PROFESSIONAL).limits,
  [MailPlan.CUSTOM]: getMailPlan(MailPlanId.CUSTOM).limits,
};

export const MAIL_PLAN_DEFINITIONS: Record<MailPlan, MailPlanDefinition> = {
  [MailPlan.FREE]: toDefinition(MailPlan.FREE),
  [MailPlan.STARTER]: toDefinition(MailPlan.STARTER),
  [MailPlan.PROFESSIONAL]: toDefinition(MailPlan.PROFESSIONAL),
  [MailPlan.CUSTOM]: toDefinition(MailPlan.CUSTOM),
};

export const MAIL_PLAN_ORDER: MailPlan[] = [
  MailPlan.FREE,
  MailPlan.STARTER,
  MailPlan.PROFESSIONAL,
];

export const MAIL_INCLUDED_OUTBOUND: Record<MailPlan, number> = {
  [MailPlan.FREE]: mailIncludedOutbound(MailPlanId.FREE),
  [MailPlan.STARTER]: mailIncludedOutbound(MailPlanId.STARTER),
  [MailPlan.PROFESSIONAL]: mailIncludedOutbound(MailPlanId.PROFESSIONAL),
  [MailPlan.CUSTOM]: mailIncludedOutbound(MailPlanId.CUSTOM),
};

export const MAIL_DOMAINS_INCLUDED: Record<MailPlan, number> = {
  [MailPlan.FREE]: mailDomainsLimit(MailPlanId.FREE),
  [MailPlan.STARTER]: mailDomainsLimit(MailPlanId.STARTER),
  [MailPlan.PROFESSIONAL]: mailDomainsLimit(MailPlanId.PROFESSIONAL),
  [MailPlan.CUSTOM]: mailDomainsLimit(MailPlanId.CUSTOM),
};

export const MAIL_INVOICE_TAX_IQD = 400;

export const MAIL_OUTBOUND_PACK_PRICE_IQD: Partial<Record<MailPlan, number>> = {
  [MailPlan.STARTER]: mailOutboundPackPrice(MailPlanId.STARTER) ?? undefined,
  [MailPlan.PROFESSIONAL]:
    mailOutboundPackPrice(MailPlanId.PROFESSIONAL) ?? undefined,
};

export function mailOutboundPackPriceIqd(plan: MailPlan): number | null {
  const price = mailOutboundPackPrice(catalogId(plan));
  return typeof price === 'number' && price > 0 ? price : null;
}

export function mailOutboundPackTotalIqd(plan: MailPlan, thousands: number): number {
  const unit = mailOutboundPackPriceIqd(plan);
  if (unit == null) {
    throw new Error(`Outbound packs are not available for plan ${plan}`);
  }
  const n = Math.max(1, Math.floor(thousands));
  return n * unit;
}

export function addOneMonth(from = new Date()): Date {
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export function mailPlanFromCatalogId(id: string): MailPlan | null {
  const normalized = id.trim().toUpperCase();
  if (normalized in PRISMA_TO_CATALOG) {
    return normalized as MailPlan;
  }
  return null;
}
