'use client';

import { usePathname } from 'next/navigation';
import { resolvePageLabel } from '@/components/app/nav-config';
import { FormsNavActions } from '@/components/app/forms-nav-actions';
import { formsNavGlassClass } from '@/components/app/nav-glass';
import { cn } from '@/lib/utils';

interface DashboardNavProps {
  username?: string | null;
}

export function DashboardNav({ username: _username }: DashboardNavProps) {
  const pathname = usePathname();
  const pageLabel = resolvePageLabel(pathname);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20">
      <div className="pointer-events-auto flex items-center justify-between gap-2 px-3 pt-2.5 pb-1.5 sm:px-6 lg:pt-4">
        <nav
          className={cn(
            'hidden items-center gap-1.5 md:flex lg:px-4 lg:py-2.5',
            formsNavGlassClass,
          )}
          aria-label="Breadcrumb"
        >
          <span className="truncate text-sm font-semibold text-[var(--foreground)]">
            {pageLabel}
          </span>
        </nav>

        <FormsNavActions
          notificationsMode="dashboard"
          className="ms-auto md:ms-0"
        />
      </div>
    </header>
  );
}
