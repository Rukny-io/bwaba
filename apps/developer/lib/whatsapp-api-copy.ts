import en from '@/dictionaries/en.json';
import ar from '@/dictionaries/ar.json';
import type { Locale } from '@/lib/locale';

/** @deprecated Prefer getWhatsappApiCopy(locale) or useTranslations().whatsappApi */
export const WHATSAPP_API_COPY = en.whatsappApi;

export function getWhatsappApiCopy(locale: Locale) {
  return locale === 'ar' ? ar.whatsappApi : en.whatsappApi;
}
