'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useDashboardShellVariant } from '@/components/app/dashboard-shell-variant';
import { cn } from '@/lib/utils';

interface BusinessDashboardShellProps {
  children: ReactNode;
}

export function BusinessDashboardShell({ children }: BusinessDashboardShellProps) {
  const pathname = usePathname();
  const contextVariant = useDashboardShellVariant();
  const isCanvas =
    contextVariant === 'canvas' ||
    pathname.startsWith('/app/workflows') ||
    pathname.startsWith('/app/inbox');

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <main
        className={cn(
          'min-h-0 flex-1 overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          isCanvas ? 'overflow-hidden' : 'overflow-y-auto',
        )}
      >
        <div
          className={cn(
            isCanvas
              ? 'relative flex h-full min-h-0 w-full flex-1 flex-col px-3 pb-3 pt-[3.75rem] sm:px-4 sm:pb-4 sm:pt-20'
              : 'dashboard-page mx-auto w-full min-w-0 max-w-6xl px-4 pb-24 pt-4 sm:px-5 sm:pt-16 sm:pb-6 md:px-6',
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
