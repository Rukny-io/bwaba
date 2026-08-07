'use client';

import { Suspense, type ReactNode } from 'react';
import {
  FormsDashboardProvider,
} from '@/components/app/forms-dashboard-context';
import { DashboardNav } from '@/components/app/dashboard-nav';
import type { AccessibleWorkspace } from '@/lib/workspace';
import { NotificationsDesktopPanel } from '@/components/app/notifications-desktop-panel';
import { DashboardMobileDock } from '@/components/app/dashboard-mobile-dock';
import { NotificationsQueryOpener } from '@/components/app/notifications-query-opener';
import { NotificationsLiveListener } from '@/components/app/notifications-live-listener';

interface ShellCommonProps {
  children: ReactNode;
  username?: string | null;
  workspaces?: AccessibleWorkspace[];
  currentUserId?: string;
}

function FormsDashboardShellInner({
  children,
  username,
  workspaces,
  currentUserId,
}: ShellCommonProps) {
  return (
    <>
      <div className="flex h-full min-w-0 flex-1 flex-col gap-2">
        <div className="dashboard-shell relative flex min-h-0 min-w-0 flex-1 flex-col overflow-clip bg-[var(--background)] sm:rounded-3xl sm:border sm:border-[var(--border)] sm:bg-[var(--surface)]">
          <DashboardNav
            username={username}
            workspaces={workspaces}
            currentUserId={currentUserId}
          />
          <main className="flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="mx-auto w-full min-w-0 max-w-5xl px-4 pt-10 pb-[6.75rem] sm:px-4 sm:pt-12 sm:pb-6 md:px-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      <NotificationsDesktopPanel />
    </>
  );
}

export function FormsDashboardShell({
  children,
  username,
  workspaces,
  currentUserId,
}: ShellCommonProps) {
  return (
    <FormsDashboardProvider>
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Suspense fallback={null}>
          <NotificationsQueryOpener />
        </Suspense>
        <NotificationsLiveListener />
        <FormsDashboardShellInner
          username={username}
          workspaces={workspaces}
          currentUserId={currentUserId}
        >
          {children}
        </FormsDashboardShellInner>
        <DashboardMobileDock />
      </div>
    </FormsDashboardProvider>
  );
}
