import { Link2 } from 'lucide-react';
import {
  SettingsPanel,
  SettingsRow,
  SettingsRowDivider,
} from '@/components/settings/settings-primitives';
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
    <SettingsPanel
      title="الروابط العامة"
      description="صيغة الروابط التي يشاركها المستجيبون خارج لوحة التحكم."
    >
      <SettingsRow
        isStatic
        icon={Link2}
        title="رابط نموذج منشور"
        subtitle={
          <span dir="ltr" lang="en" className="font-medium text-[var(--foreground)]">
            {base}/f/{exampleSlug}
          </span>
        }
      />
      {username ? (
        <>
          <SettingsRowDivider />
          <SettingsRow
            isStatic
            icon={Link2}
            title="صفحة نماذجك العامة"
            subtitle={
              <span dir="ltr" lang="en" className="font-medium text-[var(--foreground)]">
                {base}/{username}
              </span>
            }
          />
        </>
      ) : null}
    </SettingsPanel>
  );
}
