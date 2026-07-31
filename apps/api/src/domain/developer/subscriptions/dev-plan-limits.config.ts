/**
 * 📦 حدود خطط المطوّرين — Free + Pro فقط
 *
 * Free: سقوف للتجربة + الدفع حسب الاستخدام (المحفظة)
 * Pro: سقوف مفتوحة + نفس نموذج الاستخدام للرسائل
 */

export type DeveloperPlanTier = 'FREE' | 'PRO';

/** خطط المنصة (Forms/Links) التي تمنح Pro للمطوّر تلقائياً */
export const PLATFORM_PLANS_GRANTING_DEV_PRO = [
  'PRO',
  'WHALE',
  'BUSINESS',
] as const;

/** خطط قديمة — تُعامل كـ Pro عند القراءة */
const LEGACY_PRO_PLANS = new Set(['STARTER', 'GROWTH', 'ENTERPRISE', 'PRO']);

export interface DeveloperPlanLimits {
  maxApps: number;
  maxApiKeys: number;
  maxPhoneNumbers: number;
  maxWebhooks: number;
  maxContacts: number;
  /** -1 = لا حد شهري؛ الفوترة عبر المحفظة (usage) */
  maxMessagesPerMonth: number;
  rateLimitPerMinute: number;
  logRetentionDays: number;
  queuePriority: 'normal' | 'high';
  dedicatedSupport: boolean;
  templateSync: boolean;
  customBranding: boolean;
}

export const DEVELOPER_PLAN_LIMITS: Record<DeveloperPlanTier, DeveloperPlanLimits> =
  {
    FREE: {
      maxApps: 10,
      maxApiKeys: 5,
      maxPhoneNumbers: 1,
      maxWebhooks: 3,
      maxContacts: 1_000,
      maxMessagesPerMonth: -1,
      rateLimitPerMinute: 60,
      logRetentionDays: 14,
      queuePriority: 'normal',
      dedicatedSupport: false,
      templateSync: false,
      customBranding: false,
    },
    PRO: {
      maxApps: -1,
      maxApiKeys: -1,
      maxPhoneNumbers: -1,
      maxWebhooks: -1,
      maxContacts: -1,
      maxMessagesPerMonth: -1,
      rateLimitPerMinute: 300,
      logRetentionDays: 365,
      queuePriority: 'high',
      dedicatedSupport: true,
      templateSync: true,
      customBranding: true,
    },
  };

/** أسعار Pro بالدينار العراقي */
export const DEVELOPER_PRO_PRICING = {
  monthly: 43_500,
  yearly: 435_000,
} as const;

export function normalizeDeveloperPlan(plan: string | null | undefined): DeveloperPlanTier {
  if (!plan) return 'FREE';
  if (LEGACY_PRO_PLANS.has(plan)) return 'PRO';
  if (plan === 'FREE') return 'FREE';
  return 'FREE';
}

export function platformPlanGrantsDeveloperPro(
  platformPlan: string | null | undefined,
): boolean {
  if (!platformPlan || platformPlan === 'FREE') return false;
  return (PLATFORM_PLANS_GRANTING_DEV_PRO as readonly string[]).includes(
    platformPlan,
  );
}

export function getDeveloperPlanLimits(
  plan: string | null | undefined,
): DeveloperPlanLimits {
  return DEVELOPER_PLAN_LIMITS[normalizeDeveloperPlan(plan)];
}

/** يحوّل -1 إلى رقم عملي للمقارنة والعرض */
export function resolveLimitValue(limit: number): number {
  return limit === -1 ? Number.MAX_SAFE_INTEGER : limit;
}

export function isUnlimited(limit: number): boolean {
  return limit === -1;
}
