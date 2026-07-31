'use client';

import type { ReactNode } from 'react';
import { DashboardNav } from '@/components/app/dashboard-nav';
import { DashboardMobileDock } from '@/components/app/dashboard-mobile-dock';
import type { AccessibleWorkspace } from '@/lib/workspace';

interface AppDashboardShellProps {
  children: ReactNode;
  workspaces?: AccessibleWorkspace[];
  currentUserId?: string;
}

function AppDashboardShellInner({
  children,
  workspaces,
  currentUserId,
}: AppDashboardShellProps) {
  return (
    <div className="flex h-full p-2 min-w-0 flex-1 flex-col gap-2">
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--background)] rounded-3xl sm:border sm:border-[var(--border)] sm:bg-[var(--surface)] sm:shadow-[var(--card-shadow)]">
        <DashboardNav
          workspaces={workspaces}
          currentUserId={currentUserId}
        />
        <main className="flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto w-full max-w-6xl px-3 pt-10 pb-[5.75rem] sm:px-4 sm:pt-12 sm:pb-6 md:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AppDashboardShell({
  children,
  workspaces,
  currentUserId,
}: AppDashboardShellProps) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <AppDashboardShellInner
        workspaces={workspaces}
        currentUserId={currentUserId}
      >
        {children}
      </AppDashboardShellInner>
      <DashboardMobileDock />
    </div>
  );
}
