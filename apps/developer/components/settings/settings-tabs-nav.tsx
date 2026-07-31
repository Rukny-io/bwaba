'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from '@/components/providers/translations-provider';
import { SETTINGS_TABS, isSettingsTabActive } from '@/lib/settings-routes';
import { cn } from '@/lib/utils';

export function SettingsTabsNav() {
  const pathname = usePathname();
  const s = useTranslations().developerSettings;

  const labels: Record<string, string> = {
    account: s.navAccount,
    alerts: s.navAlerts,
    platform: s.navPlatform,
  };

  return (
    <nav className="flex flex-wrap gap-2" aria-label={s.title}>
      {SETTINGS_TABS.map((tab) => {
        const active = isSettingsTabActive(pathname, tab.href);
        return (
          <Link
            key={tab.segment}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-semibold transition-colors',
              active
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'bg-[var(--surface-secondary)] text-[var(--foreground)] hover:bg-[var(--border)]',
            )}
          >
            {labels[tab.segment]}
          </Link>
        );
      })}
    </nav>
  );
}
