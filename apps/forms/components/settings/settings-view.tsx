'use client';

import { useState } from 'react';
import {
  Gauge,
  HardDrive,
  Link2,
  LogOut,
  Palette,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';
import { SettingsAccountSection } from '@/components/settings/settings-account-section';
import { SettingsAppearanceSection } from '@/components/settings/settings-appearance-section';
import { SettingsNotificationsSection } from '@/components/settings/settings-notifications-section';
import { SettingsPublicLinksSection } from '@/components/settings/settings-public-links-section';
import { SettingsShortcutsSection } from '@/components/settings/settings-shortcuts-section';
import { SettingsStorageSection } from '@/components/settings/settings-storage-section';
import { SettingsPlanQuotaSection } from '@/components/settings/settings-plan-quota-section';
import { SettingsUsageSection } from '@/components/settings/settings-usage-section';
import { SettingsWorkspacePreferencesSection } from '@/components/settings/settings-workspace-preferences-section';
import {
  SettingsMobileDock,
  type SettingsSectionId,
} from '@/components/settings/settings-mobile-dock';
import type { SettingsViewUser } from '@/components/settings/settings-types';
import type { FormsDashboardMetrics } from '@/lib/forms-dashboard-data';
import { logoutWithNotification } from '@/lib/auth-notify';
import { cn } from '@/lib/utils';

const SECTIONS: {
  id: SettingsSectionId;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: 'overview', label: 'نظرة عامة', icon: Gauge },
  { id: 'storage', label: 'مساحة التخزين', icon: HardDrive },
  { id: 'account', label: 'الحساب', icon: UserCircle },
  { id: 'preferences', label: 'التفضيلات', icon: Palette },
  { id: 'links', label: 'الروابط', icon: Link2 },
];

interface SettingsViewProps {
  metrics: FormsDashboardMetrics;
  user: SettingsViewUser;
}

function SettingsSidebarNav({
  section,
  onSectionChange,
  onSignOut,
  className,
}: {
  section: SettingsSectionId;
  onSectionChange: (id: SettingsSectionId) => void;
  onSignOut: () => void;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        'settings-sidebar sticky top-34 flex flex-col self-start',
        className,
      )}
    >
      <nav aria-label="أقسام الإعدادات" className="space-y-0.5">
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          const isActive = section === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'settings-nav-item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start transition-colors',
                isActive
                  ? 'settings-nav-item--active'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)]/70 hover:text-[var(--foreground)]',
              )}
            >
              <Icon className="size-[17px] shrink-0" strokeWidth={1.85} aria-hidden />
              <span className="text-[14px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-[var(--border)]/60 pt-5">
        <button
          type="button"
          onClick={onSignOut}
          className="settings-sign-out inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-4 py-2.5 text-[13px] font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
        >
          <LogOut className="size-4" strokeWidth={1.85} aria-hidden />
          تسجيل الخروج
        </button>
        <p className="settings-sidebar-brand mt-6 text-[15px] font-bold tracking-tight text-[var(--foreground)]">
          رُكنّي
        </p>
        <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">مساحة عمل النماذج</p>
      </div>
    </aside>
  );
}

export function SettingsView({ metrics, user }: SettingsViewProps) {
  const [section, setSection] = useState<SettingsSectionId>('account');

  const content = (
    <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
      {section === 'overview' ? (
        <>
          <SettingsUsageSection metrics={metrics} />
          <SettingsPlanQuotaSection />
        </>
      ) : null}

      {section === 'storage' ? <SettingsStorageSection /> : null}

      {section === 'account' ? <SettingsAccountSection user={user} /> : null}

      {section === 'preferences' ? (
        <>
          <SettingsAppearanceSection />
          <SettingsWorkspacePreferencesSection />
          <SettingsNotificationsSection />
        </>
      ) : null}

      {section === 'links' ? (
        <>
          <SettingsPublicLinksSection username={user.username} />
          <SettingsShortcutsSection />
        </>
      ) : null}
    </div>
  );

  return (
    <>
      <div className="mb-4 lg:mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
          الإعدادات
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
          إدارة حسابك وتفضيلات مساحة عمل النماذج.
        </p>
      </div>

      <div className="grid items-start gap-6 pb-2 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-10 xl:gap-12">
        <SettingsSidebarNav
          className="hidden lg:flex"
          section={section}
          onSectionChange={setSection}
          onSignOut={() => void logoutWithNotification()}
        />
        <div className="min-w-0">{content}</div>
      </div>

      <SettingsMobileDock section={section} onSectionChange={setSection} />
    </>
  );
}

export type { SettingsViewUser } from '@/components/settings/settings-types';
