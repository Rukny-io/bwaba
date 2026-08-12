import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DashboardMetricChipTone =
  | 'success'
  | 'warning'
  | 'neutral'
  | 'danger';

export interface DashboardMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  comparisonPrimary: string;
  comparisonSecondary?: string;
  trend?: string;
  trendPositive?: boolean;
  chip?: string;
  chipTone?: DashboardMetricChipTone;
  tabular?: boolean;
  href?: string;
}

const chipToneClass: Record<DashboardMetricChipTone, string> = {
  success: 'text-[var(--success)]',
  warning: 'text-[var(--warning)]',
  danger: 'text-[var(--danger)]',
  neutral: 'text-[var(--muted-foreground)]',
};

/** Flat metric tile — matches forms dashboard */
export function DashboardMetricCard({
  icon: Icon,
  label,
  value,
  comparisonPrimary,
  comparisonSecondary,
  trend,
  trendPositive = true,
  chip,
  chipTone = 'neutral',
  tabular = true,
}: DashboardMetricCardProps) {
  const valueNode = tabular ? (
    <span dir="ltr" lang="en">
      {value}
    </span>
  ) : (
    value
  );

  const hasFooter = Boolean(
    chip || trend || comparisonSecondary || comparisonPrimary,
  );

  return (
    <article className="dashboard-metric-tile flex min-h-[7.25rem] flex-col rounded-2xl p-4 sm:min-h-[7.75rem] sm:p-[1.125rem]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium leading-snug text-[var(--muted-foreground)]">
          {label}
        </p>
        <Icon
          className="size-[18px] shrink-0 text-[var(--muted-foreground)]/75"
          strokeWidth={1.75}
          aria-hidden
        />
      </div>

      <p
        className={cn(
          'mt-3 min-w-0 font-semibold leading-none tracking-tight text-[var(--foreground)]',
          tabular
            ? 'text-[1.65rem] tabular-nums sm:text-[1.75rem]'
            : 'text-[1.25rem] leading-snug sm:text-[1.35rem]',
        )}
      >
        {valueNode}
      </p>

      {hasFooter ? (
        <p className="mt-auto pt-3 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
          {chip ? (
            <span className={cn('font-medium', chipToneClass[chipTone])}>
              {chip}
            </span>
          ) : null}
          {!chip && trend ? (
            <>
              <span
                className={cn(
                  'font-medium tabular-nums',
                  trendPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]',
                )}
                dir="ltr"
                lang="en"
              >
                {trend}
              </span>
              {comparisonSecondary ? (
                <span className="text-[var(--muted-foreground)]">
                  {' '}
                  · {comparisonSecondary}
                </span>
              ) : comparisonPrimary ? (
                <span className="text-[var(--muted-foreground)]">
                  {' '}
                  · {comparisonPrimary}
                </span>
              ) : null}
            </>
          ) : !chip && comparisonSecondary ? (
            <>
              {comparisonPrimary}
              {comparisonPrimary ? ' · ' : null}
              {comparisonSecondary}
            </>
          ) : !chip && comparisonPrimary ? (
            comparisonPrimary
          ) : null}
        </p>
      ) : null}
    </article>
  );
}
