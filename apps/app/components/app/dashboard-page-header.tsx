import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardPageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function DashboardPageHeader({
  title,
  description,
  actions,
  className,
  children,
}: DashboardPageHeaderProps) {
  return (
    <header className={cn('mb-6 sm:mb-8', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </header>
  );
}
