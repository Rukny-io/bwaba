'use client';

import { cn } from '@/lib/utils';
import type { AnalyticsPeriodDays } from '@/lib/api/analytics';

const OPTIONS: { days: AnalyticsPeriodDays; labelKey: 'period7' | 'period30' | 'period90' }[] = [
  { days: 7, labelKey: 'period7' },
  { days: 30, labelKey: 'period30' },
  { days: 90, labelKey: 'period90' },
];

interface AnalyticsPeriodPickerProps {
  value: AnalyticsPeriodDays;
  onChange: (days: AnalyticsPeriodDays) => void;
  labels: Record<'period7' | 'period30' | 'period90', string>;
  className?: string;
}

export function AnalyticsPeriodPicker({
  value,
  onChange,
  labels,
  className,
}: AnalyticsPeriodPickerProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-2xl bg-[var(--surface-secondary)] p-1',
        className,
      )}
      role="group"
      aria-label="period"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.days;
        return (
          <button
            key={opt.days}
            type="button"
            onClick={() => onChange(opt.days)}
            aria-pressed={active}
            className={cn(
              'rounded-xl px-3 py-1.5 text-[13px] font-medium transition-colors',
              active
                ? 'bg-[var(--surface)] text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
          >
            {labels[opt.labelKey]}
          </button>
        );
      })}
    </div>
  );
}
