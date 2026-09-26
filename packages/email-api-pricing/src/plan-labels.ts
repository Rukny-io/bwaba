export type EmailApiPlanTier = 'starter' | 'growth' | 'business' | 'enterprise';

export const TIER_MARKETING_NAMES: Record<
  EmailApiPlanTier,
  { en: string; ar: string }
> = {
  starter: { en: 'Starter', ar: 'مبتدئ' },
  growth: { en: 'Growth', ar: 'نمو' },
  business: { en: 'Business', ar: 'أعمال' },
  enterprise: { en: 'Enterprise', ar: 'مؤسسات' },
};

export function emailApiTransactionalTierFromId(
  planId: string,
): EmailApiPlanTier {
  if (planId === 'FREE') return 'starter';
  if (planId === 'ENTERPRISE' || planId === 'PRO_100K') return 'enterprise';
  if (planId.startsWith('SCALE')) return 'business';
  return 'growth';
}

export function emailApiMarketingTierFromId(
  planId: string,
): EmailApiPlanTier {
  if (planId === 'FREE') return 'starter';
  if (planId === 'ENTERPRISE') return 'enterprise';
  return 'growth';
}

export function planIdToSlug(planId: string): string {
  return planId.toLowerCase().replace(/_/g, '-');
}

export function buildTransactionalInvoiceLabel(
  tier: EmailApiPlanTier,
  monthlyQuota: number,
  locale: 'en' | 'ar',
): string {
  const name = TIER_MARKETING_NAMES[tier][locale === 'ar' ? 'ar' : 'en'];
  if (tier === 'enterprise') {
    return locale === 'ar'
      ? 'Email API مؤسسات — حجم مخصص'
      : 'Email API Enterprise — custom volume';
  }
  const volume = monthlyQuota.toLocaleString('en-IQ');
  return locale === 'ar'
    ? `Email API ${name} — ${volume} رسالة/شهر`
    : `Email API ${name} — ${volume} emails/month`;
}

export function buildMarketingInvoiceLabel(
  tier: EmailApiPlanTier,
  contactsLimit: number,
  locale: 'en' | 'ar',
): string {
  const name = TIER_MARKETING_NAMES[tier][locale === 'ar' ? 'ar' : 'en'];
  if (tier === 'enterprise') {
    return locale === 'ar'
      ? 'Email API تسويق مؤسسات — جهات اتصال مخصصة'
      : 'Email API Marketing Enterprise — custom contacts';
  }
  const contacts = contactsLimit.toLocaleString('en-IQ');
  return locale === 'ar'
    ? `Email API تسويق ${name} — ${contacts} جهة اتصال`
    : `Email API Marketing ${name} — ${contacts} contacts`;
}

export function tierMarketingName(
  tier: EmailApiPlanTier,
  locale: 'en' | 'ar',
): string {
  return TIER_MARKETING_NAMES[tier][locale === 'ar' ? 'ar' : 'en'];
}
