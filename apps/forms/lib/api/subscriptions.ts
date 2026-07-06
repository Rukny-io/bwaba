import { api } from '@/lib/api-client';

export type ConditionalLogicTier = false | 'basic' | 'advanced' | 'full';
export type AnalyticsTier = false | 'basic' | 'advanced' | 'full';

export interface PlanLimitsSnapshot {
  forms: number;
  fieldsPerForm: number;
  submissionsPerMonth: number;
  multiStepForms: boolean;
  conditionalLogic: ConditionalLogicTier;
  googleSheets: boolean;
  googleDrive: boolean;
  webhook: boolean;
  formAnalytics: AnalyticsTier;
  emailFieldVerification: boolean;
  phoneWhatsappVerification: boolean;
  formTeam: boolean;
  teamMembers: number;
  removeWatermark: boolean;
}

export interface SubscriptionDetails {
  plan: string;
  status: string;
  limits: PlanLimitsSnapshot;
}

export interface UsageMetric {
  used: number;
  limit: number;
}

export interface UsageSummary {
  plan: string;
  usage: {
    forms: UsageMetric;
    submissionsThisMonth: UsageMetric;
  };
}

export async function getMySubscription(): Promise<SubscriptionDetails> {
  const { data } = await api.get<SubscriptionDetails>('/subscriptions/me');
  return data;
}

export async function getMyUsage(): Promise<UsageSummary> {
  const { data } = await api.get<UsageSummary>('/subscriptions/me/usage');
  return data;
}

export function isPlanFeatureEnabled(
  limits: PlanLimitsSnapshot | null | undefined,
  feature:
    | 'multiStepForms'
    | 'googleSheets'
    | 'googleDrive'
    | 'webhook'
    | 'conditionalLogic'
    | 'formAnalytics'
    | 'emailFieldVerification'
    | 'phoneWhatsappVerification'
    | 'formTeam'
    | 'removeWatermark',
  plan?: string,
): boolean {
  if (limits && feature in limits) {
    const value = limits[feature];
    if (value === false) return false;
    if (value === true) return true;
    if (typeof value === 'string') return value.length > 0;
    if (value != null) return Boolean(value);
  }

  if (plan && isPlusBooleanFeature(feature)) {
    return isPlusPlanOrAbove(plan);
  }

  return false;
}

const PLUS_BOOLEAN_FEATURES = new Set([
  'multiStepForms',
  'googleSheets',
  'googleDrive',
  'webhook',
  'emailFieldVerification',
  'phoneWhatsappVerification',
  'formTeam',
  'removeWatermark',
]);

function isPlusBooleanFeature(feature: string): boolean {
  return PLUS_BOOLEAN_FEATURES.has(feature);
}

export function pickFormsPlanLimits(raw: unknown): PlanLimitsSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  return {
    forms: coerceNumericLimit(r.forms),
    fieldsPerForm: coerceNumericLimit(r.fieldsPerForm),
    submissionsPerMonth: coerceNumericLimit(r.submissionsPerMonth),
    multiStepForms: r.multiStepForms === true,
    conditionalLogic:
      r.conditionalLogic === false
        ? false
        : typeof r.conditionalLogic === 'string'
          ? (r.conditionalLogic as PlanLimitsSnapshot['conditionalLogic'])
          : false,
    googleSheets: r.googleSheets === true,
    googleDrive: r.googleDrive === true,
    webhook: r.webhook === true,
    formAnalytics:
      r.formAnalytics === false
        ? false
        : typeof r.formAnalytics === 'string'
          ? (r.formAnalytics as PlanLimitsSnapshot['formAnalytics'])
          : false,
    emailFieldVerification: r.emailFieldVerification === true,
    phoneWhatsappVerification: r.phoneWhatsappVerification === true,
    formTeam: r.formTeam === true,
    teamMembers:
      typeof r.teamMembers === 'number' && Number.isFinite(r.teamMembers)
        ? r.teamMembers
        : 0,
    removeWatermark: r.removeWatermark === true,
  };
}

function coerceNumericLimit(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return -1;
}

const ANALYTICS_TIER_RANK: Record<string, number> = {
  basic: 1,
  advanced: 2,
  full: 3,
};

export function analyticsTierRank(tier: AnalyticsTier): number {
  if (tier === false) return 0;
  return ANALYTICS_TIER_RANK[tier] ?? 0;
}

/** FREE includes basic analytics even if an older API still returns false. */
export function resolveFormAnalyticsTier(
  plan: string,
  limits: PlanLimitsSnapshot | null | undefined,
): AnalyticsTier {
  const tier = limits?.formAnalytics ?? false;
  if (tier === false && plan === 'FREE') return 'basic';
  return tier;
}

export function hasFormAnalyticsTier(
  limits: PlanLimitsSnapshot,
  minTier: Exclude<AnalyticsTier, false>,
  plan?: string,
): boolean {
  const tier = plan != null ? resolveFormAnalyticsTier(plan, limits) : limits.formAnalytics;
  return analyticsTierRank(tier) >= analyticsTierRank(minTier);
}

export function planFeatureLabel(feature: string): string {
  const labels: Record<string, string> = {
    multiStepForms: 'النماذج متعددة الخطوات',
    conditionalLogic: 'المنطق الشرطي',
    googleSheets: 'Google Sheets',
    googleDrive: 'Google Drive',
    webhook: 'Webhooks',
    formAnalytics: 'تحليلات النماذج',
    emailFieldVerification: 'التحقق من البريد (OTP)',
    phoneWhatsappVerification: 'التحقق من الهاتف (WhatsApp)',
    formTeam: 'فريق العمل',
    removeWatermark: 'إزالة العلامة المائية',
  };
  return labels[feature] ?? feature;
}

export function planDisplayName(plan: string): string {
  const names: Record<string, string> = {
    FREE: 'مجاني',
    PRO: 'Plus',
    WHALE: 'الحوت',
    BUSINESS: 'الأعمال',
    STARTER: 'Plus',
  };
  return names[plan] ?? plan;
}

const PLAN_ORDER: Record<string, number> = {
  FREE: 0,
  PRO: 1,
  WHALE: 2,
  BUSINESS: 3,
  STARTER: 1,
};

/** Plus (PRO) and all higher paid plans. */
export function isPlusPlanOrAbove(plan: string): boolean {
  return (PLAN_ORDER[plan] ?? 0) >= PLAN_ORDER.PRO;
}
