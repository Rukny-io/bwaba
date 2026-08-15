import Link from 'next/link';
import { DashboardPageHeader, DashboardSurface } from '@/components/app/dashboard-primitives';

export default function SettingsPage() {
  return (
    <div className="dashboard-section-stack">
      <DashboardPageHeader
        title="الإعدادات"
        description="إعدادات Business Hub — المزيد قريباً."
      />

      <DashboardSurface className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">الحساب والجلسة</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          إدارة الحساب تتم عبر ركني Accounts. يمكنك تسجيل الخروج من جميع الأجهزة من هناك.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex h-10 items-center rounded-full border border-[var(--border)] px-4 text-sm font-semibold transition-colors hover:bg-[var(--surface-secondary)]"
        >
          الذهاب لتسجيل الدخول
        </Link>
      </DashboardSurface>
    </div>
  );
}
