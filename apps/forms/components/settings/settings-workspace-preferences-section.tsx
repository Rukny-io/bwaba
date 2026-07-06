'use client';

import { SlidersHorizontal } from 'lucide-react';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import {
  ANALYTICS_PERIOD_OPTIONS,
  type AnalyticsPeriodDays,
} from '@/components/analytics/analytics-period-picker';
import { useFormsPreferences } from '@/hooks/use-forms-preferences';
import { pillTabClassName, pillTabGroupClassName } from '@/components/ui/pill-tab';

export function SettingsWorkspacePreferencesSection() {
  const { preferences, update } = useFormsPreferences();

  function setPeriod(days: AnalyticsPeriodDays) {
    update({ analyticsDefaultPeriod: days });
  }

  return (
    <SettingsSectionCard
      icon={SlidersHorizontal}
      title="تفضيلات مساحة العمل"
      description="إعدادات افتراضية تُطبَّق داخل تطبيق Forms فقط."
    >
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--foreground)]">
          الفترة الافتراضية للتحليلات
        </p>
        <p className="text-[13px] text-[var(--muted-foreground)]">
          تُستخدم عند فتح صفحة التحليلات العامة.
        </p>
        <div
          className={`${pillTabGroupClassName} justify-start`}
          role="group"
          aria-label="الفترة الافتراضية للتحليلات"
        >
          {ANALYTICS_PERIOD_OPTIONS.map((opt) => {
            const active = preferences.analyticsDefaultPeriod === opt.days;

            return (
              <button
                key={opt.days}
                type="button"
                onClick={() => setPeriod(opt.days)}
                aria-pressed={active}
                className={pillTabClassName(active)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </SettingsSectionCard>
  );
}
