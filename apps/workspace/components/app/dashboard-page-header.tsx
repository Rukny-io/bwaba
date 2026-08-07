import type { ReactNode } from 'react';
import { Typography } from '@heroui/react';
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
          <Typography.Heading level={1} className="text-xl sm:text-2xl">
            {title}
          </Typography.Heading>
          {description ? (
            <Typography.Paragraph
              size="sm"
              color="muted"
              className="mt-1 text-[13px] sm:text-sm"
            >
              {description}
            </Typography.Paragraph>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </header>
  );
}
