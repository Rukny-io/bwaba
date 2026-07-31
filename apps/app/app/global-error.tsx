'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-dvh items-center justify-center bg-[#fafbfc] px-4 font-sans text-[#0f172a]">
        <div className="max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold">حدث خطأ غير متوقع</h1>
          <p className="mt-2 text-sm text-[#64748b]">
            {error.message || 'تعذر تحميل الصفحة. أعد المحاولة.'}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-4 rounded-full bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
