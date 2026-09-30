import type { ReactNode } from 'react';
import {
  fetchAccessibleWorkspaces,
  getDashboardUser,
  resolveActiveWorkspace,
} from '@/lib/dal';
import { AppDashboardShell } from '@/components/app/app-dashboard-shell';
import { DashboardSidebar } from '@/components/app/dashboard-sidebar';
import { AppSessionProvider } from '@/components/app/app-session-provider';
import { ForeignWorkspaceBanner } from '@/components/app/foreign-workspace-banner';
import { WorkspaceRoleProvider } from '@/components/app/workspace-role-provider';
import { WorkspaceSwitchToast } from '@/components/app/workspace-switch-toast';
import {
  ProfilePreviewProvider,
  ProfilePreviewAside,
  PREVIEW_COLUMN_MIN_WIDTH_PX,
} from '@/components/app/links/profile-preview-provider';
import type { AccessibleWorkspace } from '@/lib/workspace';

const ROLE_LABELS_AR: Record<string, string> = {
  OWNER: 'المالك',
  ADMIN: 'مشرف',
  MANAGER: 'مدير',
  DEVELOPER: 'مطوّر',
  SUPPORT: 'دعم',
  VIEWER: 'مشاهد',
};

export default async function AppDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getDashboardUser();
  const workspaces = (await fetchAccessibleWorkspaces()) as AccessibleWorkspace[];
  const activeForeign = await resolveActiveWorkspace(user.id, workspaces);
  const activeRole = activeForeign?.role ?? 'OWNER';
  const activeIsOwner = !activeForeign;
  const activeWorkspaceId = activeForeign?.id ?? user.id;
  const activeOwnerId = activeForeign?.ownerId ?? user.id;

  return (
    <AppSessionProvider>
      <WorkspaceRoleProvider
        role={activeRole}
        isOwner={activeIsOwner}
        workspaceId={activeWorkspaceId}
        ownerId={activeOwnerId}
      >
        <ProfilePreviewProvider>
          <div dir="rtl" className="dashboard-chrome flex h-dvh flex-col bg-[var(--background)]">
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
            <DashboardSidebar
              avatarUrl={user.avatar}
              userName={user.name ?? user.username ?? user.email}
            />
            <div className="flex min-h-0 min-w-0 flex-1 gap-4 pt-4 pl-5 sm:mr-[82px]">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <AppDashboardShell>
                  {children}
                </AppDashboardShell>
              </div>
              <div
                className="hidden h-full min-h-0 shrink-0 overflow-hidden xl:flex"
                style={{ width: PREVIEW_COLUMN_MIN_WIDTH_PX }}
              >
                <ProfilePreviewAside />
              </div>
            </div>
          </div>
          <WorkspaceSwitchToast />
        </ProfilePreviewProvider>
      </WorkspaceRoleProvider>
    </AppSessionProvider>
  );
}
