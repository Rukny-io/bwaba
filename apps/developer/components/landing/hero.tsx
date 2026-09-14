import Link from 'next/link';

type LandingLocale = 'ar' | 'en';

const COPY = {
  ar: {
    brand: 'Rukny',
    headline: 'منصة مطوّرين للإرسال والنماذج عبر واجهات برمجة واضحة',
    support:
      'WhatsApp API وEmail API وForms — مفاتيح، محفظة، وتوثيق في بوابة واحدة.',
    start: 'ابدأ البناء',
    docs: 'التوثيق',
  },
  en: {
    brand: 'Rukny',
    headline: 'Developer APIs for messaging and forms — clear and production-ready',
    support:
      'WhatsApp API, Email API, and Forms — keys, wallet, and docs in one portal.',
    start: 'Start building',
    docs: 'Documentation',
  },
} as const;

export function LandingHero({ locale = 'ar' }: { locale?: LandingLocale }) {
  const t = COPY[locale];

  return (
    <section className="relative overflow-hidden border-b border-[var(--border)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_color-mix(in_srgb,var(--primary)_14%,transparent),_transparent_55%),linear-gradient(180deg,var(--surface-secondary)_0%,var(--background)_70%)]"
      />
      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-5 py-16 min-[720px]:px-8 min-[720px]:py-24">
        <p className="text-4xl font-semibold tracking-tight text-[var(--foreground)] min-[720px]:text-6xl">
          {t.brand}
        </p>
        <div className="max-w-2xl">
          <h1 className="text-xl font-medium leading-snug tracking-tight text-[var(--foreground)] min-[720px]:text-3xl min-[720px]:leading-tight">
            {t.headline}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted-foreground)] min-[720px]:text-base">
            {t.support}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login?next=/apps"
              className="inline-flex h-11 items-center bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--brand-blue-hover)]"
            >
              {t.start}
            </Link>
            <Link
              href="/documentation"
              className="inline-flex h-11 items-center border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
            >
              {t.docs}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
