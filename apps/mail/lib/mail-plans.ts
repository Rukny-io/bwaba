/**
 * Client catalog — mirrors apps/api mail-plan-limits.config (IQD).
 * Runtime source of truth is GET /api/v1/mail/plans.
 */

export const MAIL_CURRENCY = "IQD";
export const MAIL_CURRENCY_LABEL = "IQD";

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
};

export type MailPlanDefinition = {
  id: MailPlanId;
  name: string;
  bestFor: string;
  priceMonthly: number;
  limits: MailPlanLimits;
  benefits: string[];
  popular?: boolean;
};

export const MAIL_PLANS: Record<MailPlanId, MailPlanDefinition> = {
  starter: {
    id: "starter",
    name: "Starter",
    bestFor: "solo entrepreneurs",
    priceMonthly: 5_000,
    popular: false,
    limits: {
      mailboxesIncluded: 1,
      storageGbPerMailbox: 5,
      forwardingRules: 5,
      emailAliases: 5,
      agenticMail: true,
      aiToolsUnlimited: false,
      openTracking: false,
      smartAiReplies: false,
      automaticReplies: false,
      linkAndFileTracking: false,
    },
    benefits: ["Agentic Mail"],
  },
  standard: {
    id: "standard",
    name: "Standard",
    bestFor: "small businesses ready to scale",
    priceMonthly: 7_000,
    popular: true,
    limits: {
      mailboxesIncluded: 1,
      storageGbPerMailbox: 20,
      forwardingRules: 20,
      emailAliases: 10,
      agenticMail: true,
      aiToolsUnlimited: true,
      openTracking: true,
      smartAiReplies: true,
      automaticReplies: true,
      linkAndFileTracking: false,
    },
    benefits: [
      "Search, reply, summarize, and write — AI tools, unlimited",
      "See who opened your emails",
      "Smart AI-driven email replies",
      "Automatic replies",
      "Agentic Mail",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    bestFor: "teams that scale",
    priceMonthly: 10_000,
    popular: false,
    limits: {
      mailboxesIncluded: 1,
      storageGbPerMailbox: 50,
      forwardingRules: 50,
      emailAliases: 30,
      agenticMail: true,
      aiToolsUnlimited: true,
      openTracking: true,
      smartAiReplies: true,
      automaticReplies: true,
      linkAndFileTracking: true,
    },
    benefits: [
      "Track link clicks and file opens",
      "Search, reply, summarize, and write — AI tools, unlimited",
      "See who opened your emails",
      "Automatic replies",
      "Agentic Mail",
    ],
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
  return MAIL_PLANS[planId].priceMonthly * seats;
}

export function formatMailIqD(amount: number): string {
  return `${amount.toLocaleString("en-IQ")} ${MAIL_CURRENCY_LABEL}`;
}
