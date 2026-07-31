'use client';

import { SettingsAccountSection } from '@/components/settings/settings-account-section';
import { SettingsAppearanceSection } from '@/components/settings/settings-appearance-section';
import { SettingsNotificationsSection } from '@/components/settings/settings-notifications-section';
import { SettingsPublicLinksSection } from '@/components/settings/settings-public-links-section';
import { SettingsShortcutsSection } from '@/components/settings/settings-shortcuts-section';
import { SettingsStorageSection } from '@/components/settings/settings-storage-section';
import { SettingsPlanQuotaSection } from '@/components/settings/settings-plan-quota-section';
import { SettingsUsageSection } from '@/components/settings/settings-usage-section';
import { SettingsWorkspacePreferencesSection } from '@/components/settings/settings-workspace-preferences-section';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import type { FormsDashboardMetrics } from '@/lib/forms-dashboard-data';

interface SettingsViewProps {
  metrics: FormsDashboardMetrics;
  username?: string | null;
}

export function SettingsView({ metrics, username }: SettingsViewProps) {
  return (
    <>
      <DashboardPageHeader
        title="إعدادات Forms"
        description="تفضيلات مساحة عمل النماذج — المظهر، الإشعارات، والاختصارات."
      />

      <SettingsAccountSection />
      <SettingsPlanQuotaSection />
      <SettingsUsageSection metrics={metrics} />
      <SettingsStorageSection />
      <SettingsAppearanceSection />
      <SettingsWorkspacePreferencesSection />
      <SettingsNotificationsSection />
      <SettingsPublicLinksSection username={username} />
      <SettingsShortcutsSection />
    </>
  );
}
