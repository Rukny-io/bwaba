/**
 * Client catalog — mirrors apps/api mail-plan-limits.config (IQD).
 * Runtime source of truth is GET /api/v1/mail/plans.
 */

export const MAIL_CURRENCY = "IQD";
export const MAIL_CURRENCY_LABEL = "IQD";
export const MAIL_UNLIMITED = Number.MAX_SAFE_INTEGER;

export type MailPlanId = "starter" | "standard" | "premium";

export type MailPlanLimits = {
  mailboxesIncluded: number;
  storageGbPerMailbox: number;
  forwardingRules: number;
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
  name: string;
  bestFor: string;
  priceMonthly: number;
  priceExtraMailbox: number;
  limits: MailPlanLimits;
  benefits: string[];
  popular?: boolean;
};

const SHARED_BENEFITS = [
  "AI email assistant",
  "Webmail & Calendar",
  "Anti-Spam protection",
  "2FA protection",
] as const;

export function isMailUnlimited(value: number): boolean {
  return !Number.isFinite(value) || value < 0 || value >= MAIL_UNLIMITED;
}

export function formatMailAliasLimit(value: number): string {
  return isMailUnlimited(value) ? "Unlimited" : String(value);
}

export function mailPlanHighlights(plan: MailPlanDefinition): string[] {
  const included = plan.limits.mailboxesIncluded;
  const mailboxLine =
    included === 1 ? "1 mailbox included" : `${included} mailboxes included`;
  const aliasLine = isMailUnlimited(plan.limits.emailAliases)
    ? "Unlimited aliases per mailbox"
    : `${plan.limits.emailAliases} aliases per mailbox`;
  return [
    mailboxLine,
    `${plan.limits.storageGbPerMailbox} GB for emails`,
    aliasLine,
    ...plan.benefits,
  ];
}

export const MAIL_PLANS: Record<MailPlanId, MailPlanDefinition> = {
  starter: {
    id: "starter",
    name: "Starter",
    bestFor: "one mailbox to get started",
    priceMonthly: 3_000,
    priceExtraMailbox: 3_000,
    popular: false,
    limits: {
      mailboxesIncluded: 1,
      storageGbPerMailbox: 5,
      forwardingRules: 5,
      emailAliases: 10,
      agenticMail: true,
      aiToolsUnlimited: true,
      openTracking: false,
      smartAiReplies: true,
      automaticReplies: true,
      linkAndFileTracking: false,
      premiumDelivery: false,
    },
    benefits: [...SHARED_BENEFITS],
  },
  standard: {
    id: "standard",
    name: "Standard",
    bestFor: "small teams sharing one domain",
    priceMonthly: 6_000,
    priceExtraMailbox: 2_000,
    popular: true,
    limits: {
      mailboxesIncluded: 3,
      storageGbPerMailbox: 20,
      forwardingRules: 20,
      emailAliases: 50,
      agenticMail: true,
      aiToolsUnlimited: true,
      openTracking: true,
      smartAiReplies: true,
      automaticReplies: true,
      linkAndFileTracking: false,
      premiumDelivery: false,
    },
    benefits: [...SHARED_BENEFITS],
  },
  premium: {
    id: "premium",
    name: "Premium",
    bestFor: "teams that need more seats and delivery",
    priceMonthly: 10_000,
    priceExtraMailbox: 2_000,
    popular: false,
    limits: {
      mailboxesIncluded: 5,
      storageGbPerMailbox: 30,
      forwardingRules: 50,
      emailAliases: MAIL_UNLIMITED,
      agenticMail: true,
      aiToolsUnlimited: true,
      openTracking: true,
      smartAiReplies: true,
      automaticReplies: true,
      linkAndFileTracking: true,
      premiumDelivery: true,
    },
    benefits: [...SHARED_BENEFITS, "Premium email delivery"],
  },
};

export const MAIL_PLAN_IDS = Object.keys(MAIL_PLANS) as MailPlanId[];

export function isMailPlanId(value: string | null | undefined): value is MailPlanId {
  return Boolean(value && value in MAIL_PLANS);
}

export function toApiMailPlan(planId: MailPlanId): "STARTER" | "STANDARD" | "PREMIUM" {
  return planId.toUpperCase() as "STARTER" | "STANDARD" | "PREMIUM";
}

export function getMailPlan(planId: MailPlanId): MailPlanDefinition {
  return MAIL_PLANS[planId];
}

export function listMailPlans(): MailPlanDefinition[] {
  return MAIL_PLAN_IDS.map((id) => MAIL_PLANS[id]);
}

export function mailPlanMonthlyTotal(planId: MailPlanId, mailboxCount: number): number {
  const seats = Math.max(1, Math.floor(mailboxCount));
  const plan = MAIL_PLANS[planId];
  const extra = Math.max(0, seats - plan.limits.mailboxesIncluded);
  return plan.priceMonthly + extra * plan.priceExtraMailbox;
}

export function formatMailIqD(amount: number): string {
  return `${amount.toLocaleString("en-IQ")} ${MAIL_CURRENCY_LABEL}`;
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
