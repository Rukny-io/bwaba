'use client';

import { usePathname } from 'next/navigation';
import { LayoutGrid } from 'lucide-react';
import { APP_BASE } from '@/components/app/nav-config';
import {
  MobileDockShell,
  MobileDockPill,
  MobileDockItem,
} from '@/components/app/mobile-dock-primitives';
import {
  canAccessFormWorkspaceTab,
  type FormAccessRole,
} from '@/lib/form-team-permissions';
import type { FormTeamRole } from '@/lib/form-team-api';
import {
  FORM_WORKSPACE_TABS,
  isFormWorkspacePathTabActive,
} from '@/lib/form-workspace-tabs';

function resolveNavAccessRole(
  isShared: boolean,
  sharedRole?: string | null,
): FormAccessRole {
  if (!isShared) return 'OWNER';
  if (
    sharedRole === 'ADMIN' ||
    sharedRole === 'EDITOR' ||
    sharedRole === 'ANALYST' ||
    sharedRole === 'VIEWER'
  ) {
    return sharedRole;
  }
  return 'VIEWER';
}

export function FormWorkspaceMobileDock({
  formId,
  isShared = false,
  sharedRole,
}: {
  formId: string;
  isShared?: boolean;
  sharedRole?: FormTeamRole | string | null;
}) {
  const pathname = usePathname();
  const base = `${APP_BASE}/forms/${formId}`;
  const accessRole = resolveNavAccessRole(isShared, sharedRole);
  const visibleTabs = FORM_WORKSPACE_TABS.filter((tab) =>
    canAccessFormWorkspaceTab(accessRole, tab.suffix),
  );

  return (
    <MobileDockShell>
      <MobileDockPill aria-label="أقسام النموذج">
        {visibleTabs.map(({ suffix, label, icon }) => (
          <MobileDockItem
            key={suffix || 'settings'}
            href={`${base}${suffix}`}
            icon={icon}
            label={label}
            isActive={isFormWorkspacePathTabActive(pathname, formId, suffix)}
          />
        ))}
        <MobileDockItem
          href={`${APP_BASE}/forms`}
          icon={LayoutGrid}
          label="نماذجي"
          isActive={false}
        />
      </MobileDockPill>
    </MobileDockShell>
  );
}
