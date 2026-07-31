import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
  compact = false,
}: DashboardEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/25 text-center',
        compact ? 'px-4 py-8 sm:px-6' : 'px-6 py-12 sm:px-10',
        className,
      )}
    >
      {Icon ? (
        <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--muted-foreground)] shadow-sm">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
      ) : null}
      <h2
        className={cn(
          'font-semibold text-[var(--foreground)]',
          compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg',
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">
          {description}
        </p>
      ) : null}
      {children ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
