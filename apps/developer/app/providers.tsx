'use client';

import { useRouter } from 'next/navigation';
import { I18nProvider, RouterProvider } from 'react-aria-components';
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
  const router = useRouter();

  return (
    <I18nProvider locale={toAriaLocale(locale)}>
      <RouterProvider navigate={router.push}>
        <ThemeProvider>
          <QueryProvider>
            <AppToastProvider locale={locale}>
              <SessionKeepAlive pathPrefix="/apps" refresh={refreshOnce} />
              {children}
            </AppToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </RouterProvider>
    </I18nProvider>
  );
}
