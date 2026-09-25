'use client';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { AppLocale } from '@/lib/i18n';

export function setLocaleCookie(locale: AppLocale) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function switchLocale(locale: AppLocale, router: AppRouterInstance) {
  setLocaleCookie(locale);
  router.refresh();
}
