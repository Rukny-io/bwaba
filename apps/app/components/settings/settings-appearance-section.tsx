'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { orderPillButtonClass } from '@/components/orders/order-pill-button';
import { SettingsFormRow } from '@/components/settings/settings-form-row';
import { useTranslations } from '@/lib/i18n';
import {
  DASHBOARD_LOCALE_OPTIONS,
  type DashboardLocale,
} from '@/lib/settings/dashboard-locale';
import { cn } from '@/lib/utils';
import { useDashboardLocale } from '@/components/app/locale-provider';

type DashboardColorTheme = 'light' | 'dark' | 'system';

export function SettingsAppearanceSection() {
  const { theme: dashboardTheme, setTheme } = useTheme();
  const { locale, setLocale } = useDashboardLocale();
  const { t } = useTranslations();
  const [themeMounted, setThemeMounted] = useState(false);

  useEffect(() => setThemeMounted(true), []);

  const activeDashboardTheme: DashboardColorTheme =
    dashboardTheme === 'light' || dashboardTheme === 'dark' || dashboardTheme === 'system'
      ? dashboardTheme
      : 'system';

  const themeOptions: Array<{
    id: DashboardColorTheme;
    label: string;
    icon: typeof Sun;
  }> = [
    { id: 'light', label: t('settings.appearance.light'), icon: Sun },
    { id: 'dark', label: t('settings.appearance.dark'), icon: Moon },
    { id: 'system', label: t('settings.appearance.system'), icon: Monitor },
  ];

  const handleDashboardTheme = useCallback(
    (next: DashboardColorTheme) => {
      setTheme(next);
    },
    [setTheme],
  );

  const handleLocale = useCallback(
    (next: DashboardLocale) => {
      const option = DASHBOARD_LOCALE_OPTIONS.find((o) => o.id === next);
      if (!option?.available) return;
      setLocale(next);
    },
    [setLocale],
  );

  return (
    <div className="flex flex-col gap-5">
      <SettingsFormRow
        label={t('settings.appearance.theme')}
        hint={t('settings.appearance.themeHint')}
      >
        <div className="flex flex-wrap gap-1.5">
          {themeOptions.map((option) => {
            const active = themeMounted && activeDashboardTheme === option.id;
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                disabled={!themeMounted}
                onClick={() => handleDashboardTheme(option.id)}
                className={cn(
                  orderPillButtonClass,
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px]',
                  active && 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-100',
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
                {option.label}
              </button>
            );
          })}
        </div>
      </SettingsFormRow>

      <SettingsFormRow label={t('settings.appearance.language')}>
        <div className="flex flex-wrap gap-1.5">
          {DASHBOARD_LOCALE_OPTIONS.map((option) => {
            const active = locale === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={!option.available}
                onClick={() => handleLocale(option.id)}
                className={cn(
                  orderPillButtonClass,
                  'px-3 py-1.5 text-[12px]',
                  active &&
                    option.available &&
                    'bg-[var(--foreground)] text-[var(--background)] hover:opacity-100',
                  !option.available && 'cursor-not-allowed opacity-45',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </SettingsFormRow>
    </div>
  );
}
