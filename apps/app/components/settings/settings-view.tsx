'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardErrorState } from '@/components/app/dashboard-error-state';
import { DashboardSection } from '@/components/app/dashboard-section';
import { SettingsAccountSection } from '@/components/settings/settings-account-section';
import { SettingsAppearanceSection } from '@/components/settings/settings-appearance-section';
import { SettingsDeliverySection } from '@/components/settings/settings-delivery-section';
import { SettingsNavMobile } from '@/components/settings/settings-nav-aside';
import { SettingsPaymentsSection } from '@/components/settings/settings-payments-section';
import { SettingsPrivacySection } from '@/components/settings/settings-privacy-section';
import { SettingsProfileSection } from '@/components/settings/settings-profile-section';
import { fetchMyProfile } from '@/lib/profile/api';
import type { MyProfile } from '@/lib/profile/types';
import { ApiException } from '@/lib/api-client';
import { useTranslations } from '@/lib/i18n';
import {
  parseSettingsSection,
  type SettingsSectionId,
} from '@/lib/settings/sections';

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-40 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
      <div className="h-56 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
    </div>
  );
}

function SettingsBasicsContent({
  profile,
  onProfileChange,
}: {
  profile: MyProfile;
  onProfileChange: (profile: MyProfile) => void;
}) {
  const { t } = useTranslations();

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <DashboardSection
        title={t('settings.profile.title')}
        description={t('settings.profile.description')}
      >
        <SettingsProfileSection profile={profile} onProfileChange={onProfileChange} />
      </DashboardSection>
      <DashboardSection
        title={t('settings.privacy.title')}
        description={t('settings.privacy.description')}
      >
        <SettingsPrivacySection profile={profile} onProfileChange={onProfileChange} />
      </DashboardSection>
      <DashboardSection
        title={t('settings.account.title')}
        description={t('settings.account.description')}
      >
        <SettingsAccountSection profile={profile} />
      </DashboardSection>
    </div>
  );
}

function SettingsSectionPanel({ section }: { section: SettingsSectionId }) {
  const { t } = useTranslations();

  switch (section) {
    case 'appearance':
      return (
        <DashboardSection
          title={t('settings.appearance.sectionTitle')}
          description={t('settings.appearance.sectionDescription')}
        >
          <SettingsAppearanceSection />
        </DashboardSection>
      );
    case 'payments':
      return (
        <DashboardSection
          title={t('settings.payments.sectionTitle')}
          description={t('settings.payments.sectionDescription')}
        >
          <SettingsPaymentsSection />
        </DashboardSection>
      );
    case 'delivery':
      return (
        <DashboardSection
          title={t('settings.delivery.sectionTitle')}
          description={t('settings.delivery.sectionDescription')}
          className="rounded-xl"
        >
          <SettingsDeliverySection />
        </DashboardSection>
      );
    default:
      return null;
  }
}

export function SettingsView() {
  const searchParams = useSearchParams();
  const section = parseSettingsSection(searchParams.get('section'));
  const { t } = useTranslations();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const needsProfile = section === 'basics';

  const load = useCallback(async () => {
    if (!needsProfile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyProfile();
      if (!data) {
        setError(t('settings.noProfile'));
        setProfile(null);
        return;
      }
      setProfile(data);
    } catch (err) {
      setError(
        err instanceof ApiException ? err.message : t('settings.loadFailed'),
      );
    } finally {
      setLoading(false);
    }
  }, [needsProfile, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const header = (
    <header className="min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {t(`settings.${section}.pageTitle`)}
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
        {t(`settings.${section}.pageDescription`)}
      </p>
    </header>
  );

  if (loading && needsProfile && !profile) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-5 sm:gap-6">
        <SettingsNavMobile />
        {header}
        <SettingsSkeleton />
      </div>
    );
  }

  if (needsProfile && (error || !profile)) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-5 sm:gap-6">
        <SettingsNavMobile />
        {header}
        <DashboardErrorState
          variant="inline"
          message={error ?? t('settings.noData')}
          onRetry={() => void load()}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 sm:gap-6">
      <SettingsNavMobile />
      {header}
      {needsProfile && profile ? (
        <SettingsBasicsContent profile={profile} onProfileChange={setProfile} />
      ) : (
        <SettingsSectionPanel section={section} />
      )}
    </div>
  );
}
