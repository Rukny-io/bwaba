import type { ReactNode } from 'react';
import { getDashboardUser, requireAppForUser } from '@/lib/dal';
import { DevSidebar } from '@/components/layout/dev-sidebar';
import { DevShell } from '@/components/layout/dev-shell';
import { HeaderTopBar } from '@/components/layout/header-top-bar';
import { MobileDock } from '@/components/layout/mobile-dock';
import { getDictionary, getCurrentLocale } from '@/lib/dictionary';
import { TranslationsProvider } from '@/components/providers/translations-provider';
import { AppProvider } from '@/components/providers/app-context';
import { SidebarProductsProvider } from '@/hooks/use-sidebar-products';

export default async function AppScopedLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const [user, app, dictionary, locale] = await Promise.all([
    getDashboardUser(),
    requireAppForUser(appId),
    getDictionary(),
    getCurrentLocale(),
  ]);
  const displayName = user.name ?? user.username ?? user.email;

  return (
    <TranslationsProvider dictionary={dictionary as any}>
      <AppProvider app={app}>
        <SidebarProductsProvider appId={appId}>
        <div
          className={`flex h-dvh bg-[var(--background)] ${locale === 'en' ? 'dir-ltr' : 'dir-rtl'}`}
          dir={locale === 'en' ? 'ltr' : 'rtl'}
        >
          <DevSidebar
            appId={appId}
            avatarUrl={user.avatar}
            userName={displayName}
          />

          <div
            className={`flex min-w-0 flex-1 flex-col gap-2 p-2 sm:m-2 sm:gap-2 ${locale === 'en' ? 'sm:ml-[82px]' : 'sm:mr-[82px]'}`}
          >
            <div className="hidden overflow-visible sm:block">
              <HeaderTopBar
                avatarUrl={user.avatar}
                userName={displayName}
              />
            </div>
            <DevShell userName={displayName} appName={app.name}>
              {children}
            </DevShell>
            <MobileDock appId={appId} />
          </div>
        </div>
        </SidebarProductsProvider>
      </AppProvider>
    </TranslationsProvider>
  );
}
