import 'server-only';
import { cookies } from 'next/headers';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  localeDirection,
  parseAppLocale,
  type AppLocale,
} from '@/lib/i18n/config';
import { getMessages, type AppMessages } from '@/lib/i18n/messages';
import { getMessage } from '@/lib/i18n/get-message';

export async function getCurrentLocale(): Promise<AppLocale> {
  const store = await cookies();
  return parseAppLocale(store.get(LOCALE_COOKIE_KEY)?.value);
}

export async function getDictionary(): Promise<{
  locale: AppLocale;
  direction: 'rtl' | 'ltr';
  messages: AppMessages;
  t: (path: string, vars?: Record<string, string | number>) => string;
}> {
  const locale = await getCurrentLocale();
  const messages = getMessages(locale);
  return {
    locale,
    direction: localeDirection(locale),
    messages,
    t: (path, vars) => getMessage(messages, path, vars),
  };
}

export { DEFAULT_LOCALE };
