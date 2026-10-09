'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { FileText } from 'lucide-react';
import type { DashboardMetricChipTone } from '@/components/dashboard/dashboard-metric-card';
import { cn } from '@/lib/utils';

const chipToneClass: Record<DashboardMetricChipTone, string> = {
  success: 'text-[var(--success)]',
  warning: 'text-[var(--warning)]',
  danger: 'text-[var(--danger)]',
  neutral: 'text-[var(--muted-foreground)]',
};

export function templateStatusTone(status: string): DashboardMetricChipTone {
  const s = status.toUpperCase();
  if (s === 'APPROVED') return 'success';
  if (s === 'PENDING') return 'warning';
  if (s === 'REJECTED') return 'danger';
  return 'neutral';
}

export function WhatsappTemplateTile({
  metaLabel,
  title,
  preview,
  footerPrimary,
  footerPrimaryTone = 'neutral',
  footerExtra,
  icon: Icon = FileText,
  headerActions,
  onClick,
  className,
}: {
  metaLabel: string;
  title: string;
  preview?: string;
  footerPrimary?: string;
  footerPrimaryTone?: DashboardMetricChipTone;
  footerExtra?: string;
  icon?: LucideIcon;
  headerActions?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const interactive = Boolean(onClick);

  return (
    <article
      className={cn(
        'dashboard-metric-tile group flex min-h-[7.25rem] flex-col rounded-2xl p-4 transition-colors duration-200 sm:min-h-[7.75rem] sm:p-[1.125rem]',
        interactive && 'cursor-pointer hover:bg-[var(--surface-secondary)]',
        className,
      )}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[13px] font-medium leading-snug text-[var(--muted-foreground)]">
          {metaLabel}
        </p>
        <div
          className="flex shrink-0 items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {headerActions}
          <Icon
            className="size-[18px] text-[var(--muted-foreground)]/75"
            strokeWidth={1.75}
            aria-hidden
          />
        </div>
      </div>

      <h3
        className="mt-3 min-w-0 truncate text-[1.25rem] font-semibold leading-snug tracking-tight text-[var(--foreground)] sm:text-[1.35rem]"
        dir="ltr"
        title={title}
      >
        {title}
      </h3>

      {preview ? (
        <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
          {preview}
        </p>
      ) : null}

      {(footerPrimary || footerExtra) && (
        <div className="mt-auto pt-3 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
          {footerPrimary ? (
            <span className={cn('font-medium', chipToneClass[footerPrimaryTone])}>
              {footerPrimary}
            </span>
          ) : null}
          {footerPrimary && footerExtra ? ' · ' : null}
          {footerExtra ? (
            <span dir="ltr" lang="en">
              {footerExtra}
            </span>
          ) : null}
        </div>
      )}
    </article>
  );
}
