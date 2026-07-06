import { Link2 } from 'lucide-react';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { PUBLIC_SITE_URL } from '@/lib/config';

interface SettingsPublicLinksSectionProps {
  username?: string | null;
}

export function SettingsPublicLinksSection({
  username,
}: SettingsPublicLinksSectionProps) {
  const base = PUBLIC_SITE_URL.replace(/\/$/, '');
  const exampleSlug = 'abc123';

  return (
    <SettingsSectionCard
      icon={Link2}
      title="روابط النماذج العامة"
      description="صيغة الروابط التي يشاركها المستجيبون — خارج لوحة Forms."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-secondary)]/40 px-4 py-3.5">
          <p className="text-[13px] text-[var(--muted-foreground)]">
            رابط نموذج منشور
          </p>
          <p
            className="mt-1 break-all text-sm font-medium text-[var(--foreground)]"
            dir="ltr"
            lang="en"
          >
            {base}/f/{exampleSlug}
          </p>
        </div>

        {username ? (
          <div className="rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-secondary)]/40 px-4 py-3.5">
            <p className="text-[13px] text-[var(--muted-foreground)]">
              صفحة نماذجك العامة
            </p>
            <p
              className="mt-1 break-all text-sm font-medium text-[var(--foreground)]"
              dir="ltr"
              lang="en"
            >
              {base}/@{username}
            </p>
          </div>
        ) : null}

        <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          slug كل نموذج يظهر في صفحة تفاصيل النموذج. إعدادات النشر والتنبيهات
          تُدار من هناك وليس من هذه الصفحة.
        </p>
      </div>
    </SettingsSectionCard>
  );
}
