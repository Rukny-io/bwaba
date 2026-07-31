'use client';

import type { AnalyticsCountryItem } from '@/lib/analytics/types';
import { formatNumber } from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

interface AnalyticsCountryBreakdownProps {
  items: AnalyticsCountryItem[];
  className?: string;
}

export function AnalyticsCountryBreakdown({
  items,
  className,
}: AnalyticsCountryBreakdownProps) {
  const sorted = [...items].sort((a, b) => b.clicks - a.clicks).slice(0, 8);

  if (sorted.length === 0) {
    return (
      <p className="text-sm italic text-[var(--muted-foreground)]">
        لا توجد بيانات جغرافية بعد
      </p>
    );
  }

  const max = Math.max(1, ...sorted.map((i) => i.clicks));

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-3 text-center sm:text-start">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">التوزيع الجغرافي</h3>
        <p className="text-xs text-[var(--muted-foreground)]">أعلى الدول حسب النقرات</p>
      </div>
      <ul className="space-y-3">
        {sorted.map((item) => (
          <li key={item.country}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="text-[var(--foreground)]">{item.country}</span>
              <span className="shrink-0 tabular-nums text-[var(--muted-foreground)]">
                {formatNumber(item.clicks)} ({item.percentage}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                style={{
                  width: `${Math.max((item.clicks / max) * 100, item.clicks > 0 ? 6 : 0)}%`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
