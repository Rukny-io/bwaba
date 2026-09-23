'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { LocaleProvider } from '@/lib/i18n/locale';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </ThemeProvider>
  );
}
