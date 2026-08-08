'use client';

import type { ReactNode } from 'react';
import { DashboardNav } from '@/components/app/dashboard-nav';
import { DashboardMobileDock } from '@/components/app/dashboard-mobile-dock';

interface AppDashboardShellProps {
  children: ReactNode;
  avatarUrl?: string | null;
  userName?: string | null;
}

function AppDashboardShellInner({
  children,
  avatarUrl,
  userName,
}: AppDashboardShellProps) {
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <DashboardNav avatarUrl={avatarUrl} userName={userName} />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto w-full min-w-0 max-w-5xl px-4 pb-[6.75rem] pt-4 sm:px-4 sm:pb-6 sm:pt-16 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export function AppDashboardShell({
  children,
  avatarUrl,
  userName,
}: AppDashboardShellProps) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <AppDashboardShellInner avatarUrl={avatarUrl} userName={userName}>
        {children}
      </AppDashboardShellInner>
      <DashboardMobileDock />
    </div>
  );
}
