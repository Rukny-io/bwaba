import { MailPlanId } from './catalog';

export function mailPlanMarketingName(
  planId: MailPlanId,
  locale: 'en' | 'ar' = 'en',
): string {
  const names: Record<MailPlanId, { en: string; ar: string }> = {
    FREE: { en: 'Free', ar: 'مجانية' },
    STARTER: { en: 'Starter', ar: 'الابتدائية' },
    PROFESSIONAL: { en: 'Professional', ar: 'الاحترافية' },
    CUSTOM: { en: 'Custom', ar: 'مخصص' },
  };
  return names[planId][locale];
}

export function mailPlanSlug(planId: MailPlanId): string {
  return planId.toLowerCase();
}
