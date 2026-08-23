import { isMailUnlimited, type MailPlanLimits } from "@/lib/mail-plans";
import type { MailSubscriptionView } from "@/lib/mail-subscription-client";

export type EffectiveMailLimits = MailPlanLimits & {
  planId: string;
  mailboxCount: number;
  storageQuotaBytesPerMailbox: number;
};

export function limitsFromSubscription(
  subscription: MailSubscriptionView | null | undefined,
): EffectiveMailLimits | null {
  if (!subscription || subscription.status !== "ACTIVE") return null;
  return {
    ...subscription.limits,
    planId: subscription.planId,
    mailboxCount: subscription.mailboxCount,
    storageQuotaBytesPerMailbox: subscription.storageQuotaBytesPerMailbox,
  };
}

export function canAddMailbox(
  limits: EffectiveMailLimits | null,
  currentMailboxCount: number,
): boolean {
  if (!limits) return false;
  return currentMailboxCount < limits.mailboxCount;
}

export function canAddForwardingRule(
  limits: EffectiveMailLimits | null,
  currentRules: number,
): boolean {
  if (!limits) return false;
  return currentRules < limits.forwardingRules;
}

export function canAddAlias(
  limits: EffectiveMailLimits | null,
  currentAliases: number,
): boolean {
  if (!limits) return false;
  if (isMailUnlimited(limits.emailAliases)) return true;
  return currentAliases < limits.emailAliases;
}

export function hasMailFeature(
  limits: EffectiveMailLimits | null,
  feature: keyof Pick<
    MailPlanLimits,
    | "agenticMail"
    | "aiToolsUnlimited"
    | "openTracking"
    | "smartAiReplies"
    | "automaticReplies"
    | "linkAndFileTracking"
    | "premiumDelivery"
  >,
): boolean {
  return Boolean(limits?.[feature]);
}
