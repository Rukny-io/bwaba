import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { getDashboardUser } from '@/lib/dal';
import { getDictionary, getCurrentLocale } from '@/lib/dictionary';
import { TranslationsProvider } from '@/components/providers/translations-provider';
import { SettingsPageShell } from '@/components/settings/settings-page-shell';
import { SettingsChrome } from '@/components/settings/settings-chrome';
import { SidebarProductsProvider } from '@/hooks/use-sidebar-products';
import { LAST_APP_COOKIE } from '@/lib/app-routes';
import { isValidAppId } from '@/lib/api/types';

export default async function DeveloperSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [, dictionary, locale, cookieStore] = await Promise.all([
    getDashboardUser(),
    getDictionary(),
    getCurrentLocale(),
    cookies(),
  ]);

  const lastAppRaw = cookieStore.get(LAST_APP_COOKIE)?.value;
  const lastAppId =
    lastAppRaw && isValidAppId(lastAppRaw) ? lastAppRaw : null;

  const shell = (
    <div
      className={`min-h-dvh bg-[var(--background)] text-[var(--foreground)] ${locale === 'en' ? 'dir-ltr' : 'dir-rtl'}`}
      dir={locale === 'en' ? 'ltr' : 'rtl'}
    >
      <SettingsPageShell
        backLabel={dictionary.developerSettings.backToApps}
        isRtl={locale !== 'en'}
      >
        <SettingsChrome>{children}</SettingsChrome>
      </SettingsPageShell>
    </div>
  );

  return (
    <TranslationsProvider dictionary={dictionary as any}>
      {lastAppId ? (
        <SidebarProductsProvider appId={lastAppId}>{shell}</SidebarProductsProvider>
      ) : (
        shell
      )}
    </TranslationsProvider>
  );
}
