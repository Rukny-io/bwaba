'use client';

import type { ReactNode } from 'react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { SettingsTabsNav } from '@/components/settings/settings-tabs-nav';

export function SettingsChrome({ children }: { children: ReactNode }) {
  const s = useTranslations().developerSettings;

  return (
    <div className="dashboard-section-stack">
      <DashboardPageHeader title={s.title} description={s.subtitle}>
        <SettingsTabsNav />
      </DashboardPageHeader>
      <div className="space-y-5 sm:space-y-6">{children}</div>
    </div>
  );
}
