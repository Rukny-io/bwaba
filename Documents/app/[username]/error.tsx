'use client';

import Link from 'next/link';

export default function ProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="max-w-sm text-center">
        <h1 className="text-lg font-bold text-[var(--foreground)]">تعذر تحميل الصفحة</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          حدث خطأ أثناء عرض الملف الشخصي. جرّب مرة أخرى.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-white"
          >
            إعادة المحاولة
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-full border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)]"
          >
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
