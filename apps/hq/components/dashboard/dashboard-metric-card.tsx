import type { LucideIcon } from 'lucide-react';

export interface DashboardMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  comparisonPrimary: string;
  comparisonSecondary?: string;
  trend?: string;
  trendPositive?: boolean;
  href?: string;
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
    <article className="dashboard-card flex min-h-[7.25rem] flex-col gap-2 rounded-2xl p-3 sm:min-h-0 sm:gap-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--primary)] sm:size-10 sm:rounded-xl">
          <Icon className="size-[18px] sm:size-5" strokeWidth={1.6} />
        </div>
        {trend ? (
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums sm:px-2.5 sm:py-1 sm:text-[11px] ${
              trendPositive
                ? 'bg-[var(--success)]/15 text-[var(--success)]'
                : 'bg-[var(--danger)]/15 text-[var(--danger)]'
            }`}
            dir="ltr"
            lang="en"
          >
            {trend}
          </span>
        ) : (
          <span className="size-0 sm:hidden" aria-hidden />
        )}
      </div>

      <p className="line-clamp-2 text-xs font-medium leading-snug text-[var(--muted-foreground)] sm:text-[13px]">
        {label}
      </p>

      <div className="mt-auto space-y-1 sm:space-y-0">
        <div className="flex items-end justify-between gap-2 sm:gap-3">
          <p
            className="text-[1.35rem] font-bold leading-none tabular-nums text-[var(--foreground)] sm:text-[1.75rem]"
            dir="ltr"
            lang="en"
          >
            {value}
          </p>
          {comparisonSecondary ? (
            <p className="hidden max-w-[9rem] text-end text-[11px] leading-snug text-[var(--muted-foreground)]/70 sm:block">
              {comparisonPrimary}
              <br />
              {comparisonSecondary}
            </p>
          ) : (
            <p className="hidden max-w-[9rem] text-end text-[11px] leading-snug text-[var(--muted-foreground)]/70 sm:block">
              {comparisonPrimary}
            </p>
          )}
        </div>
        <p className="line-clamp-1 text-[10px] leading-tight text-[var(--muted-foreground)]/70 sm:hidden">
          {comparisonPrimary}
        </p>
      </div>
    </article>
  );
}
