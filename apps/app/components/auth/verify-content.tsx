'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, AlertCircle, Mail } from 'lucide-react';

const errorMessages: Record<string, { title: string; description: string; icon: typeof XCircle; color: string }> = {
  used: {
    title: 'رابط مستخدم مسبقاً',
    description: 'هذا الرابط تم استخدامه من قبل. يرجى طلب رابط جديد.',
    icon: XCircle,
    color: 'text-red-500',
  },
  expired: {
    title: 'رابط منتهي الصلاحية',
    description: 'انتهت صلاحية هذا الرابط. يرجى طلب رابط تحقق جديد.',
    icon: AlertCircle,
    color: 'text-amber-500',
  },
  invalid: {
    title: 'رابط غير صالح',
    description: 'هذا الرابط غير صالح أو تالف. يرجى التحقق من الرابط أو طلب رابط جديد.',
    icon: XCircle,
    color: 'text-red-500',
  },
};

export function VerifyContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  if (error) {
    const config = errorMessages[error] || {
      title: 'خطأ في التحقق',
      description: message || 'حدث خطأ أثناء التحقق من بريدك الإلكتروني.',
      icon: XCircle,
      color: 'text-red-500',
    };
    const Icon = config.icon;

    return (
      <div className="flex flex-col items-center gap-4 text-center py-2">
        <div className={`p-3 rounded-full bg-[var(--surface-secondary)] ${config.color}`}>
          <Icon className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{config.title}</h2>
          <p className="text-sm text-[var(--muted)]">{message || config.description}</p>
        </div>
        <div className="flex flex-col gap-2 w-full pt-2">
          <Link
            href="/login"
            className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent)] text-white text-sm font-medium text-center hover:opacity-90 transition-opacity"
          >
            العودة لتسجيل الدخول
          </Link>
          <Link
            href="/register"
            className="w-full py-2.5 px-4 rounded-xl border border-[var(--border)] text-[var(--foreground)] text-sm font-medium text-center hover:bg-[var(--surface-secondary)] transition-colors"
          >
            إنشاء حساب جديد
          </Link>
        </div>
      </div>
    );
  }

  // Success state (no error param)
  return (
    <div className="flex flex-col items-center gap-4 text-center py-2">
      <div className="p-3 rounded-full bg-[var(--surface-secondary)] text-green-500">
        <CheckCircle className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">تم التحقق بنجاح</h2>
        <p className="text-sm text-[var(--muted)]">تم التحقق من بريدك الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول.</p>
      </div>
      <Link
        href="/login"
        className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent)] text-white text-sm font-medium text-center hover:opacity-90 transition-opacity"
      >
        تسجيل الدخول
      </Link>
    </div>
  );
}
