'use client';

import { usePathname } from 'next/navigation';
import { FormsNavActions } from '@/components/app/forms-nav-actions';
import { APP_BASE } from '@/components/app/nav-config';
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher';
import type { AccessibleWorkspace } from '@/lib/workspace';

interface DashboardNavProps {
  username?: string | null;
  workspaces?: AccessibleWorkspace[];
  currentUserId?: string;
}

export function DashboardNav({
  username: _username,
  workspaces,
  currentUserId,
}: DashboardNavProps) {
  const pathname = usePathname();

  if (pathname === `${APP_BASE}/notifications`) {
    return null;
  }

  const showSwitcher =
    !!workspaces && workspaces.length > 1 && !!currentUserId;

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20">
      <div className="pointer-events-auto flex items-center justify-end gap-2 px-3 pt-2.5 pb-1.5 sm:px-6 lg:pt-4">
        {showSwitcher ? (
          <WorkspaceSwitcher
            workspaces={workspaces!}
            currentUserId={currentUserId!}
          />
        ) : null}
        <FormsNavActions notificationsMode="dashboard" />
      </div>
    </header>
  );
}
