'use client';

import { AppLocaleProvider } from '@/components/app/locale-provider';
import type { DashboardLocale } from '@/lib/settings/dashboard-locale';

/**
 * React Aria overlays (Dropdown, Select, Modal…) set `dir` from useLocale().
 * Without this provider they default to the browser locale (often LTR) even when
 * the page is Arabic RTL, which reverses menu text.
 */
export function AppProviders({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: DashboardLocale;
}) {
  return (
    <AppLocaleProvider initialLocale={initialLocale}>{children}</AppLocaleProvider>
  );
}
