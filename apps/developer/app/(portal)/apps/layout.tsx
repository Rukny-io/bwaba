import type { ReactNode } from 'react';
import { getDashboardUser } from '@/lib/dal';
import { getDictionary, getCurrentLocale } from '@/lib/dictionary';
import { TranslationsProvider } from '@/components/providers/translations-provider';

export default async function AppsRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [, dictionary, locale] = await Promise.all([
    getDashboardUser(),
    getDictionary(),
    getCurrentLocale(),
  ]);

  return (
    <TranslationsProvider dictionary={dictionary as any}>
      <div
        className={`min-h-dvh bg-[var(--background)] text-[var(--foreground)] ${locale === 'en' ? 'dir-ltr' : 'dir-rtl'}`}
        dir={locale === 'en' ? 'ltr' : 'rtl'}
      >
        {children}
      </div>
    </TranslationsProvider>
  );
}
