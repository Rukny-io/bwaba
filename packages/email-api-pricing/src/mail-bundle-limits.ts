import { DeveloperEmailPlanId } from './catalog';

export type UnifiedMailBundleLimits = {
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

const MAIL_UNLIMITED = Number.MAX_SAFE_INTEGER;

const FREE_MAIL_LIMITS: UnifiedMailBundleLimits = {
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
};

const GROWTH_MAIL_LIMITS: UnifiedMailBundleLimits = {
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
};

const ENTERPRISE_MAIL_LIMITS: UnifiedMailBundleLimits = {
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
};

/** Maps Email API transactional plan → hosted Mail workspace limits. */
export function getMailLimitsForEmailPlan(
  planId: DeveloperEmailPlanId | string | null | undefined,
): UnifiedMailBundleLimits {
  const id = String(planId || DeveloperEmailPlanId.FREE);
  if (id === DeveloperEmailPlanId.FREE || id === DeveloperEmailPlanId.PRO_10K) {
    return FREE_MAIL_LIMITS;
  }
  if (
    id === DeveloperEmailPlanId.PRO_50K ||
    id === DeveloperEmailPlanId.SCALE_100K ||
    id === DeveloperEmailPlanId.SCALE_200K
  ) {
    return GROWTH_MAIL_LIMITS;
  }
  return ENTERPRISE_MAIL_LIMITS;
}
