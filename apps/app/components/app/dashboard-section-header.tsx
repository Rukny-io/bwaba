import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardSectionHeaderProps {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function DashboardSectionHeader({
  title,
  description,
  href,
  linkLabel = 'عرض الكل',
  className,
  children,
}: DashboardSectionHeaderProps) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)] sm:text-sm">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline sm:text-sm"
          >
            {linkLabel}
            <ArrowLeft className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
