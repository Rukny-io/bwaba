import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function DashboardSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--border)] bg-[var(--surface)] sm:rounded-3xl',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DashboardPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function DashboardEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="dashboard-card flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/25 px-6 py-14 text-center">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
