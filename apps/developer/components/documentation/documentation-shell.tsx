import type { ReactNode } from 'react';
import { DocumentationShellClient } from '@/components/documentation/docs-shell';
import { TranslationsProvider } from '@/components/providers/translations-provider';
import { getCurrentLocale, getDictionary } from '@/lib/dictionary';

/** Server shell: dictionary + locale for docs/pricing chrome. */
export async function DocumentationShell({
  children,
}: {
  children: ReactNode;
}) {
  const [dictionary, locale] = await Promise.all([
    getDictionary(),
    getCurrentLocale(),
  ]);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <TranslationsProvider dictionary={dictionary as any}>
      <DocumentationShellClient dir={dir} lang={locale}>
        {children}
      </DocumentationShellClient>
    </TranslationsProvider>
  );
}
