import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  User,
  UserCircle,
} from 'lucide-react';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { ACCOUNTS_URL } from '@/lib/config';

const ACCOUNTS_BASE = ACCOUNTS_URL.replace(/\/$/, '');

const ACCOUNT_LINKS = [
  {
    href: `${ACCOUNTS_BASE}/manage`,
    icon: UserCircle,
    title: 'نظرة عامة',
    description: 'لوحة إدارة حسابك على Rukny.',
  },
  {
    href: `${ACCOUNTS_BASE}/manage/personal-info`,
    icon: User,
    title: 'المعلومات الشخصية',
    description: 'الصورة، الاسم، البريد، ورقم الهاتف.',
  },
  {
    href: `${ACCOUNTS_BASE}/manage/security`,
    icon: ShieldCheck,
    title: 'الأمان',
    description: 'كلمة المرور، 2FA، الجلسات، وطرق الدخول.',
  },
  {
    href: `${ACCOUNTS_BASE}/manage/verified`,
    icon: BadgeCheck,
    title: 'Rukny Verified',
    description: 'التحقق الرسمي من الهوية.',
  },
  {
    href: `${ACCOUNTS_BASE}/manage/billing`,
    icon: CreditCard,
    title: 'الخطة والاشتراك',
    description: 'الفوترة واستخدام الخطة.',
  },
] as const;

export function SettingsAccountSection() {
  return (
    <SettingsSectionCard
      icon={UserCircle}
      title="حساب Rukny"
      description="إعدادات الحساب المشتركة — الصورة، الأمان، والاشتراك — تُدار من تطبيق الحسابات."
    >
      <div className="space-y-3">
        <a
          href={`${ACCOUNTS_BASE}/manage`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-2xl bg-[var(--primary)] px-4 py-3.5 text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <UserCircle className="size-5" strokeWidth={1.7} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">فتح إعدادات الحساب</p>
            <p className="mt-0.5 text-[12px] opacity-80">
              إدارة حسابك الكامل في تطبيق الحسابات
            </p>
          </div>
          <ExternalLink className="size-4 shrink-0 opacity-80" aria-hidden />
        </a>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
          {ACCOUNT_LINKS.slice(1).map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/40 px-3.5 py-3 transition-colors hover:bg-[var(--surface-secondary)]"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)] ring-1 ring-[var(--border)]/40">
                  <Icon className="size-4" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                </div>
                <ArrowLeft
                  className="size-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:-translate-x-0.5"
                  aria-hidden
                />
              </a>
            );
          })}
        </div>
      </div>
    </SettingsSectionCard>
  );
}
