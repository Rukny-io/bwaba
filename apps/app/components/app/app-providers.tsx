'use client';

import { I18nProvider } from '@heroui/react';

/**
 * React Aria overlays (Dropdown, Select, Modal…) set `dir` from useLocale().
 * Without this provider they default to the browser locale (often LTR) even when
 * the page is Arabic RTL, which reverses menu text.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <I18nProvider locale="ar">{children}</I18nProvider>;
}
