'use client';

import type { ReactNode } from 'react';

interface DevShellProps {
  children: ReactNode;
  userName?: string | null;
  appName?: string | null;
}

export function DevShell({ children }: DevShellProps) {
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-24 sm:px-5 sm:pt-16 sm:pb-6 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
