'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Fingerprint, Globe, LogOut } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { logoutWithNotification } from '@/lib/auth-notify';
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
};

export function AppSettingsSidebarNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { app } = useCurrentApp();
  const t = useTranslations();
  const s = t.appSettings;

  const labels: Record<AppSettingsTabSegment, string> = {
    identity: s.navIdentity,
    domains: s.navDomains,
  };

  return (
    <aside
      className={cn(
        'settings-sidebar sticky top-4 z-10 flex h-fit max-h-[calc(100dvh-2rem)] flex-col self-start overflow-y-auto sm:top-20',
        className,
      )}
    >
      <nav aria-label={s.title} className="space-y-0.5">
        {APP_SETTINGS_TABS.map((tab) => {
          const href = appSettingsHref(app.appId, tab.slug);
          const active = isAppSettingsTabActive(pathname, app.appId, tab.slug);
          const Icon = TAB_ICONS[tab.segment];

          return (
            <Link
              key={tab.segment}
              href={href}
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
          {s.subtitle.replace('{name}', app.name)}
        </p>
      </div>
    </aside>
  );
}

/** @deprecated Use AppSettingsSidebarNav — kept for any stray imports */
export function AppSettingsTabsNav() {
  return <AppSettingsSidebarNav className="lg:hidden" />;
}
