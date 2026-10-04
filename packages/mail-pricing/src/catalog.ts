/**
 * Rukny Mail (hosted mailbox) pricing — standalone from Email API.
 */

import { mailPlanMarketingName, mailPlanSlug } from './plan-labels';

export const MAIL_CURRENCY = 'IQD';
export const MAIL_ANNUAL_DISCOUNT_PERCENT = 15;
export const MAIL_OUTBOUND_PACK_EMAILS = 1_000;
export const MAIL_UNLIMITED = Number.MAX_SAFE_INTEGER;

export enum MailPlanId {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  CUSTOM = 'CUSTOM',
}

export type MailPlanLimits = {
  mailboxesIncluded: number;
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
  id: MailPlanId;
  slug: string;
  nameEn: string;
  nameAr: string;
  bestForEn: string;
  bestForAr: string;
  priceMonthlyIqd: number;
  priceExtraMailboxIqd: number;
  domainsIncluded: number;
  monthlyOutbound: number;
  dailyOutboundLimit?: number;
  overagePackPriceIqd: number | null;
  selfServe: boolean;
  popular?: boolean;
  limits: MailPlanLimits;
};

const FREE_LIMITS: MailPlanLimits = {
  mailboxesIncluded: 1,
  consoleMembersIncluded: 0,
  storageGbPerMailbox: 3,
  forwardingRules: 3,
  filterRules: 5,
  emailAliases: 5,
  agenticMail: true,
  aiToolsUnlimited: true,
  openTracking: false,
  smartAiReplies: true,
  automaticReplies: true,
  linkAndFileTracking: false,
  premiumDelivery: false,
};

const STARTER_LIMITS: MailPlanLimits = {
  mailboxesIncluded: 3,
  consoleMembersIncluded: 2,
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
};

const PROFESSIONAL_LIMITS: MailPlanLimits = {
  mailboxesIncluded: 5,
  consoleMembersIncluded: 5,
  storageGbPerMailbox: 10,
  forwardingRules: 20,
  filterRules: 50,
  emailAliases: 50,
  agenticMail: true,
  aiToolsUnlimited: true,
  openTracking: true,
  smartAiReplies: true,
  automaticReplies: true,
  linkAndFileTracking: true,
  premiumDelivery: true,
};

const CUSTOM_LIMITS: MailPlanLimits = {
  mailboxesIncluded: MAIL_UNLIMITED,
  consoleMembersIncluded: MAIL_UNLIMITED,
  storageGbPerMailbox: 30,
  forwardingRules: MAIL_UNLIMITED,
  filterRules: MAIL_UNLIMITED,
  emailAliases: MAIL_UNLIMITED,
  agenticMail: true,
  aiToolsUnlimited: true,
  openTracking: true,
  smartAiReplies: true,
  automaticReplies: true,
  linkAndFileTracking: true,
  premiumDelivery: true,
};

function definePlan(
  core: Omit<
    MailPlanDefinition,
    'slug' | 'nameEn' | 'nameAr' | 'limits'
  > & { limits: MailPlanLimits },
): MailPlanDefinition {
  return {
    ...core,
    slug: mailPlanSlug(core.id),
    nameEn: mailPlanMarketingName(core.id, 'en'),
    nameAr: mailPlanMarketingName(core.id, 'ar'),
  };
}

export const MAIL_PLANS: Record<MailPlanId, MailPlanDefinition> = {
  [MailPlanId.FREE]: definePlan({
    id: MailPlanId.FREE,
    bestForEn: 'Try hosted mail on your domain',
    bestForAr: 'تجربة البريد على دومينك',
    priceMonthlyIqd: 0,
    priceExtraMailboxIqd: 0,
    domainsIncluded: 1,
    monthlyOutbound: 1_000,
    dailyOutboundLimit: 100,
    overagePackPriceIqd: null,
    selfServe: true,
    limits: FREE_LIMITS,
  }),
  [MailPlanId.STARTER]: definePlan({
    id: MailPlanId.STARTER,
    bestForEn: 'Small teams starting with business email',
    bestForAr: 'فرق صغيرة تبدأ ببريد احترافي',
    priceMonthlyIqd: 3_000,
    priceExtraMailboxIqd: 2_000,
    domainsIncluded: 3,
    monthlyOutbound: 4_000,
    overagePackPriceIqd: 800,
    selfServe: true,
    limits: STARTER_LIMITS,
  }),
  [MailPlanId.PROFESSIONAL]: definePlan({
    id: MailPlanId.PROFESSIONAL,
    bestForEn: 'Growing teams that need more seats and delivery',
    bestForAr: 'فرق متنامية تحتاج مقاعد وإرسال أعلى',
    priceMonthlyIqd: 8_000,
    priceExtraMailboxIqd: 3_000,
    domainsIncluded: 5,
    monthlyOutbound: 15_000,
    overagePackPriceIqd: 800,
    selfServe: true,
    popular: true,
    limits: PROFESSIONAL_LIMITS,
  }),
  [MailPlanId.CUSTOM]: definePlan({
    id: MailPlanId.CUSTOM,
    bestForEn: 'Enterprise needs with custom limits',
    bestForAr: 'احتياجات مؤسسية بحدود مخصصة',
    priceMonthlyIqd: 0,
    priceExtraMailboxIqd: 0,
    domainsIncluded: MAIL_UNLIMITED,
    monthlyOutbound: MAIL_UNLIMITED,
    overagePackPriceIqd: null,
    selfServe: false,
    limits: CUSTOM_LIMITS,
  }),
};

export const MAIL_SELF_SERVE_PLAN_ORDER: MailPlanId[] = [
  MailPlanId.FREE,
  MailPlanId.STARTER,
  MailPlanId.PROFESSIONAL,
];

export function getMailPlan(planId: MailPlanId | string | null | undefined): MailPlanDefinition {
  const id = String(planId || MailPlanId.FREE) as MailPlanId;
  return MAIL_PLANS[id] ?? MAIL_PLANS[MailPlanId.FREE];
}

export function mailMonthlyTotal(
  planId: MailPlanId | string,
  mailboxCount: number,
): number {
  const plan = getMailPlan(planId);
  if (plan.id === MailPlanId.FREE || plan.id === MailPlanId.CUSTOM) {
    return plan.priceMonthlyIqd;
  }
  const seats = Math.max(1, Math.floor(mailboxCount));
  const extra = Math.max(0, seats - plan.limits.mailboxesIncluded);
  return plan.priceMonthlyIqd + extra * plan.priceExtraMailboxIqd;
}

export function mailDomainsLimit(planId: MailPlanId | string): number {
  return getMailPlan(planId).domainsIncluded;
}

export function mailIncludedOutbound(planId: MailPlanId | string): number {
  const plan = getMailPlan(planId);
  if (plan.monthlyOutbound >= MAIL_UNLIMITED) return MAIL_UNLIMITED;
  return plan.monthlyOutbound;
}

export function mailOutboundPackPrice(planId: MailPlanId | string): number | null {
  return getMailPlan(planId).overagePackPriceIqd;
}

export function isMailUnlimited(value: number): boolean {
  return !Number.isFinite(value) || value < 0 || value >= MAIL_UNLIMITED;
}
