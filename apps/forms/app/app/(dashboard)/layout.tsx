import type { ReactNode } from 'react';
import {
  fetchAccessibleWorkspaces,
  getDashboardUser,
  resolveActiveWorkspace,
} from '@/lib/dal';
import { Sidebar } from '@/components/app/sidebar';
import { FormsDashboardShell } from '@/components/app/forms-dashboard-shell';
import { ForeignWorkspaceBanner } from '@/components/workspace/foreign-workspace-banner';
import { WorkspaceRoleProvider } from '@/components/workspace/workspace-role-provider';
import { WorkspaceSwitchToast } from '@/components/workspace/workspace-switch-toast';

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
  const workspaces = await fetchAccessibleWorkspaces();
  const activeForeign = await resolveActiveWorkspace(user.id, workspaces);

  const activeRole = (activeForeign?.role ?? 'OWNER') as
    | 'OWNER'
    | 'ADMIN'
    | 'MANAGER'
    | 'DEVELOPER'
    | 'SUPPORT'
    | 'VIEWER';
  const activeIsOwner = !activeForeign;
  const activeWorkspaceId = activeForeign?.id ?? user.id;
  const activeOwnerId = activeForeign?.ownerId ?? user.id;

  return (
    <div dir="rtl" className="flex h-dvh bg-[var(--background)]">
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

      <Sidebar
        avatarUrl={user.avatar}
        userName={user.name ?? user.username ?? user.email}
      />

      <div className="flex min-w-0 flex-1 sm:m-2 sm:ms-[var(--dashboard-sidebar-gutter)] sm:gap-2">
        <WorkspaceRoleProvider
          role={activeRole}
          isOwner={activeIsOwner}
          workspaceId={activeWorkspaceId}
          ownerId={activeOwnerId}
        >
          <FormsDashboardShell
            username={user.username}
            workspaces={workspaces}
            currentUserId={user.id}
          >
            {children}
          </FormsDashboardShell>
        </WorkspaceRoleProvider>
      </div>

      <WorkspaceSwitchToast />
    </div>
  );
}
