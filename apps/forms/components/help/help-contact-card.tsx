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
      <div className="space-y-4">
        <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-secondary)]/30 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
              <span className="flex size-8 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)] ring-1 ring-[var(--border)]/40">
                <Mail className="size-3.5" strokeWidth={1.85} />
              </span>
              {HELP_CONTACT.email}
            </p>
            <p className="text-[12px] leading-relaxed text-[var(--muted-foreground)] sm:text-[13px]">
              {HELP_CONTACT.responseHint}
            </p>
          </div>

          <a
            href={mailto}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            <Mail className="size-4" />
            راسلنا
          </a>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-[var(--border)]/60 pt-4">
          <HelpLinkChip href={`${APP_BASE}/settings`} label="إعدادات Forms" />
          <HelpLinkChip
            href={`${ACCOUNTS_URL}/manage`}
            label="حساب Rukny"
            external
          />
          <HelpLinkChip
            href={HELP_CONTACT.docsUrl}
            label="rukny.io"
            external
          />
        </div>
      </div>
    </SettingsSectionCard>
  );
}
