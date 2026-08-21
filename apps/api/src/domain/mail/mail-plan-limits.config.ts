import { MailPlan } from '@prisma/client';

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
  id: MailPlan;
  name: string;
  bestFor: string;
  /** Monthly price per mailbox seat (IQD) */
  priceMonthly: number;
  popular: boolean;
  limits: MailPlanLimits;
  benefits: string[];
};

export const MAIL_PLAN_LIMITS: Record<MailPlan, MailPlanLimits> = {
  STARTER: {
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
  STANDARD: {
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
  PREMIUM: {
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
};

export const MAIL_PLAN_DEFINITIONS: Record<MailPlan, MailPlanDefinition> = {
  STARTER: {
    id: MailPlan.STARTER,
    name: 'Starter',
    bestFor: 'solo entrepreneurs',
    priceMonthly: 5_000,
    popular: false,
    limits: MAIL_PLAN_LIMITS.STARTER,
    benefits: ['Agentic Mail'],
  },
  STANDARD: {
    id: MailPlan.STANDARD,
    name: 'Standard',
    bestFor: 'small businesses ready to scale',
    priceMonthly: 7_000,
    popular: true,
    limits: MAIL_PLAN_LIMITS.STANDARD,
    benefits: [
      'Search, reply, summarize, and write — AI tools, unlimited',
      'See who opened your emails',
      'Smart AI-driven email replies',
      'Automatic replies',
      'Agentic Mail',
    ],
  },
  PREMIUM: {
    id: MailPlan.PREMIUM,
    name: 'Premium',
    bestFor: 'teams that scale',
    priceMonthly: 10_000,
    popular: false,
    limits: MAIL_PLAN_LIMITS.PREMIUM,
    benefits: [
      'Track link clicks and file opens',
      'Search, reply, summarize, and write — AI tools, unlimited',
      'See who opened your emails',
      'Automatic replies',
      'Agentic Mail',
    ],
  },
};

export const MAIL_PLAN_ORDER: MailPlan[] = [
  MailPlan.STARTER,
  MailPlan.STANDARD,
  MailPlan.PREMIUM,
];

export function mailMonthlyTotal(plan: MailPlan, mailboxCount: number): number {
  const seats = Math.max(1, Math.floor(mailboxCount));
  return MAIL_PLAN_DEFINITIONS[plan].priceMonthly * seats;
}

export function addOneMonth(from = new Date()): Date {
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1);
  return next;
}
