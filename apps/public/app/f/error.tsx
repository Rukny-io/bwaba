'use client';

import { useEffect } from 'react';
import { PublicFormEmptyState } from '@/components/public-form/public-form-empty-state';

export default function PublicFormError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[public-form]', error);
  }, [error]);

  return (
    <div className="relative min-h-dvh">
      <PublicFormEmptyState
        title="تعذّر تحميل النموذج"
        description="حدث خطأ أثناء عرض النموذج. جرّب تحديث الصفحة أو عد لاحقاً."
        showHomeLink={false}
      />
      <div className="absolute inset-x-0 bottom-8 flex justify-center pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] shadow-sm transition-colors hover:bg-[var(--surface-secondary)]"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
