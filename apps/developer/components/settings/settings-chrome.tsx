'use client';

import type { ReactNode } from 'react';
import { useTranslations } from '@/components/providers/translations-provider';
import { SettingsTabsNav } from '@/components/settings/settings-tabs-nav';

export function SettingsChrome({ children }: { children: ReactNode }) {
  const s = useTranslations().developerSettings;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            {s.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{s.subtitle}</p>
        </div>
        <SettingsTabsNav />
      </header>
      <div className="space-y-5 sm:space-y-6">{children}</div>
    </div>
  );
}
