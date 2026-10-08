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
import {
  getSettingsSectionMeta,
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
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <DashboardSection
        title="الملف الشخصي"
        description="الاسم، الرابط، والصورة الظاهرة للزوار."
      >
        <SettingsProfileSection profile={profile} onProfileChange={onProfileChange} />
      </DashboardSection>
      <DashboardSection title="الخصوصية" description="ظهور الصفحة ومعلومات الاتصال.">
        <SettingsPrivacySection profile={profile} onProfileChange={onProfileChange} />
      </DashboardSection>
      <DashboardSection title="الحساب والأمان" description="البريد والهاتف وإدارة تسجيل الدخول.">
        <SettingsAccountSection profile={profile} />
      </DashboardSection>
    </div>
  );
}

function SettingsAppearancePanel({
  profile,
  onProfileChange,
}: {
  profile: MyProfile;
  onProfileChange: (profile: MyProfile) => void;
}) {
  return (
    <DashboardSection title="المظهر واللغة" description="ثيم الصفحة العامة ولغة الواجهة.">
      <SettingsAppearanceSection profile={profile} onProfileChange={onProfileChange} />
    </DashboardSection>
  );
}

function SettingsSectionPanel({ section }: { section: SettingsSectionId }) {
  switch (section) {
    case 'payments':
      return (
        <DashboardSection title="الدفع الإلكتروني" description="بوابات الدفع وإعدادات التحصيل.">
          <SettingsPaymentsSection />
        </DashboardSection>
      );
    case 'delivery':
      return (
        <DashboardSection title="شركات التوصيل" description="الشحن وخيارات التسليم.">
          <SettingsDeliverySection />
        </DashboardSection>
      );
    default:
      return null;
  }
}

function SettingsSectionContent({
  section,
  profile,
  onProfileChange,
}: {
  section: SettingsSectionId;
  profile: MyProfile;
  onProfileChange: (profile: MyProfile) => void;
}) {
  if (section === 'basics') {
    return <SettingsBasicsContent profile={profile} onProfileChange={onProfileChange} />;
  }
  if (section === 'appearance') {
    return (
      <SettingsAppearancePanel profile={profile} onProfileChange={onProfileChange} />
    );
  }
  return <SettingsSectionPanel section={section} />;
}

export function SettingsView() {
  const searchParams = useSearchParams();
  const section = parseSettingsSection(searchParams.get('section'));
  const sectionMeta = getSettingsSectionMeta(section);

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const needsProfile = section === 'basics' || section === 'appearance';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyProfile();
      if (!data) {
        setError('لم يتم العثور على ملف شخصي. أكمل إعداد حسابك من ركني.');
        setProfile(null);
        return;
      }
      setProfile(data);
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const header = (
    <header className="min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {sectionMeta.pageTitle}
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
        {sectionMeta.pageDescription}
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
          message={error ?? 'لا توجد بيانات'}
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
        <SettingsSectionContent
          section={section}
          profile={profile}
          onProfileChange={setProfile}
        />
      ) : (
        <SettingsSectionPanel section={section} />
      )}
    </div>
  );
}
