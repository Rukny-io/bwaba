import type { ReactNode } from 'react';
import {
  fetchAccessibleWorkspaces,
  getDashboardUser,
  requireAppForUser,
  resolveActiveWorkspace,
} from '@/lib/dal';
import { DevSidebar } from '@/components/layout/dev-sidebar';
import { DevShell } from '@/components/layout/dev-shell';
import { HeaderTopBar } from '@/components/layout/header-top-bar';
import { MobileDock } from '@/components/layout/mobile-dock';
import { ForeignWorkspaceBanner } from '@/components/workspace/foreign-workspace-banner';
import { WorkspaceRoleProvider } from '@/components/workspace/workspace-role-provider';
import { WorkspaceSwitchToast } from '@/components/workspace/workspace-switch-toast';
import { getDictionary, getCurrentLocale } from '@/lib/dictionary';
import { TranslationsProvider } from '@/components/providers/translations-provider';
import { AppProvider } from '@/components/providers/app-context';
import { SidebarProductsProvider } from '@/hooks/use-sidebar-products';

const ROLE_LABELS_AR: Record<string, string> = {
  OWNER: 'المالك',
  ADMIN: 'مشرف',
  MANAGER: 'مدير',
  DEVELOPER: 'مطوّر',
  SUPPORT: 'دعم',
  VIEWER: 'مشاهد',
};

export default async function AppScopedLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const [user, app, dictionary, locale, workspaces] = await Promise.all([
    getDashboardUser(),
    requireAppForUser(appId),
    getDictionary(),
    getCurrentLocale(),
    fetchAccessibleWorkspaces(),
  ]);
  const displayName = user.name ?? user.username ?? user.email;
  const activeForeign = await resolveActiveWorkspace(user.id, workspaces);
  const activeRole = activeForeign?.role ?? 'OWNER';
  const activeIsOwner = !activeForeign;
  const activeWorkspaceId = activeForeign?.id ?? user.id;
  const activeOwnerId = activeForeign?.ownerId ?? user.id;

  return (
    <TranslationsProvider dictionary={dictionary as any}>
      <WorkspaceRoleProvider
        role={activeRole}
        isOwner={activeIsOwner}
        workspaceId={activeWorkspaceId}
        ownerId={activeOwnerId}
      >
      <AppProvider app={app}>
        <SidebarProductsProvider appId={appId}>
        <div
          className={`flex h-dvh flex-col bg-[var(--background)] ${locale === 'en' ? 'dir-ltr' : 'dir-rtl'}`}
          dir={locale === 'en' ? 'ltr' : 'rtl'}
        >
          {activeForeign && (
            <ForeignWorkspaceBanner
              ownerName={
                activeForeign.owner.profile?.name ||
                activeForeign.owner.profile?.username ||
                activeForeign.owner.email
              }
              roleLabel={ROLE_LABELS_AR[activeForeign.role] ?? activeForeign.role}
            />
          )}
        <div className="flex min-h-0 flex-1">
          <DevSidebar
            appId={appId}
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
            <DevShell userName={displayName} appName={app.name}>
              {children}
            </DevShell>
            <MobileDock appId={appId} />
          </div>
        </div>
        </div>
        </SidebarProductsProvider>
      </AppProvider>
      <WorkspaceSwitchToast />
      </WorkspaceRoleProvider>
    </TranslationsProvider>
  );
}
