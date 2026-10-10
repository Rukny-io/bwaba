'use client';

import type { ReactNode } from 'react';
import { useTranslations } from '@/components/providers/translations-provider';
import { SettingsSidebarNav } from '@/components/settings/settings-tabs-nav';
import { SettingsMobileDock } from '@/components/settings/settings-mobile-dock';

export function SettingsChrome({ children }: { children: ReactNode }) {
  const s = useTranslations().developerSettings;

  return (
    <>
      <div className="dashboard-page mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-5">
        <div className="mb-0 lg:mb-1">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
            {s.title}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
            {s.subtitle}
          </p>
        </div>

        <div className="grid gap-6 pb-2 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-10 xl:gap-12">
          <SettingsSidebarNav className="hidden lg:flex" />
          <div className="flex min-w-0 flex-col gap-6 sm:gap-8">{children}</div>
        </div>
      </div>

      <SettingsMobileDock />
    </>
  );
}
