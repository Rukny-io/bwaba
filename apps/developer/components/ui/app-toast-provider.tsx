'use client';

import { Toast } from '@heroui/react';
import { isRtlLocale, type Locale } from '@/lib/locale';

export function AppToastProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  const isRtl = isRtlLocale(locale);
  const dir = isRtl ? 'rtl' : 'ltr';

  return (
    <>
      {children}
      <Toast.Provider
        placement="top end"
        maxVisibleToasts={4}
        dir={dir}
        className={`app-toast-region app-toast-region--${dir} mt-6`}
      />
    </>
  );
}
