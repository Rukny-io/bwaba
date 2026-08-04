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
        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums sm:px-2.5 sm:py-1 sm:text-[11px]',
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
}: DashboardMetricCardProps) {
  return (
    <article className="dashboard-card flex min-h-[9.75rem] flex-col rounded-3xl p-[1.125rem] sm:min-h-0 sm:gap-4 sm:rounded-3xl sm:p-5">
      {/* ── Mobile ── */}
      <div className="flex min-h-0 flex-1 flex-col sm:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--primary)] ring-1 ring-[var(--border)]/40">
            <Icon size={17} strokeWidth={1.85} />
          </div>
          <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-[var(--muted-foreground)]">
            {label}
          </p>
          {trend ? (
            <TrendBadge trend={trend} trendPositive={trendPositive} />
          ) : null}
        </div>

        <div className="mt-auto flex min-h-[4.25rem] w-full flex-col justify-end pt-4">
          <p className="text-right text-[2.25rem] font-bold leading-none tracking-tight tabular-nums text-[var(--foreground)]">
            <span dir="ltr" lang="en">
              {value}
            </span>
          </p>
          <p className="mt-1.5 line-clamp-2 text-right text-[10px] leading-relaxed text-[var(--muted-foreground)]/75">
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
