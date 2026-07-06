'use client';

import { I18nProvider } from 'react-aria-components';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';
import { AppToastProvider } from '@/components/ui/app-toast-provider';
import { SessionKeepAlive } from '@rukny/auth/client/session-keepalive';
import { refreshOnce } from '@/lib/api-client';
import { toAriaLocale, type Locale } from '@/lib/locale';

export function Providers({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  return (
    <I18nProvider locale={toAriaLocale(locale)}>
      <ThemeProvider>
        <QueryProvider>
          <AppToastProvider locale={locale}>
            <SessionKeepAlive pathPrefix="/apps" refresh={refreshOnce} />
            {children}
          </AppToastProvider>
        </QueryProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
