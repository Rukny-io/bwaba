'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Fingerprint, Globe } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import {
  MobileDockShell,
  MobileDockPill,
  MobileDockNavLink,
  mobileDockSideButtonClass,
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

/** Bottom nav for app settings — matches main / product mobile dock sizing */
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
      <Link
        href={appDashboard(app.appId)}
        aria-label={t.mobile.backToMenu}
        className={mobileDockSideButtonClass}
      >
        <ArrowLeft
          className="size-5 rtl:rotate-180"
          strokeWidth={2}
          aria-hidden
        />
      </Link>

      <MobileDockPill aria-label={s.title}>
        {APP_SETTINGS_TABS.map((tab) => {
          const href = appSettingsHref(app.appId, tab.slug);
          return (
            <MobileDockNavLink
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
