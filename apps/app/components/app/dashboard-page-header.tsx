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
    <header className={cn(className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--muted-foreground)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="w-full min-w-0 sm:w-auto sm:shrink-0">{actions}</div>
        ) : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </header>
  );
}
