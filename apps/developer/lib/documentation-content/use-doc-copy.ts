'use client';

import { useTranslations } from '@/components/providers/translations-provider';
import type { Locale } from '@/lib/locale';
import { docCopy, type Localized } from '@/lib/documentation-content/types';

/** Locale from dictionary (`common.locale`). */
export function useDocsLocale(): Locale {
  const t = useTranslations();
  const locale = t.common.locale;
  return locale === 'ar' || locale === 'en' ? locale : 'en';
}

export function useDocCopy<T>(content: Localized<T>): T {
  return docCopy(useDocsLocale(), content);
}
