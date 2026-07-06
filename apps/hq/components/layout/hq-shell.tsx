'use client';

import type { ReactNode } from 'react';
import { DashboardNav } from '@/components/app/dashboard-nav';

interface HqShellProps {
  children: ReactNode;
  userName?: string | null;
  userEmail?: string | null;
}

export function HqShell({ children, userName }: HqShellProps) {
  return (
    <div className="dashboard-card relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-3xl">
      <DashboardNav userName={userName} />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-6 sm:px-6 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
