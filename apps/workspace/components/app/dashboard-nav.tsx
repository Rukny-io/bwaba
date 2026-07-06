'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { resolvePageLabel, APP_BASE } from '@/components/app/nav-config';
import { workspaceNavGlassClass } from '@/components/app/nav-glass';
import { cn } from '@/lib/utils';

export function DashboardNav() {
  const pathname = usePathname();
  const pageLabel = resolvePageLabel(pathname);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20">
      <div className="pointer-events-auto flex items-center justify-between gap-2 px-3 pt-2.5 pb-1.5 sm:px-6 lg:pt-4">
        <nav
          className={cn(
            'hidden items-center gap-1.5 md:flex lg:px-4 lg:py-2.5',
            workspaceNavGlassClass,
          )}
          aria-label="Breadcrumb"
        >
          <span className="truncate text-sm font-semibold text-[var(--foreground)]">
            {pageLabel}
          </span>
        </nav>

        <Link
          href={`${APP_BASE}/mail/compose`}
          className={cn(
            'ms-auto inline-flex items-center gap-2 rounded-3xl px-4 py-2 text-sm font-medium',
            'bg-[var(--foreground)] text-[var(--background)] transition-opacity hover:opacity-90',
          )}
        >
          <PenLine size={16} strokeWidth={1.75} />
          <span className="hidden sm:inline">رسالة جديدة</span>
        </Link>
      </div>
    </header>
  );
}
