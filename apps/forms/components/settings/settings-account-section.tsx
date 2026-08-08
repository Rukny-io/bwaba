import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  User,
  UserCircle,
} from 'lucide-react';
import {
  SettingsPanel,
  SettingsRow,
  SettingsRowDivider,
} from '@/components/settings/settings-primitives';
import type { SettingsViewUser } from '@/components/settings/settings-types';
import { ACCOUNTS_URL } from '@/lib/config';
import { resolveAvatarUrl } from '@/lib/media-url';

const ACCOUNTS_BASE = ACCOUNTS_URL.replace(/\/$/, '');

const ACCOUNT_LINKS = [
  {
    href: `${ACCOUNTS_BASE}/manage/personal-info`,
    icon: User,
    title: 'المعلومات الشخصية',
    description: 'الصورة، الاسم، البريد، ورقم الهاتف.',
  },
  {
    href: `${ACCOUNTS_BASE}/manage/security`,
    icon: ShieldCheck,
    title: 'كلمة المرور والأمان',
    description: 'كلمة المرور، التحقق بخطوتين، والجلسات النشطة.',
  },
  {
    href: `${ACCOUNTS_BASE}/manage/verified`,
    icon: BadgeCheck,
    title: 'التحقق الرسمي',
    description: 'توثيق هويتك على منصة رُكنّي.',
  },
  {
    href: `${ACCOUNTS_BASE}/manage/billing`,
    icon: CreditCard,
    title: 'الخطة والاشتراك',
    description: 'الفوترة وحدود استخدامك الحالية.',
  },
] as const;

function AccountAvatar({
  user,
}: {
  user: SettingsViewUser;
}) {
  const displayName = user.name?.trim() || user.username?.trim() || 'م';
  const initials = displayName.charAt(0).toUpperCase();
  const src = resolveAvatarUrl(user.avatar);

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="size-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className="flex size-full items-center justify-center bg-[var(--surface-secondary)] text-sm font-semibold text-[var(--foreground)]">
      {initials}
    </span>
  );
}

interface SettingsAccountSectionProps {
  user: SettingsViewUser;
}

export function SettingsAccountSection({ user }: SettingsAccountSectionProps) {
  const displayName = user.name?.trim() || user.username || 'مستخدم';
  const handle = user.username ? `@${user.username}` : null;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SettingsPanel title="المعلومات الشخصية" description="بيانات حسابك الأساسية على رُكنّي.">
        <SettingsRow
          href={`${ACCOUNTS_BASE}/manage/personal-info`}
          leading={
            <span className="flex size-11 shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--border)]/80">
              <AccountAvatar user={user} />
            </span>
          }
          title={displayName}
          subtitle={
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>{user.email}</span>
              {handle ? (
                <>
                  <span aria-hidden className="text-[var(--border)]">
                    •
                  </span>
                  <span dir="ltr" lang="en" className="font-medium">
                    {handle}
                  </span>
                </>
              ) : null}
            </span>
          }
          trailing={
            <ExternalLink
              className="size-4 text-[var(--muted-foreground)]"
              strokeWidth={1.75}
              aria-hidden
            />
          }
        />
      </SettingsPanel>

      <SettingsPanel
        title="الحساب والأمان"
        description="إدارة تفاصيل الحساب المشتركة عبر تطبيقات رُكنّي."
      >
        <a
          href={`${ACCOUNTS_BASE}/manage`}
          target="_blank"
          rel="noopener noreferrer"
          className="settings-row group flex w-full items-center gap-3 border-b border-[var(--border)]/70 px-4 py-3.5 transition-colors hover:bg-[var(--surface-secondary)]/55 sm:gap-3.5 sm:px-5 sm:py-4"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)]">
            <UserCircle className="size-[18px]" strokeWidth={1.75} aria-hidden />
          </span>
          <span className="min-w-0 flex-1 text-start">
            <span className="block text-[14px] font-medium text-[var(--foreground)]">
              فتح لوحة الحساب
            </span>
            <span className="mt-1 block text-[13px] text-[var(--muted-foreground)]">
              إدارة كاملة للملف والأمان والاشتراك
            </span>
          </span>
          <ExternalLink
            className="size-4 shrink-0 text-[var(--muted-foreground)]"
            strokeWidth={1.75}
            aria-hidden
          />
        </a>

        {ACCOUNT_LINKS.map((item, index) => (
          <div key={item.href}>
            {index > 0 ? <SettingsRowDivider /> : null}
            <SettingsRow
              href={item.href}
              icon={item.icon}
              title={item.title}
              subtitle={item.description}
              trailing={
                <ArrowLeft
                  className="size-4 text-[var(--muted-foreground)] transition-transform group-hover:-translate-x-0.5"
                  strokeWidth={1.75}
                  aria-hidden
                />
              }
            />
          </div>
        ))}
      </SettingsPanel>
    </div>
  );
}
