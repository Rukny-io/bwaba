'use client';

import { usePathname } from 'next/navigation';
import { resolvePageLabel } from '@/components/layout/nav-config';
import { HqNavActions } from '@/components/app/hq-nav-actions';
import { hqNavGlassClass } from '@/components/app/nav-glass';
import { cn } from '@/lib/utils';

interface DashboardNavProps {
  userName?: string | null;
}

export function DashboardNav({ userName: _userName }: DashboardNavProps) {
  const pathname = usePathname();
  const pageLabel = resolvePageLabel(pathname);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20">
      <div className="pointer-events-auto flex items-center justify-between gap-2 px-3 pt-2.5 pb-1.5 sm:px-6 lg:pt-4">
        <nav
          className={cn(
            'hidden items-center gap-1.5 md:flex lg:px-4 lg:py-2.5',
            hqNavGlassClass,
          )}
          aria-label="Breadcrumb"
        >
          <span className="truncate text-sm font-semibold text-[var(--foreground)]">
            {pageLabel}
          </span>
        </nav>

        <span className="truncate text-sm font-semibold text-[var(--foreground)] md:hidden">
          {pageLabel}
        </span>

        <HqNavActions className="ms-auto md:ms-0" />
      </div>
    </header>
  );
}
