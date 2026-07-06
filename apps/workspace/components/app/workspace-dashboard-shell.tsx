'use client';

import { type ReactNode } from 'react';
import { DashboardNav } from '@/components/app/dashboard-nav';

export function WorkspaceDashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="dashboard-shell relative flex min-h-0 min-w-0 flex-1 flex-col overflow-clip rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto w-full max-w-5xl px-4 pt-14 pb-24 sm:pb-6 md:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
