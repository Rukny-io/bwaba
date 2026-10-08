'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Check, Loader2, Monitor, Moon, Sun } from 'lucide-react';
import { DashboardNotice } from '@/components/app/dashboard-section';
import { useProfilePreviewRefresh } from '@/components/app/links/profile-preview-provider';
import { orderPillButtonClass } from '@/components/orders/order-pill-button';
import { SettingsFormRow } from '@/components/settings/settings-form-row';
import { updateMyProfile } from '@/lib/profile/api';
import {
  PROFILE_PAGE_THEMES,
  resolveProfilePageTheme,
  type ProfilePageThemeKey,
} from '@/lib/profile/profile-page-themes';
import type { MyProfile } from '@/lib/profile/types';
import {
  DASHBOARD_LOCALE_OPTIONS,
  readDashboardLocale,
  writeDashboardLocale,
  type DashboardLocale,
} from '@/lib/settings/dashboard-locale';
import { ApiException } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type DashboardColorTheme = 'light' | 'dark' | 'system';

const DASHBOARD_THEME_OPTIONS: {
  id: DashboardColorTheme;
  label: string;
  icon: typeof Sun;
}[] = [
  { id: 'light', label: 'فاتح', icon: Sun },
  { id: 'dark', label: 'داكن', icon: Moon },
  { id: 'system', label: 'النظام', icon: Monitor },
];

function ProfileThemePreviewCard({
  theme,
  selected,
  saving,
  onSelect,
}: {
  theme: (typeof PROFILE_PAGE_THEMES)[number];
  selected: boolean;
  saving: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={saving}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl text-start ring-1 transition-all',
        'ring-[var(--border)] hover:ring-[color-mix(in_oklab,var(--foreground)_18%,var(--border))]',
        selected && 'ring-2 ring-[var(--foreground)]',
        saving && 'opacity-70',
      )}
    >
      <div
        className="relative flex flex-col items-center px-4 pb-4 pt-5"
        style={{ backgroundColor: theme.background, color: theme.foreground }}
      >
        <div
          className="size-10 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.linkSurface})`,
          }}
        />
        <div
          className="mt-2 h-2 w-16 rounded-full"
          style={{ backgroundColor: theme.foreground, opacity: 0.85 }}
        />
        <div className="mt-1 h-1.5 w-24 rounded-full" style={{ backgroundColor: theme.muted }} />
        <div className="mt-3 flex w-full flex-col gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-7 w-full rounded-lg"
              style={{ backgroundColor: theme.linkSurface }}
            />
          ))}
        </div>
        {selected ? (
          <span
            className="absolute end-2.5 top-2.5 flex size-6 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.accent, color: '#fff' }}
          >
            <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="border-t border-[var(--separator)] bg-[var(--surface)] px-3.5 py-2.5">
        <p className="text-[13px] font-medium text-[var(--foreground)]">{theme.label}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-[var(--muted-foreground)]">
          {theme.description}
        </p>
      </div>
    </button>
  );
}

interface SettingsAppearanceSectionProps {
  profile: MyProfile;
  onProfileChange: (profile: MyProfile) => void;
}

export function SettingsAppearanceSection({
  profile,
  onProfileChange,
}: SettingsAppearanceSectionProps) {
  const refreshPreview = useProfilePreviewRefresh();
  const { theme: dashboardTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);

  const [pageTheme, setPageTheme] = useState<ProfilePageThemeKey>(
    resolveProfilePageTheme(profile.themeKey),
  );
  const [savingPageTheme, setSavingPageTheme] = useState(false);
  const [pageNotice, setPageNotice] = useState<{
    tone: 'success' | 'danger';
    text: string;
  } | null>(null);

  const [locale, setLocale] = useState<DashboardLocale>('ar');

  useEffect(() => setThemeMounted(true), []);
  useEffect(() => {
    setPageTheme(resolveProfilePageTheme(profile.themeKey));
  }, [profile.themeKey]);
  useEffect(() => {
    setLocale(readDashboardLocale());
  }, []);

  const activeDashboardTheme: DashboardColorTheme =
    dashboardTheme === 'light' || dashboardTheme === 'dark' || dashboardTheme === 'system'
      ? dashboardTheme
      : 'system';

  const handlePageThemeSelect = useCallback(
    async (next: ProfilePageThemeKey) => {
      if (next === pageTheme && resolveProfilePageTheme(profile.themeKey) === next) return;
      setPageTheme(next);
      setSavingPageTheme(true);
      setPageNotice(null);
      try {
        const updated = await updateMyProfile({ themeKey: next });
        onProfileChange({ ...profile, ...updated });
        setPageNotice({ tone: 'success', text: 'تم تحديث مظهر صفحتك العامة.' });
        refreshPreview?.();
      } catch (err) {
        setPageTheme(resolveProfilePageTheme(profile.themeKey));
        setPageNotice({
          tone: 'danger',
          text: err instanceof ApiException ? err.message : 'تعذّر حفظ المظهر',
        });
      } finally {
        setSavingPageTheme(false);
      }
    },
    [onProfileChange, pageTheme, profile, refreshPreview],
  );

  const handleDashboardTheme = useCallback(
    (next: DashboardColorTheme) => {
      setTheme(next);
    },
    [setTheme],
  );

  const handleLocale = useCallback((next: DashboardLocale) => {
    const option = DASHBOARD_LOCALE_OPTIONS.find((o) => o.id === next);
    if (!option?.available) return;
    setLocale(next);
    writeDashboardLocale(next);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {pageNotice ? (
        <DashboardNotice
          tone={pageNotice.tone}
          title={pageNotice.tone === 'success' ? 'تم' : 'تنبيه'}
          description={pageNotice.text}
        />
      ) : null}

      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-[15px] font-medium text-[var(--foreground)]">صفحتك العامة</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
            يظهر هذا المظهر لزوار رابطك العام على ركني.
          </p>
        </div>
        <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-3">
          {savingPageTheme ? (
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-[var(--surface)]/40"
              aria-hidden
            >
              <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : null}
          {PROFILE_PAGE_THEMES.map((theme) => (
            <ProfileThemePreviewCard
              key={theme.id}
              theme={theme}
              selected={pageTheme === theme.id}
              saving={savingPageTheme}
              onSelect={() => void handlePageThemeSelect(theme.id)}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5 border-t border-[var(--separator)] pt-8">
        <div>
          <h3 className="text-[15px] font-medium text-[var(--foreground)]">لوحة التحكم</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
            مظهر التطبيق على جهازك فقط ولا يغيّر صفحتك العامة.
          </p>
        </div>

        <SettingsFormRow label="السمة" hint="يمكنك أيضاً التبديل السريع من شريط الأدوات أعلى الصفحة.">
          <div className="flex flex-wrap gap-1.5">
            {DASHBOARD_THEME_OPTIONS.map((option) => {
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

        <SettingsFormRow label="اللغة">
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
                  {!option.available ? (
                    <span className="ms-1 text-[10px] font-normal opacity-80">قريباً</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </SettingsFormRow>
      </section>
    </div>
  );
}
