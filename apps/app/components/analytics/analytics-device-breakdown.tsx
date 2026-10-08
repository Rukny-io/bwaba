'use client';

import type { AnalyticsDeviceItem } from '@/lib/analytics/types';
import { formatNumber } from '@/lib/dashboard-format';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface AnalyticsDeviceBreakdownProps {
  items: AnalyticsDeviceItem[];
  className?: string;
}

export function AnalyticsDeviceBreakdown({
  items,
  className,
}: AnalyticsDeviceBreakdownProps) {
  const { t } = useTranslations();
  const sorted = [...items].sort((a, b) => b.clicks - a.clicks);

  if (sorted.length === 0) {
    return (
      <p className="text-sm italic text-[var(--muted-foreground)]">
        {t('analytics.noDevicesYet')}
      </p>
    );
  }

  const max = Math.max(1, ...sorted.map((i) => i.clicks));

  return (
    <ul className={cn('space-y-3', className)}>
      {sorted.map((item) => {
        const path = `analytics.device.${item.deviceType}`;
        const label = t(path);
        return (
          <li key={item.deviceType}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="text-[var(--foreground)]">
                {label === path ? item.deviceType : label}
              </span>
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
        );
      })}
    </ul>
  );
}
