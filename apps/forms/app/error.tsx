'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[forms] route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
        حدث خطأ غير متوقع
      </h1>
      <p className="mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
        تعذّر تحميل هذه الصفحة. جرّب إعادة المحاولة أو ارجع للوحة التحكم.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-[var(--background)]"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/app"
          className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)]"
        >
          لوحة التحكم
        </Link>
      </div>
    </div>
  );
}
