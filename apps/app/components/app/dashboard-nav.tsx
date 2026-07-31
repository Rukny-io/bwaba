'use client';

import { AppNavActions } from '@/components/app/app-nav-actions';
import { WorkspaceSwitcher } from '@/components/app/workspace-switcher';
import type { AccessibleWorkspace } from '@/lib/workspace';
import { appNavGlassClass } from '@/components/app/nav-glass';
import { cn } from '@/lib/utils';

interface DashboardNavProps {
  workspaces?: AccessibleWorkspace[];
  currentUserId?: string;
}

export function DashboardNav({
  workspaces = [],
  currentUserId = '',
}: DashboardNavProps) {
  const showSwitcher = workspaces.length > 1 && Boolean(currentUserId);
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20">
      <div className="pointer-events-auto flex items-center justify-between gap-2 px-3 pt-2.5 pb-1.5 sm:px-6 lg:pt-4">
        {showSwitcher ? (
          <div
            className={cn(
              'flex items-center gap-1 px-1.5 py-1 sm:gap-1.5 sm:px-2 sm:py-1.5',
              appNavGlassClass,
            )}
          >
            <WorkspaceSwitcher
              workspaces={workspaces}
              currentUserId={currentUserId}
            />
          </div>
        ) : (
          <div />
        )}
        <AppNavActions />
      </div>
    </header>
  );
}
