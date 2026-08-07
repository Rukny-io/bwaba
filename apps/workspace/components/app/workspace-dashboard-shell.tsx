'use client';

import { type ReactNode } from 'react';
import { DashboardNav } from '@/components/app/dashboard-nav';
import { DashboardMobileDock } from '@/components/app/dashboard-mobile-dock';

export function WorkspaceDashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex h-full min-w-0 flex-1 flex-col gap-2">
        <div className="dashboard-shell relative flex min-h-0 min-w-0 flex-1 flex-col overflow-clip bg-[var(--background)] sm:rounded-3xl sm:border sm:border-[var(--border)] sm:bg-[var(--surface)]">
          <DashboardNav />
          <main className="flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-[5.75rem] sm:px-4 sm:pt-12 sm:pb-6 md:px-6">
              {children}
            </div>
          </main>
        </div>
      </div>
      <DashboardMobileDock />
    </div>
  );
}
