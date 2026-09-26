import type {
  EmailApiMarketingPlanDefinition,
  EmailApiPlanDefinition,
} from './catalog';
import { EMAIL_API_CURRENCY } from './catalog';

export type EmailApiPlanLocale = 'en' | 'ar';

export function formatEmailApiIqD(amount: number): string {
  if (amount === 0) return 'Free';
  return `${amount.toLocaleString('en-IQ')} ${EMAIL_API_CURRENCY}`;
}

export function formatEmailApiVolume(plan: EmailApiPlanDefinition): string {
  if (plan.dailyLimit) {
    return `${plan.monthlyQuota.toLocaleString('en-IQ')} / mo · ${plan.dailyLimit} / day`;
  }
  return `${plan.monthlyQuota.toLocaleString('en-IQ')} / mo`;
}

export function formatEmailApiPlanTitle(
  plan: EmailApiPlanDefinition | EmailApiMarketingPlanDefinition,
  locale: EmailApiPlanLocale = 'en',
): string {
  return locale === 'ar' ? plan.marketingNameAr : plan.marketingNameEn;
}

export function formatEmailApiInvoiceLine(
  plan: EmailApiPlanDefinition | EmailApiMarketingPlanDefinition,
  locale: EmailApiPlanLocale = 'en',
): string {
  return locale === 'ar' ? plan.invoiceLabelAr : plan.invoiceLabelEn;
}

export function formatEmailApiContacts(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toLocaleString('en-IQ')}M contacts`;
  }
  if (count >= 1_000) {
    const k = count / 1_000;
    return Number.isInteger(k) ? `${k}K contacts` : `${k.toFixed(1)}K contacts`;
  }
  return `${count.toLocaleString('en-IQ')} contacts`;
}
