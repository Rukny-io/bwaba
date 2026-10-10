import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import {
  fetchAccessibleWorkspaces,
  fetchUserApps,
  getDashboardUser,
  resolveActiveWorkspace,
} from '@/lib/dal';
import { getDictionary, getCurrentLocale } from '@/lib/dictionary';
import { TranslationsProvider } from '@/components/providers/translations-provider';
import { AppProvider } from '@/components/providers/app-context';
import { SettingsChrome } from '@/components/settings/settings-chrome';
import { SidebarProductsProvider } from '@/hooks/use-sidebar-products';
import { DevSidebar } from '@/components/layout/dev-sidebar';
import { DevShell } from '@/components/layout/dev-shell';
import { HeaderTopBar } from '@/components/layout/header-top-bar';
import { MobileDock } from '@/components/layout/mobile-dock';
import { ForeignWorkspaceBanner } from '@/components/workspace/foreign-workspace-banner';
import { WorkspaceRoleProvider } from '@/components/workspace/workspace-role-provider';
import { WorkspaceSwitchToast } from '@/components/workspace/workspace-switch-toast';
import { LAST_APP_COOKIE } from '@/lib/app-routes';
import { isValidAppId } from '@/lib/api/types';

const ROLE_LABELS_AR: Record<string, string> = {
  OWNER: 'المالك',
  ADMIN: 'مشرف',
  MANAGER: 'مدير',
  DEVELOPER: 'مطوّر',
  SUPPORT: 'دعم',
  VIEWER: 'مشاهد',
};

export default async function DeveloperSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [user, dictionary, locale, cookieStore, workspaces, apps] =
    await Promise.all([
      getDashboardUser(),
      getDictionary(),
      getCurrentLocale(),
      cookies(),
      fetchAccessibleWorkspaces(),
      fetchUserApps(),
    ]);

  const lastAppRaw = cookieStore.get(LAST_APP_COOKIE)?.value;
  const lastAppId =
    lastAppRaw && isValidAppId(lastAppRaw) ? lastAppRaw : null;
  const resolvedAppId =
    (lastAppId && apps.some((app) => app.appId === lastAppId)
      ? lastAppId
      : null) ??
    apps[0]?.appId ??
    null;
  const activeApp = resolvedAppId
    ? apps.find((app) => app.appId === resolvedAppId) ?? null
    : null;

  const displayName = user.name ?? user.username ?? user.email;
  const activeForeign = await resolveActiveWorkspace(user.id, workspaces);
  const activeRole = activeForeign?.role ?? 'OWNER';
  const activeIsOwner = !activeForeign;
  const activeWorkspaceId = activeForeign?.id ?? user.id;
  const activeOwnerId = activeForeign?.ownerId ?? user.id;

  const content = (
    <div
      className={`flex h-dvh flex-col overflow-clip bg-[var(--background)] ${locale === 'en' ? 'dir-ltr' : 'dir-rtl'}`}
      dir={locale === 'en' ? 'ltr' : 'rtl'}
    >
      {activeForeign ? (
        <ForeignWorkspaceBanner
          ownerName={
            activeForeign.owner.profile?.name ||
            activeForeign.owner.profile?.username ||
            activeForeign.owner.email
          }
          roleLabel={ROLE_LABELS_AR[activeForeign.role] ?? activeForeign.role}
        />
      ) : null}
      <div className="flex min-h-0 flex-1">
        <DevSidebar
          appId={resolvedAppId ?? undefined}
          avatarUrl={user.avatar}
          userName={displayName}
        />

        <div
          className={`relative flex min-w-0 flex-1 flex-col gap-0 p-0 ${locale === 'en' ? 'sm:ml-[82px]' : 'sm:mr-[82px]'}`}
        >
          <HeaderTopBar
            avatarUrl={user.avatar}
            userName={displayName}
            workspaces={workspaces}
            currentUserId={user.id}
          />
          <DevShell userName={displayName} appName={activeApp?.name ?? null}>
            <SettingsChrome>{children}</SettingsChrome>
          </DevShell>
          {resolvedAppId ? <MobileDock appId={resolvedAppId} /> : null}
        </div>
      </div>
    </div>
  );

  const withApp = activeApp ? (
    <AppProvider app={activeApp}>
      <SidebarProductsProvider appId={activeApp.appId}>
        {content}
      </SidebarProductsProvider>
    </AppProvider>
  ) : (
    content
  );

  return (
    <TranslationsProvider dictionary={dictionary as any}>
      <WorkspaceRoleProvider
        role={activeRole}
        isOwner={activeIsOwner}
        workspaceId={activeWorkspaceId}
        ownerId={activeOwnerId}
      >
        {withApp}
        <WorkspaceSwitchToast />
      </WorkspaceRoleProvider>
    </TranslationsProvider>
  );
}
