'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { pillTabClassName, pillTabGroupClassName } from '@/components/ui/pill-tab';

const THEME_OPTIONS = [
  { value: 'light', label: 'فاتح', icon: Sun },
  { value: 'dark', label: 'داكن', icon: Moon },
  { value: 'system', label: 'النظام', icon: Monitor },
] as const;

type ThemeOption = (typeof THEME_OPTIONS)[number]['value'];

export function SettingsAppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const activeTheme = (theme ?? 'system') as ThemeOption;

  return (
    <SettingsSectionCard
      icon={Sun}
      title="المظهر"
      description="سمة عرض لوحة Forms — لا تؤثر على النماذج المنشورة للجمهور."
    >
      <div
        className={pillTabGroupClassName}
        role="group"
        aria-label="سمة العرض"
      >
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = mounted && activeTheme === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              disabled={!mounted}
              onClick={() => setTheme(opt.value)}
              aria-pressed={active}
              className={pillTabClassName(active, 'inline-flex items-center gap-2 px-4 py-2.5')}
            >
              <Icon className="size-4" strokeWidth={1.8} />
              {opt.label}
            </button>
          );
        })}
      </div>
    </SettingsSectionCard>
  );
}
