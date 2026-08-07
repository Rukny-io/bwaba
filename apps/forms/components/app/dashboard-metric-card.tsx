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
  comparisonSecondary: string;
  trend?: string;
  trendPositive?: boolean;
  /** Soft status/meta chip (shown instead of trend when set). */
  chip?: string;
  chipTone?: DashboardMetricChipTone;
  /** When false, value is treated as localized text (not forced LTR). Default true. */
  tabular?: boolean;
}

const chipToneClass: Record<DashboardMetricChipTone, string> = {
  success: 'text-[var(--success)] dark:text-[var(--brand-lime)]',
  warning: 'text-[var(--warning)]',
  danger: 'text-[var(--danger)]',
  neutral: 'text-[var(--muted-foreground)]',
};

/** Balance-style metric card — pill header, muted caption, hero value */
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

  const footerTrend = !chip && trend ? trend : null;
  const showFooterPill = Boolean(footerTrend || chip || comparisonSecondary);

  return (
    <article className="dashboard-card flex min-h-[8.25rem] flex-col gap-3 rounded-2xl border-[1px] border-[var(--border)] p-4 shadow-none sm:min-h-[9.5rem] sm:gap-3.5 sm:rounded-[2rem] sm:p-5">
      <div className="inline-flex max-w-full items-center gap-2 self-start rounded-full bg-[var(--surface-secondary)] py-1 pe-3 ps-1">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--brand-carbon)] ring-1 ring-[var(--border)]/50 sm:size-8 dark:text-[var(--foreground)]">
          <Icon size={15} strokeWidth={1.9} className="sm:hidden" aria-hidden />
          <Icon
            size={16}
            strokeWidth={1.85}
            className="hidden sm:block"
            aria-hidden
          />
        </span>
        <span className="truncate text-[12px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[13px]">
          {label}
        </span>
      </div>

      <div className="mt-auto flex min-w-0 flex-col gap-2">
        <p
          className={cn(
            'min-w-0 max-w-full break-words font-bold leading-none tracking-tight text-[var(--foreground)]',
            tabular
              ? 'text-[1.75rem] tabular-nums sm:text-[2rem]'
              : 'text-[1.35rem] leading-snug sm:text-[1.5rem]',
          )}
        >
          {valueNode}
        </p>

        {showFooterPill ? (
          <div className="inline-flex max-w-full items-center gap-1.5 self-start rounded-full bg-[var(--surface-secondary)] px-2.5 py-1">
            {footerTrend ? (
              <span
                className={cn(
                  'shrink-0 text-[11px] font-semibold tabular-nums',
                  trendPositive
                    ? 'text-[var(--success)] dark:text-[var(--brand-lime)]'
                    : 'text-[var(--danger)]',
                )}
                dir="ltr"
                lang="en"
              >
                {footerTrend}
              </span>
            ) : null}
            {chip ? (
              <span
                className={cn(
                  'shrink-0 text-[11px] font-semibold',
                  chipToneClass[chipTone],
                )}
              >
                {chip}
              </span>
            ) : null}
            {footerTrend && comparisonSecondary ? (
              <span className="text-[var(--border)]" aria-hidden>
                ·
              </span>
            ) : null}
            {comparisonSecondary ? (
              <span className="min-w-0 truncate text-[11px] font-medium text-[var(--muted-foreground)] sm:text-[12px]">
                {comparisonSecondary}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
