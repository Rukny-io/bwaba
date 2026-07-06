'use client';

import { useTheme } from 'next-themes';
import { Globe, Monitor, Moon, Sun, User } from 'lucide-react';
import { setLocaleAction } from '@/actions/set-locale';
import { useTranslations } from '@/components/providers/translations-provider';
import {
  OptionButton,
  SettingsSection,
} from '@/components/settings/settings-ui';
import type { AuthUser } from '@/lib/api';

export function AccountSettingsPanel({ user }: { user: AuthUser }) {
  const t = useTranslations();
  const s = t.developerSettings;
  const isEn = t.common.switchLang === 'العربية';
  const { theme, setTheme } = useTheme();

  async function handleLangChange(locale: 'ar' | 'en') {
    await setLocaleAction(locale);
    window.location.reload();
  }

  return (
    <>
      <SettingsSection title={s.profileTitle} description={s.profileDesc}>
        <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-secondary)]/60 p-4">
          <span className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-sm font-semibold text-white">
            {(user.name ?? user.email).charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {user.name ?? user.username ?? s.profileFallback}
            </p>
            <p className="truncate text-xs text-[var(--muted-foreground)]" dir="ltr">
              {user.email}
            </p>
          </div>
          <User className="ms-auto size-4 shrink-0 text-[var(--muted-foreground)]" />
        </div>
      </SettingsSection>

      <SettingsSection title={s.generalTitle} description={s.generalDesc}>
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--foreground)]">
              {s.languageLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              <OptionButton active={!isEn} onClick={() => void handleLangChange('ar')}>
                <Globe className="size-3.5" />
                {s.languageAr}
              </OptionButton>
              <OptionButton active={isEn} onClick={() => void handleLangChange('en')}>
                <Globe className="size-3.5" />
                {s.languageEn}
              </OptionButton>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-[var(--foreground)]">
              {s.themeLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              <OptionButton active={theme === 'light'} onClick={() => setTheme('light')}>
                <Sun className="size-3.5" />
                {s.themeLight}
              </OptionButton>
              <OptionButton active={theme === 'dark'} onClick={() => setTheme('dark')}>
                <Moon className="size-3.5" />
                {s.themeDark}
              </OptionButton>
              <OptionButton active={theme === 'system'} onClick={() => setTheme('system')}>
                <Monitor className="size-3.5" />
                {s.themeSystem}
              </OptionButton>
            </div>
          </div>
        </div>
      </SettingsSection>
    </>
  );
}
