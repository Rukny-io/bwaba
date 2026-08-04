import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  comparisonPrimary: string;
  comparisonSecondary: string;
  trend?: string;
  trendPositive?: boolean;
  /** Tighter spacing/type — used on forms list mobile density */
  compact?: boolean;
}

function TrendBadge({
  trend,
  trendPositive,
  className,
}: {
  trend: string;
  trendPositive: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums sm:px-2.5 sm:py-1 sm:text-[11px]',
        trendPositive
          ? 'bg-[var(--brand-soft-lime)] text-[var(--success)]'
          : 'bg-[var(--danger)]/15 text-[var(--danger)]',
        className,
      )}
      dir="ltr"
      lang="en"
    >
      {trend}
    </span>
  );
}

export function DashboardMetricCard({
  icon: Icon,
  label,
  value,
  comparisonPrimary,
  comparisonSecondary,
  trend,
  trendPositive = true,
  compact = false,
}: DashboardMetricCardProps) {
  return (
    <article
      className={cn(
        'flex flex-col rounded-2xl border border-[var(--border)]',
        compact
          ? 'min-h-[7.25rem] gap-1.5 p-3 sm:min-h-0 sm:gap-4 sm:p-5'
          : 'min-h-[9.75rem] p-[1.125rem] sm:min-h-0 sm:gap-4 sm:p-5',
      )}
    >
      {/* ── Mobile ── */}
      <div className="flex min-h-0 flex-1 flex-col sm:hidden">
        <div className={cn('flex items-center', compact ? 'gap-2' : 'gap-2.5')}>
          <div
            className={cn(
              'flex shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--primary)] ring-1 ring-[var(--border)]/40',
              compact ? 'size-8' : 'size-10',
            )}
          >
            <Icon size={compact ? 15 : 17} strokeWidth={1.85} />
          </div>
          <p
            className={cn(
              'min-w-0 flex-1 font-semibold leading-snug text-[var(--muted-foreground)]',
              compact ? 'text-[11px]' : 'text-[13px]',
            )}
          >
            {label}
          </p>
          {trend ? (
            <TrendBadge trend={trend} trendPositive={trendPositive} />
          ) : null}
        </div>

        <div
          className={cn(
            'mt-auto flex w-full flex-col justify-end',
            compact ? 'min-h-[2.75rem] pt-2.5' : 'min-h-[4.25rem] pt-4',
          )}
        >
          <p
            className={cn(
              'text-right font-bold leading-none tracking-tight tabular-nums text-[var(--foreground)]',
              compact ? 'text-[1.65rem]' : 'text-[2.25rem]',
            )}
          >
            <span dir="ltr" lang="en">
              {value}
            </span>
          </p>
          <p
            className={cn(
              'line-clamp-2 text-right leading-relaxed text-[var(--muted-foreground)]/75',
              compact ? 'mt-1 text-[10px]' : 'mt-1.5 text-[10px]',
            )}
          >
            {comparisonPrimary}
          </p>
        </div>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden sm:contents">
        <div className="flex items-center justify-between gap-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)]">
            <Icon className="size-5" strokeWidth={1.6} />
          </div>
          {trend ? (
            <TrendBadge trend={trend} trendPositive={trendPositive} />
          ) : null}
        </div>

        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-[var(--muted-foreground)]">
          {label}
        </p>

        <div className="mt-auto">
          <div className="flex items-end justify-between gap-3">
            <p className="text-right text-[1.75rem] font-bold leading-none tabular-nums text-[var(--foreground)]">
              <span dir="ltr" lang="en">
                {value}
              </span>
            </p>
            <p className="max-w-[9rem] shrink-0 text-end text-[11px] leading-snug text-[var(--muted-foreground)]/70">
              {comparisonPrimary}
              <br />
              {comparisonSecondary}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
