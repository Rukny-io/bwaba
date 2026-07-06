'use client';

import type { ReactNode } from 'react';
import { DashboardNav } from '@/components/app/dashboard-nav';
import { useOptionalCurrentApp } from '@/components/providers/app-context';

interface DevShellProps {
  children: ReactNode;
  userName?: string | null;
  appName?: string | null;
}

export function DevShell({ children, userName, appName: initialAppName }: DevShellProps) {
  const appContext = useOptionalCurrentApp();
  const appName = appContext?.app.name ?? initialAppName;

  return (
    <div className="dashboard-shell relative flex min-h-0 min-w-0 flex-1 flex-col overflow-clip border border-[var(--border)] bg-[var(--surface)]">
      <DashboardNav userName={userName} appName={appName} />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-24 sm:pb-6 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
