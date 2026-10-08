'use client';

import { pillTabClassName, pillTabGroupClassName } from '@/components/ui/pill-tab';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export const ANALYTICS_PERIOD_DAYS = [7, 30, 90] as const;

export type AnalyticsPeriodDays = (typeof ANALYTICS_PERIOD_DAYS)[number];

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
  const { t } = useTranslations();

  return (
    <div
      className={cn(pillTabGroupClassName, className)}
      role="group"
      aria-label={t('analytics.dateRange')}
    >
      {ANALYTICS_PERIOD_DAYS.map((days) => {
        const active = value === days;
        return (
          <button
            key={days}
            type="button"
            onClick={() => onChange(days)}
            aria-pressed={active}
            className={pillTabClassName(active)}
          >
            {t('analytics.periodDays', { n: days })}
          </button>
        );
      })}
    </div>
  );
}
