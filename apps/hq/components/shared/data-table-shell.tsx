'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function DataTableShell({
  children,
  className,
  isLoading,
  isEmpty,
  emptyTitle = 'No results',
  emptyDescription = 'Try changing the filters or search query.',
}: {
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (isLoading) {
    return (
      <div className={cn('dashboard-card overflow-hidden rounded-2xl sm:rounded-3xl', className)}>
        <div className="space-y-3 p-4 sm:p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-xl bg-[var(--surface-secondary)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={cn(
          'dashboard-card flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center sm:rounded-3xl',
          className,
        )}
      >
        <p className="text-sm font-semibold text-[var(--foreground)]">{emptyTitle}</p>
        <p className="mt-1 max-w-sm text-xs text-[var(--muted-foreground)]">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('dashboard-card overflow-hidden rounded-2xl sm:rounded-3xl', className)}>
      {children}
    </div>
  );
}
