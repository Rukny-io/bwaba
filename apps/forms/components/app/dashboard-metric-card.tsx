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
  success: 'bg-[var(--brand-soft-lime)] text-[var(--success)]',
  warning: 'bg-[var(--warning)]/15 text-[var(--warning)]',
  danger: 'bg-[var(--danger)]/15 text-[var(--danger)]',
  neutral: 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
};

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

function MetaChip({
  chip,
  tone = 'neutral',
}: {
  chip: string;
  tone?: DashboardMetricChipTone;
}) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:py-1 sm:text-[11px]',
        chipToneClass[tone],
      )}
    >
      {chip}
    </span>
  );
}

/** Unified metric card — forms-list design used across the dashboard */
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

  const meta = chip ? (
    <MetaChip chip={chip} tone={chipTone} />
  ) : trend ? (
    <TrendBadge trend={trend} trendPositive={trendPositive} />
  ) : null;

  return (
    <article className="dashboard-card flex min-h-[7.5rem] flex-col rounded-2xl p-3.5 sm:min-h-[8.5rem] sm:gap-4 sm:p-5">
      {/* ── Mobile ── */}
      <div className="flex min-h-0 flex-1 flex-col sm:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--primary)] ring-1 ring-[var(--border)]/40">
            <Icon size={15} strokeWidth={1.85} />
          </div>
          <p className="min-w-0 flex-1 text-[11px] font-semibold leading-snug text-[var(--muted-foreground)]">
            {label}
          </p>
          {meta}
        </div>

        <div className="mt-auto flex min-h-[2.75rem] w-full flex-col justify-end pt-2.5">
          <p
            className={cn(
              'text-right font-bold leading-none tracking-tight text-[var(--foreground)]',
              tabular
                ? 'text-[1.65rem] tabular-nums'
                : 'text-[1.35rem] leading-snug',
            )}
          >
            {valueNode}
          </p>
          <p className="mt-1 line-clamp-2 text-right text-[10px] leading-relaxed text-[var(--muted-foreground)]/75">
            {comparisonPrimary}
            {comparisonSecondary && comparisonSecondary !== comparisonPrimary
              ? ` · ${comparisonSecondary}`
              : null}
          </p>
        </div>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden sm:contents">
        <div className="flex items-center justify-between gap-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)]">
            <Icon className="size-5" strokeWidth={1.6} />
          </div>
          {meta}
        </div>

        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-[var(--muted-foreground)]">
          {label}
        </p>

        <div className="mt-auto">
          <div className="flex items-end justify-between gap-3">
            <p
              className={cn(
                'text-right font-bold leading-none tracking-tight text-[var(--foreground)]',
                tabular
                  ? 'text-[1.75rem] tabular-nums'
                  : 'text-[1.35rem] leading-snug',
              )}
            >
              {valueNode}
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
