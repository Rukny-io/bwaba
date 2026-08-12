import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardPageHeaderProps {
  title: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function DashboardPageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
  children,
}: DashboardPageHeaderProps) {
  return (
    <header className={cn('mb-6 sm:mb-8', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? <div className="mb-1">{eyebrow}</div> : null}
          <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <div className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
              {description}
            </div>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </header>
  );
}
