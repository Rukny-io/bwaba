'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[forms/dashboard] route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl bg-[var(--surface-secondary)]/30 px-6 py-14 text-center">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        تعذّر تحميل هذا القسم
      </h2>
      <p className="mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">
        قد تكون المشكلة مؤقتة. أعد المحاولة أو انتقل لقسم آخر.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/app/forms"
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium"
        >
          النماذج
        </Link>
      </div>
    </div>
  );
}
