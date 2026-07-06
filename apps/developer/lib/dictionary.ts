import 'server-only';
import { cookies } from 'next/headers';

import type { Locale } from '@/lib/locale';
import { defaultLocale } from '@/lib/locale';

export type { Locale } from '@/lib/locale';

const dictionaries = {
  ar: () => import('@/dictionaries/ar.json').then((module) => module.default),
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
};

export async function getDictionary(locale?: Locale) {
  if (locale) {
    return dictionaries[locale]?.() ?? dictionaries[defaultLocale]();
  }

  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('NEXT_LOCALE')?.value as Locale;
  const currentLocale = ['ar', 'en'].includes(savedLocale) ? savedLocale : defaultLocale;

  return dictionaries[currentLocale]();
}

export async function getCurrentLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('NEXT_LOCALE')?.value as Locale;
  return ['ar', 'en'].includes(savedLocale) ? savedLocale : defaultLocale;
}
