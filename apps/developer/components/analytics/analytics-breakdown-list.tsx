'use client';

import { cn } from '@/lib/utils';

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

interface AnalyticsBreakdownListProps {
  title: string;
  items: Record<string, number>;
  emptyLabel: string;
  className?: string;
}

export function AnalyticsBreakdownList({
  title,
  items,
  emptyLabel,
  className,
}: AnalyticsBreakdownListProps) {
  const rows = Object.entries(items)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);

  const max = rows[0]?.count ?? 0;

  return (
    <div className={cn('flex min-h-0 flex-col gap-3', className)}>
      <h3 className="text-[13px] font-medium text-[var(--muted-foreground)]">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-[13px] text-[var(--muted-foreground)]">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((row) => {
            const pct = max > 0 ? Math.round((row.count / max) * 100) : 0;
            return (
              <li key={row.key} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="truncate font-medium text-[var(--foreground)]">
                    {row.key}
                  </span>
                  <span
                    className="shrink-0 tabular-nums text-[var(--muted-foreground)]"
                    dir="ltr"
                    lang="en"
                  >
                    {formatNumber(row.count)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                  <div
                    className="h-full rounded-full bg-[var(--foreground)]/55"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
