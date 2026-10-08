import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-2xl bg-[var(--surface)] p-4 sm:p-5',
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-medium tracking-tight text-[var(--foreground)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DashboardPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-t border-[var(--border)] pt-4', className)}>
      {children}
    </div>
  );
}

type DashboardNoticeTone = 'success' | 'danger' | 'warning' | 'info';

export function DashboardNotice({
  tone = 'info',
  title,
  description,
}: {
  tone?: DashboardNoticeTone;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-2xl px-4 py-3',
        tone === 'success' &&
          'bg-[color-mix(in_srgb,var(--success)_12%,var(--surface-secondary))]',
        tone === 'danger' &&
          'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface-secondary))]',
        tone === 'warning' &&
          'bg-[color-mix(in_srgb,var(--warning)_12%,var(--surface-secondary))]',
        tone === 'info' && 'bg-[var(--surface-secondary)]',
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        {description ? (
          <p className="mt-0.5 text-[13px] leading-5 text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
