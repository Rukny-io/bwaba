'use client';

import { usePathname } from 'next/navigation';
import { resolvePageLabel } from '@/components/layout/nav-config';
import { DevNavActions } from '@/components/app/dev-nav-actions';
import { devNavGlassClass } from '@/components/app/nav-glass';
import { cn } from '@/lib/utils';

interface DashboardNavProps {
  userName?: string | null;
  appName?: string | null;
}

export function DashboardNav({ userName: _userName, appName }: DashboardNavProps) {
  const pathname = usePathname();
  const pageLabel = resolvePageLabel(pathname);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20">
      <div className="pointer-events-auto flex items-center justify-between gap-2 px-3 pt-2.5 pb-1.5 sm:px-6 lg:pt-4">
        <nav
          className={cn(
            'hidden items-center gap-1.5 px-3 py-2 md:flex',
            devNavGlassClass,
          )}
          aria-label="مسار التنقل"
        >
          {appName ? (
            <span className="truncate text-xs font-medium text-[var(--muted-foreground)]">
              {appName}
              <span className="mx-1.5 opacity-40">/</span>
            </span>
          ) : null}
          <span className="truncate text-sm font-semibold tracking-tight text-[var(--foreground)]">
            {pageLabel}
          </span>
        </nav>

        <DevNavActions className="ms-auto" />
      </div>
    </header>
  );
}
