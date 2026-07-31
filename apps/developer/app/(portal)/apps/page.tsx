import {
  fetchAccessibleWorkspaces,
  fetchUserApps,
  getDashboardUser,
  resolveActiveWorkspace,
} from '@/lib/dal';
import { AppsListPage } from '@/components/apps/apps-list-page';
import { AppsFlowShell } from '@/components/apps/apps-flow-shell';
import { AppsWorkspaceBar } from '@/components/apps/apps-workspace-bar';
import { ForeignWorkspaceBanner } from '@/components/workspace/foreign-workspace-banner';
import { WorkspaceSwitchToast } from '@/components/workspace/workspace-switch-toast';

const ROLE_LABELS_AR: Record<string, string> = {
  OWNER: 'المالك',
  ADMIN: 'مشرف',
  MANAGER: 'مدير',
  DEVELOPER: 'مطوّر',
  SUPPORT: 'دعم',
  VIEWER: 'مشاهد',
};

export default async function AppsPage() {
  const [apps, workspaces, user] = await Promise.all([
    fetchUserApps(),
    fetchAccessibleWorkspaces(),
    getDashboardUser(),
  ]);
  const activeForeign = await resolveActiveWorkspace(user.id, workspaces);

  return (
    <>
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
      <AppsFlowShell size="lg">
        {workspaces.length > 1 && (
          <AppsWorkspaceBar workspaces={workspaces} currentUserId={user.id} />
        )}
        <AppsListPage apps={apps} />
      </AppsFlowShell>
      <WorkspaceSwitchToast />
    </>
  );
}
