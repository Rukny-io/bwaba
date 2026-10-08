'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { DashboardMobileDock } from '@/components/app/dashboard-mobile-dock';
import { DashboardPageFrame } from '@/components/app/dashboard-page-frame';

interface AppDashboardShellProps {
  children: ReactNode;
}

function useWideDashboardPage(): boolean {
  const pathname = usePathname();
  return (
    Boolean(pathname?.startsWith('/app/orders')) ||
    Boolean(pathname?.startsWith('/app/analytics')) ||
    Boolean(pathname?.startsWith('/app/settings'))
  );
}

function AppDashboardShellInner({ children }: AppDashboardShellProps) {
  const wide = useWideDashboardPage();

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <main className="min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <DashboardPageFrame wide={wide}>{children}</DashboardPageFrame>
      </main>
    </div>
  );
}

export function AppDashboardShell({ children }: AppDashboardShellProps) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <AppDashboardShellInner>
        {children}
      </AppDashboardShellInner>
      <DashboardMobileDock />
    </div>
  );
}
