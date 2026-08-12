'use client';

import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Fingerprint, Globe, LayoutGrid } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import {
  MobileDockShell,
  MobileDockPill,
  MobileDockItem,
} from '@/components/layout/mobile-dock-primitives';
import { appDashboard } from '@/lib/app-routes';
import {
  APP_SETTINGS_TABS,
  appSettingsHref,
  isAppSettingsTabActive,
  type AppSettingsTabSegment,
} from '@/lib/app-settings-routes';

const TAB_ICONS: Record<AppSettingsTabSegment, LucideIcon> = {
  identity: Fingerprint,
  domains: Globe,
};

/** Bottom nav for app settings — same glass language as forms SettingsMobileDock */
export function AppSettingsMobileDock() {
  const pathname = usePathname();
  const { app } = useCurrentApp();
  const s = useTranslations().appSettings;
  const t = useTranslations();

  const labels: Record<AppSettingsTabSegment, string> = {
    identity: s.navIdentity,
    domains: s.navDomains,
  };

  return (
    <MobileDockShell hiddenAbove="lg">
      <MobileDockPill
        aria-label={s.title}
        dir={t.common.switchLang === 'English' ? 'rtl' : 'ltr'}
      >
        <MobileDockItem
          href={appDashboard(app.appId)}
          icon={LayoutGrid}
          label={t.sidebar.dashboard}
          isActive={false}
        />
        {APP_SETTINGS_TABS.map((tab) => {
          const href = appSettingsHref(app.appId, tab.slug);
          return (
            <MobileDockItem
              key={tab.segment}
              href={href}
              icon={TAB_ICONS[tab.segment]}
              label={labels[tab.segment]}
              isActive={isAppSettingsTabActive(pathname, app.appId, tab.slug)}
            />
          );
        })}
      </MobileDockPill>
    </MobileDockShell>
  );
}
