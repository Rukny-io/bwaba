import Link from 'next/link';

type LandingLocale = 'ar' | 'en';

const COPY = {
  ar: {
    title: 'جاهز للبناء؟',
    support: 'أنشئ تطبيقاً مجاناً وابدأ بإرسال الرسائل أو نشر النماذج.',
    start: 'ابدأ مجاناً',
    pricing: 'الأسعار',
  },
  en: {
    title: 'Ready to build?',
    support: 'Create a free app and start sending messages or publishing forms.',
    start: 'Start for free',
    pricing: 'Pricing',
  },
} as const;

export function FinalCta({ locale = 'ar' }: { locale?: LandingLocale }) {
  const t = COPY[locale];

  return (
    <section className="bg-[var(--primary)] text-[var(--primary-foreground)]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-5 py-16 min-[720px]:flex-row min-[720px]:items-end min-[720px]:justify-between min-[720px]:px-8 min-[720px]:py-20">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight min-[720px]:text-4xl">
            {t.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/85 min-[720px]:text-base">
            {t.support}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login?next=/apps"
            className="inline-flex h-11 items-center bg-[var(--foreground)] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t.start}
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center border border-white/40 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {t.pricing}
          </Link>
        </div>
      </div>
    </section>
  );
}
