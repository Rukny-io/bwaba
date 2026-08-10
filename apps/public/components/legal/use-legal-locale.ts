'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAlternateLocale, setLocaleCookie } from '@/lib/switch-locale';

export function useLegalLocale() {
  const [locale, setLocale] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=(ar|en)(?:;|$)/);
    if (match?.[1] === 'ar' || match?.[1] === 'en') {
      setLocale(match[1]);
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale((current) => {
      const next = getAlternateLocale(current);
      setLocaleCookie(next);
      return next;
    });
  }, []);

  return {
    locale,
    isEn: locale === 'en',
    toggleLocale,
  };
}
