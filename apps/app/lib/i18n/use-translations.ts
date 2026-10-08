'use client';

import { useCallback, useMemo } from 'react';
import { useDashboardLocale } from '@/components/app/locale-provider';
import { getMessage } from '@/lib/i18n/get-message';
import { getMessages } from '@/lib/i18n/messages';

export function useTranslations() {
  const { locale, direction } = useDashboardLocale();
  const messages = useMemo(() => getMessages(locale), [locale]);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) =>
      getMessage(messages, path, vars),
    [messages],
  );

  return { t, locale, direction, messages };
}
