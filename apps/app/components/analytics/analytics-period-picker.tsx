'use client';

import { pillTabClassName, pillTabGroupClassName } from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

export const ANALYTICS_PERIOD_OPTIONS = [
  { days: 7, label: '7 أيام' },
  { days: 30, label: '30 يوماً' },
  { days: 90, label: '90 يوماً' },
] as const;

export type AnalyticsPeriodDays =
  (typeof ANALYTICS_PERIOD_OPTIONS)[number]['days'];

interface AnalyticsPeriodPickerProps {
  value: AnalyticsPeriodDays;
  onChange: (days: AnalyticsPeriodDays) => void;
  className?: string;
}

export function AnalyticsPeriodPicker({
  value,
  onChange,
  className,
}: AnalyticsPeriodPickerProps) {
  return (
    <div
      className={cn(pillTabGroupClassName, className)}
      role="group"
      aria-label="نطاق التاريخ"
    >
      {ANALYTICS_PERIOD_OPTIONS.map((opt) => {
        const active = value === opt.days;
        return (
          <button
            key={opt.days}
            type="button"
            onClick={() => onChange(opt.days)}
            aria-pressed={active}
            className={pillTabClassName(active)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
