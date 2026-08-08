'use client';

import { Suspense, type ReactNode } from 'react';
import {
  FormsDashboardProvider,
} from '@/components/app/forms-dashboard-context';
import { DashboardNav } from '@/components/app/dashboard-nav';
import { NotificationsDesktopPanel } from '@/components/app/notifications-desktop-panel';
import { DashboardMobileDock } from '@/components/app/dashboard-mobile-dock';
import { NotificationsQueryOpener } from '@/components/app/notifications-query-opener';
import { NotificationsLiveListener } from '@/components/app/notifications-live-listener';

interface ShellCommonProps {
  children: ReactNode;
  avatarUrl?: string | null;
  userName?: string | null;
}

function FormsDashboardShellInner({
  children,
  avatarUrl,
  userName,
}: ShellCommonProps) {
  return (
    <>
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <DashboardNav avatarUrl={avatarUrl} userName={userName} />
        <main className="flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto w-full min-w-0 max-w-5xl px-4 pb-[6.75rem] pt-4 sm:px-4 sm:pb-6 sm:pt-16 md:px-6">
            {children}
          </div>
        </main>
      </div>

      <NotificationsDesktopPanel />
    </>
  );
}

export function FormsDashboardShell({
  children,
  avatarUrl,
  userName,
}: ShellCommonProps) {
  return (
    <FormsDashboardProvider>
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Suspense fallback={null}>
          <NotificationsQueryOpener />
        </Suspense>
        <NotificationsLiveListener />
        <FormsDashboardShellInner
          avatarUrl={avatarUrl}
          userName={userName}
        >
          {children}
        </FormsDashboardShellInner>
        <DashboardMobileDock />
      </div>
    </FormsDashboardProvider>
  );
}
