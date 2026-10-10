'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  BriefcaseBusiness,
  CreditCard,
  LogOut,
  UserRound,
} from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { logoutWithNotification } from '@/lib/auth-notify';
import { cn } from '@/lib/utils';
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

export function SettingsSidebarNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const t = useTranslations();
  const s = t.developerSettings;

  const labels: Record<SettingsTabSegment, string> = {
    account: s.navAccount,
    alerts: s.navAlerts,
    platform: s.navPlatform,
    metaPortfolio: s.navMetaPortfolio,
  };

  return (
    <aside
      className={cn(
        'settings-sidebar sticky top-4 z-10 flex h-fit max-h-[calc(100dvh-2rem)] flex-col self-start overflow-y-auto sm:top-20',
        className,
      )}
    >
      <nav aria-label={s.title} className="space-y-0.5">
        {SETTINGS_TABS.map((tab) => {
          const active = isSettingsTabActive(pathname, tab.href);
          const Icon = TAB_ICONS[tab.segment];

          return (
            <Link
              key={tab.segment}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'settings-nav-item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start transition-colors',
                active
                  ? 'settings-nav-item--active'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)]/70 hover:text-[var(--foreground)]',
              )}
            >
              <Icon className="size-[17px] shrink-0" strokeWidth={1.85} aria-hidden />
              <span className="text-[14px] font-medium leading-none">
                {labels[tab.segment]}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-[var(--border)]/60 pt-5">
        <button
          type="button"
          onClick={() => void logoutWithNotification()}
          className="settings-sign-out inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-4 py-2.5 text-[13px] font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
        >
          <LogOut className="size-4" strokeWidth={1.85} aria-hidden />
          {t.sidebar.logout}
        </button>
        <p className="settings-sidebar-brand mt-6 text-[15px] font-bold tracking-tight text-[var(--foreground)]">
          Rukny
        </p>
        <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
          {s.subtitle}
        </p>
      </div>
    </aside>
  );
}

/** @deprecated Use SettingsSidebarNav */
export function SettingsTabsNav() {
  return <SettingsSidebarNav className="lg:hidden" />;
}
