'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Fingerprint, Globe, Scale } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { optionPillClass } from '@/components/settings/settings-ui';
import { cn } from '@/lib/utils';
import {
  APP_SETTINGS_TABS,
  appSettingsHref,
  isAppSettingsTabActive,
  type AppSettingsTabSegment,
} from '@/lib/app-settings-routes';

const TAB_ICONS: Record<AppSettingsTabSegment, LucideIcon> = {
  identity: Fingerprint,
  domains: Globe,
  legal: Scale,
};

export function AppSettingsTabsNav() {
  const pathname = usePathname();
  const { app } = useCurrentApp();
  const s = useTranslations().appSettings;

  const labels: Record<AppSettingsTabSegment, string> = {
    identity: s.navIdentity,
    domains: s.navDomains,
    legal: s.navLegal,
  };

  return (
    <nav
      className="grid w-full max-w-xl grid-cols-3 gap-2 sm:max-w-2xl"
      aria-label={s.title}
    >
      {APP_SETTINGS_TABS.map((tab) => {
        const href = appSettingsHref(app.appId, tab.slug);
        const active = isAppSettingsTabActive(pathname, app.appId, tab.slug);
        const Icon = TAB_ICONS[tab.segment];

        return (
          <Link
            key={tab.segment}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(optionPillClass(active, 'lg'), 'w-full')}
          >
            <Icon className="size-3.5" strokeWidth={active ? 2 : 1.75} aria-hidden />
            {labels[tab.segment]}
          </Link>
        );
      })}
    </nav>
  );
}
