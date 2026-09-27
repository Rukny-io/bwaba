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
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-medium tracking-tight text-[var(--foreground)]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--foreground)] underline-offset-2 hover:underline sm:text-sm"
          >
            {linkLabel}
            <ArrowLeft className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
