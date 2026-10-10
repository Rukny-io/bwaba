'use client';

import type { AnalyticsCountryItem } from '@/lib/analytics/types';
import { formatNumber } from '@/lib/dashboard-format';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface AnalyticsCountryBreakdownProps {
  items: AnalyticsCountryItem[];
  className?: string;
}

export function AnalyticsCountryBreakdown({
  items,
  className,
}: AnalyticsCountryBreakdownProps) {
  const { t } = useTranslations();
  const sorted = [...items].sort((a, b) => b.clicks - a.clicks).slice(0, 8);

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">{t('analytics.noGeoYet')}</p>
    );
  }

  const max = Math.max(1, ...sorted.map((i) => i.clicks));

  return (
    <ul className={cn('space-y-3', className)}>
      {sorted.map((item) => (
        <li key={item.country}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-[var(--foreground)]">{item.country}</span>
            <span className="shrink-0 tabular-nums text-[var(--muted-foreground)]" dir="ltr">
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
  );
}
