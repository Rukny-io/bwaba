'use client';

import { Mail, MessageCircle } from 'lucide-react';
import { HelpLinkChip } from '@/components/help/help-link';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { HELP_CONTACT } from '@/lib/help/help-content';
import { APP_BASE } from '@/components/app/nav-config';
import { ACCOUNTS_URL } from '@/lib/config';

export function HelpContactCard() {
  const mailto = `mailto:${HELP_CONTACT.email}?subject=${encodeURIComponent(HELP_CONTACT.emailSubject)}`;

  return (
    <SettingsSectionCard
      icon={MessageCircle}
      title="تواصل مع الدعم"
      description="لم تجد إجابتك؟ فريقنا جاهز للمساعدة."
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
              <Mail className="size-4 text-[var(--muted-foreground)]" />
              {HELP_CONTACT.email}
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
              {HELP_CONTACT.responseHint}
            </p>
          </div>

          <a
            href={mailto}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
          >
            <Mail className="size-4" />
            راسلنا
          </a>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-[var(--border)]/60 pt-4">
          <HelpLinkChip href={`${APP_BASE}/settings`} label="إعدادات Forms" />
          <HelpLinkChip href={`${ACCOUNTS_URL}/manage`} label="حساب Rukny" external />
          <HelpLinkChip href={HELP_CONTACT.docsUrl} label="rukny.io" external />
        </div>
      </div>
    </SettingsSectionCard>
  );
}
