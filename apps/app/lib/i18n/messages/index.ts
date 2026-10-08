import type { AppLocale } from '@/lib/i18n/config';
import ar, { type AppMessages } from '@/lib/i18n/messages/ar';
import en from '@/lib/i18n/messages/en';

export type { AppMessages };

const catalogs: Record<AppLocale, AppMessages> = { ar, en };

export function getMessages(locale: AppLocale): AppMessages {
  return catalogs[locale] ?? catalogs.ar;
}
