'use client';

import { useState } from 'react';
import {
  Gauge,
  Link2,
  Palette,
  UserCircle,
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
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import type { FormsDashboardMetrics } from '@/lib/forms-dashboard-data';
import { cn } from '@/lib/utils';

const SECTIONS: {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: typeof Gauge;
}[] = [
  {
    id: 'overview',
    label: 'نظرة عامة',
    description: 'النشاط والحصة والتخزين',
    icon: Gauge,
  },
  {
    id: 'account',
    label: 'الحساب',
    description: 'الملف الشخصي والأمان',
    icon: UserCircle,
  },
  {
    id: 'preferences',
    label: 'التفضيلات',
    description: 'المظهر والإشعارات',
    icon: Palette,
  },
  {
    id: 'links',
    label: 'الروابط',
    description: 'العامة والاختصارات',
    icon: Link2,
  },
];

interface SettingsViewProps {
  metrics: FormsDashboardMetrics;
  username?: string | null;
}

export function SettingsView({ metrics, username }: SettingsViewProps) {
  const [section, setSection] = useState<SettingsSectionId>('overview');
  const active = SECTIONS.find((item) => item.id === section) ?? SECTIONS[0];

  const content = (
    <>
      <div className="border-b border-[var(--separator)] pb-3 lg:block">
        <h2 className="text-[15px] font-semibold text-[var(--foreground)]">
          {active.label}
        </h2>
        <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
          {active.description}
        </p>
      </div>

      {section === 'overview' ? (
        <>
          <SettingsUsageSection metrics={metrics} />
          <SettingsPlanQuotaSection />
          <SettingsStorageSection />
        </>
      ) : null}

      {section === 'account' ? <SettingsAccountSection /> : null}

      {section === 'preferences' ? (
        <>
          <SettingsAppearanceSection />
          <SettingsWorkspacePreferencesSection />
          <SettingsNotificationsSection />
        </>
      ) : null}

      {section === 'links' ? (
        <>
          <SettingsPublicLinksSection username={username} />
          <SettingsShortcutsSection />
        </>
      ) : null}
    </>
  );

  return (
    <>
      <DashboardPageHeader
        title="الإعدادات"
        description="إدارة حسابك، حصتك، المظهر، وإشعارات مساحة عمل النماذج."
        className="mb-0"
      />

      {/* Mobile content — bottom dock handles section switching */}
      <div className="flex flex-col gap-3 pb-2 sm:gap-3.5 lg:hidden">
        {content}
      </div>

      <SettingsMobileDock section={section} onSectionChange={setSection} />

      {/* Desktop sticky sidebar */}
      <div className="hidden lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start lg:gap-4">
        <aside className="sticky top-4 self-start">
          <div className="dashboard-card space-y-0.5 rounded-2xl p-2">
            <p className="px-2.5 pb-1.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              الأقسام
            </p>
            <nav aria-label="أقسام الإعدادات" className="space-y-0.5">
              {SECTIONS.map((item) => {
                const Icon = item.icon;
                const isActive = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2.5 text-start transition-colors',
                      isActive
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full',
                        isActive
                          ? 'bg-white/15'
                          : 'bg-[var(--surface-secondary)] text-[var(--primary)]',
                      )}
                    >
                      <Icon className="size-3.5" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-snug">
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          'mt-0.5 block text-[10px] leading-snug',
                          isActive ? 'opacity-80' : 'opacity-75',
                        )}
                      >
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-3.5">{content}</div>
      </div>
    </>
  );
}
