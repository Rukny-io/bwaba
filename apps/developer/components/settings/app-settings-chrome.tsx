'use client';

import type { ReactNode } from 'react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { AppSettingsSidebarNav } from '@/components/settings/app-settings-tabs-nav';
import { AppSettingsMobileDock } from '@/components/settings/app-settings-mobile-dock';

export function AppSettingsChrome({ children }: { children: ReactNode }) {
  const { app } = useCurrentApp();
  const s = useTranslations().appSettings;

  return (
    <>
      <div className="dashboard-page mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-5">
        <div className="mb-0 lg:mb-1">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
            {s.title}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
            {s.subtitle.replace('{name}', app.name)}
          </p>
        </div>

        <div className="grid gap-6 pb-2 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-10 xl:gap-12">
          <AppSettingsSidebarNav className="hidden lg:flex" />
          <div className="flex min-w-0 flex-col gap-6 sm:gap-8">{children}</div>
        </div>
      </div>

      <AppSettingsMobileDock />
    </>
  );
}
