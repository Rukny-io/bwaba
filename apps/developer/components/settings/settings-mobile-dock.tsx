'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  CreditCard,
  UserRound,
} from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import {
  MobileDockShell,
  MobileDockPill,
  MobileDockNavLink,
  mobileDockSideButtonClass,
} from '@/components/layout/mobile-dock-primitives';
import {
  SETTINGS_TABS,
  isSettingsTabActive,
  type SettingsTabSegment,
} from '@/lib/settings-routes';

const TAB_ICONS: Record<SettingsTabSegment, LucideIcon> = {
  account: UserRound,
  alerts: Bell,
  platform: CreditCard,
  metaPortfolio: BriefcaseBusiness,
};

export function SettingsMobileDock() {
  const pathname = usePathname();
  const s = useTranslations().developerSettings;
  const t = useTranslations();

  const labels: Record<SettingsTabSegment, string> = {
    account: s.navAccount,
    alerts: s.navAlerts,
    platform: s.navPlatform,
    metaPortfolio: s.navMetaPortfolio,
  };

  return (
    <MobileDockShell hiddenAbove="lg">
      <Link
        href="/apps"
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
        {SETTINGS_TABS.map((tab) => (
          <MobileDockNavLink
            key={tab.segment}
            href={tab.href}
            icon={TAB_ICONS[tab.segment]}
            label={labels[tab.segment]}
            isActive={isSettingsTabActive(pathname, tab.href)}
          />
        ))}
      </MobileDockPill>
    </MobileDockShell>
  );
}
