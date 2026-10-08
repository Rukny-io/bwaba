'use client';

import { useEffect, useState } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('rukny-app-locale');
      setLocale(stored === 'en' ? 'en' : 'ar');
    } catch {
      /* keep ar */
    }
  }, []);

  const english = locale === 'en';
  const direction = english ? 'ltr' : 'rtl';

  return (
    <html lang={locale} dir={direction}>
      <body className="flex min-h-dvh items-center justify-center bg-[#fafbfc] px-4 font-sans text-[#0f172a]">
        <div className="max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold">
            {english ? 'Unexpected error' : 'حدث خطأ غير متوقع'}
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">
            {error.message ||
              (english
                ? 'Could not load the page. Please try again.'
                : 'تعذر تحميل الصفحة. أعد المحاولة.')}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-4 rounded-full bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white"
          >
            {english ? 'Try again' : 'إعادة المحاولة'}
          </button>
        </div>
      </body>
    </html>
  );
}
