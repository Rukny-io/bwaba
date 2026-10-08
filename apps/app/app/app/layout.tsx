import type { ReactNode } from 'react';
import {
  fetchAccessibleWorkspaces,
  getDashboardUser,
  resolveActiveWorkspace,
} from '@/lib/dal';
import { AppDashboardShell } from '@/components/app/app-dashboard-shell';
import { DashboardChrome } from '@/components/app/dashboard-chrome';
import { DashboardSidebar } from '@/components/app/dashboard-sidebar';
import { AppSessionProvider } from '@/components/app/app-session-provider';
import { ForeignWorkspaceBanner } from '@/components/app/foreign-workspace-banner';
import { WorkspaceRoleProvider } from '@/components/app/workspace-role-provider';
import { WorkspaceSwitchToast } from '@/components/app/workspace-switch-toast';
import { ProfilePreviewProvider } from '@/components/app/links/profile-preview-provider';
import { getDictionary } from '@/lib/i18n/server';
import type { AccessibleWorkspace } from '@/lib/workspace';

export default async function AppDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [{ t }, user] = await Promise.all([getDictionary(), getDashboardUser()]);
  const workspaces = (await fetchAccessibleWorkspaces()) as AccessibleWorkspace[];
  const activeForeign = await resolveActiveWorkspace(user.id, workspaces);
  const activeRole = activeForeign?.role ?? 'OWNER';
  const activeIsOwner = !activeForeign;
  const activeWorkspaceId = activeForeign?.id ?? user.id;
  const activeOwnerId = activeForeign?.ownerId ?? user.id;
  const roleKey = `roles.${activeForeign?.role ?? 'OWNER'}` as const;

  return (
    <AppSessionProvider>
      <WorkspaceRoleProvider
        role={activeRole}
        isOwner={activeIsOwner}
        workspaceId={activeWorkspaceId}
        ownerId={activeOwnerId}
      >
        <ProfilePreviewProvider>
          <DashboardChrome
            banner={
              activeForeign ? (
                <ForeignWorkspaceBanner
                  ownerName={
                    activeForeign.owner.profile?.name ||
                    activeForeign.owner.profile?.username ||
                    activeForeign.owner.email
                  }
                  roleLabel={t(roleKey)}
                />
              ) : null
            }
            sidebar={
              <DashboardSidebar
                avatarUrl={user.avatar}
                userName={user.name ?? user.username ?? user.email}
              />
            }
          >
            <AppDashboardShell>{children}</AppDashboardShell>
          </DashboardChrome>
          <WorkspaceSwitchToast />
        </ProfilePreviewProvider>
      </WorkspaceRoleProvider>
    </AppSessionProvider>
  );
}
