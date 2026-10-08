'use client';

import { ExternalLink, ShieldCheck } from 'lucide-react';
import { resolveAccountsUrl } from '@rukny/auth/client/env-urls';
import type { MyProfile } from '@/lib/profile/types';
import { cn } from '@/lib/utils';

interface SettingsAccountSectionProps {
  profile: MyProfile;
}

function accountsManageUrl(): string {
  const base = resolveAccountsUrl().replace(/\/$/, '');
  return base;
}

export function SettingsAccountSection({ profile }: SettingsAccountSectionProps) {
  const email = profile.user?.email?.trim() || '—';
  const phone = profile.user?.phone?.trim() || '—';
  const twoFactor = profile.user?.twoFactorEnabled;

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[var(--surface-secondary)]/60 px-4 py-3">
          <dt className="text-[12px] text-[var(--muted-foreground)]">البريد</dt>
          <dd className="mt-1 truncate text-[13px] font-medium text-[var(--foreground)]" dir="ltr">
            {email}
          </dd>
        </div>
        <div className="rounded-xl bg-[var(--surface-secondary)]/60 px-4 py-3">
          <dt className="text-[12px] text-[var(--muted-foreground)]">الهاتف</dt>
          <dd className="mt-1 truncate text-[13px] font-medium text-[var(--foreground)]" dir="ltr">
            {phone}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium',
            twoFactor
              ? 'bg-[color-mix(in_oklab,var(--success)_14%,transparent)] text-[var(--success)]'
              : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
          )}
        >
          <ShieldCheck className="size-3.5" strokeWidth={1.75} aria-hidden />
          {twoFactor ? 'المصادقة الثنائية مفعّلة' : 'المصادقة الثنائية غير مفعّلة'}
        </span>
        {profile.isRuknyVerified ? (
          <span className="rounded-full bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] px-2.5 py-1 text-[12px] font-medium text-[var(--primary)]">
            حساب موثّق
          </span>
        ) : null}
      </div>

      <p className="text-[12px] leading-relaxed text-[var(--muted-foreground)]">
        لتغيير كلمة المرور، ربط Google، أو إدارة الجلسات، استخدم بوابة حساب ركني.
      </p>

      <a
        href={accountsManageUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--foreground)] px-4 py-2 text-[13px] font-medium text-[var(--background)] transition-opacity hover:opacity-90"
      >
        فتح إدارة الحساب
        <ExternalLink className="size-3.5" strokeWidth={1.75} aria-hidden />
      </a>
    </div>
  );
}
