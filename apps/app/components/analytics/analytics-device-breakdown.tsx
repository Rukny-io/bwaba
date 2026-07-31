'use client';

import type { AnalyticsDeviceItem } from '@/lib/analytics/types';
import { formatNumber } from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'جوال',
  tablet: 'تابلت',
  desktop: 'سطح المكتب',
  unknown: 'غير معروف',
};

interface AnalyticsDeviceBreakdownProps {
  items: AnalyticsDeviceItem[];
  className?: string;
}

export function AnalyticsDeviceBreakdown({
  items,
  className,
}: AnalyticsDeviceBreakdownProps) {
  const sorted = [...items].sort((a, b) => b.clicks - a.clicks);

  if (sorted.length === 0) {
    return (
      <p className="text-sm italic text-[var(--muted-foreground)]">
        لا توجد بيانات أجهزة بعد
      </p>
    );
  }

  const max = Math.max(1, ...sorted.map((i) => i.clicks));

  return (
    <ul className={cn('space-y-3', className)}>
      {sorted.map((item) => (
        <li key={item.deviceType}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="text-[var(--foreground)]">
              {DEVICE_LABELS[item.deviceType] ?? item.deviceType}
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
      ))}
    </ul>
  );
}
