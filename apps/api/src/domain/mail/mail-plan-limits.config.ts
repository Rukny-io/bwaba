import { MailPlan } from '@prisma/client';

export const MAIL_UNLIMITED = Number.MAX_SAFE_INTEGER;

export type MailPlanLimits = {
  mailboxesIncluded: number;
  /** Invited console members (excludes workspace owner). Starter = 0. */
  consoleMembersIncluded: number;
  storageGbPerMailbox: number;
  forwardingRules: number;
  filterRules: number;
  emailAliases: number;
  agenticMail: boolean;
  aiToolsUnlimited: boolean;
  openTracking: boolean;
  smartAiReplies: boolean;
  automaticReplies: boolean;
  linkAndFileTracking: boolean;
  premiumDelivery: boolean;
};

export type MailPlanDefinition = {
  id: MailPlan;
  name: string;
  bestFor: string;
  /** Monthly price for the included mailboxes (IQD) */
  priceMonthly: number;
  /** Monthly price for each mailbox above the included amount (IQD) */
  priceExtraMailbox: number;
  popular: boolean;
  limits: MailPlanLimits;
  benefits: string[];
};

const SHARED_BENEFITS = [
  'AI email assistant',
  'Webmail & Calendar',
  'Anti-Spam protection',
  '2FA protection',
] as const;

export function isMailUnlimited(value: number): boolean {
  return !Number.isFinite(value) || value < 0 || value >= MAIL_UNLIMITED;
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
    aliasLine,
    ...plan.benefits,
  ];
}

export const MAIL_PLAN_LIMITS: Record<MailPlan, MailPlanLimits> = {
  STARTER: {
    mailboxesIncluded: 1,
    consoleMembersIncluded: 0,
    storageGbPerMailbox: 5,
    forwardingRules: 5,
    filterRules: 10,
    emailAliases: 10,
    agenticMail: true,
    aiToolsUnlimited: true,
    openTracking: false,
    smartAiReplies: true,
    automaticReplies: true,
    linkAndFileTracking: false,
    premiumDelivery: false,
  },
  STANDARD: {
    mailboxesIncluded: 3,
    consoleMembersIncluded: 4,
    storageGbPerMailbox: 20,
    forwardingRules: 20,
    filterRules: 50,
    emailAliases: 50,
    agenticMail: true,
    aiToolsUnlimited: true,
    openTracking: true,
    smartAiReplies: true,
    automaticReplies: true,
    linkAndFileTracking: false,
    premiumDelivery: false,
  },
  PREMIUM: {
    mailboxesIncluded: 5,
    consoleMembersIncluded: 10,
    storageGbPerMailbox: 30,
    forwardingRules: 50,
    filterRules: MAIL_UNLIMITED,
    emailAliases: MAIL_UNLIMITED,
    agenticMail: true,
    aiToolsUnlimited: true,
    openTracking: true,
    smartAiReplies: true,
    automaticReplies: true,
    linkAndFileTracking: true,
    premiumDelivery: true,
  },
};

export const MAIL_PLAN_DEFINITIONS: Record<MailPlan, MailPlanDefinition> = {
  STARTER: {
    id: MailPlan.STARTER,
    name: 'Starter',
    bestFor: 'one mailbox to get started',
    priceMonthly: 3_000,
    priceExtraMailbox: 2_000,
    popular: false,
    limits: MAIL_PLAN_LIMITS.STARTER,
    benefits: [...SHARED_BENEFITS],
  },
  STANDARD: {
    id: MailPlan.STANDARD,
    name: 'Standard',
    bestFor: 'small teams sharing one domain',
    priceMonthly: 6_000,
    priceExtraMailbox: 3_000,
    popular: true,
    limits: MAIL_PLAN_LIMITS.STANDARD,
    benefits: [...SHARED_BENEFITS],
  },
  PREMIUM: {
    id: MailPlan.PREMIUM,
    name: 'Premium',
    bestFor: 'teams that need more seats and delivery',
    priceMonthly: 10_000,
    priceExtraMailbox: 4_000,
    popular: false,
    limits: MAIL_PLAN_LIMITS.PREMIUM,
    benefits: [...SHARED_BENEFITS, 'Premium email delivery'],
  },
};

export const MAIL_PLAN_ORDER: MailPlan[] = [
  MailPlan.STARTER,
  MailPlan.STANDARD,
  MailPlan.PREMIUM,
];

export function mailMonthlyTotal(plan: MailPlan, mailboxCount: number): number {
  const seats = Math.max(1, Math.floor(mailboxCount));
  const def = MAIL_PLAN_DEFINITIONS[plan];
  const extra = Math.max(0, seats - def.limits.mailboxesIncluded);
  return def.priceMonthly + extra * def.priceExtraMailbox;
}

/** Included outbound emails / billing month by plan. */
export const MAIL_INCLUDED_OUTBOUND: Record<MailPlan, number> = {
  [MailPlan.STARTER]: 4_000,
  [MailPlan.STANDARD]: 10_000,
  [MailPlan.PREMIUM]: 30_000,
};

/** Prepaid pack unit (Starter packs billed this phase). */
export const MAIL_OUTBOUND_PACK_EMAILS = 1_000;

/** IQD per pack of MAIL_OUTBOUND_PACK_EMAILS — flat across all plans. */
export const MAIL_OUTBOUND_PACK_PRICE_IQD: Partial<Record<MailPlan, number>> = {
  [MailPlan.STARTER]: 800,
  [MailPlan.STANDARD]: 800,
  [MailPlan.PREMIUM]: 800,
};

export function mailOutboundPackPriceIqd(plan: MailPlan): number | null {
  const price = MAIL_OUTBOUND_PACK_PRICE_IQD[plan];
  return typeof price === 'number' && price > 0 ? price : null;
}

export function mailOutboundPackTotalIqd(
  plan: MailPlan,
  thousands: number,
): number {
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
