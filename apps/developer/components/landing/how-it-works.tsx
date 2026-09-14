type LandingLocale = 'ar' | 'en';

const COPY = {
  ar: {
    eyebrow: 'How it works',
    title: 'من التسجيل إلى الإنتاج',
    steps: [
      {
        n: '01',
        title: 'أنشئ تطبيقاً',
        desc: 'كل المفاتيح والنطاقات والفوترة مرتبطة بتطبيقك.',
      },
      {
        n: '02',
        title: 'فعّل المنتج',
        desc: 'اربط WhatsApp أو أضف نطاقاً لـ Email أو انشر نموذجاً.',
      },
      {
        n: '03',
        title: 'أرسل عبر API',
        desc: 'استخدم المفتاح في الخادم، راقب السجلات، واستقبل الـ webhooks.',
      },
    ],
  },
  en: {
    eyebrow: 'How it works',
    title: 'From signup to production',
    steps: [
      {
        n: '01',
        title: 'Create an app',
        desc: 'Keys, domains, and billing stay scoped to your application.',
      },
      {
        n: '02',
        title: 'Enable a product',
        desc: 'Connect WhatsApp, verify an Email domain, or publish a form.',
      },
      {
        n: '03',
        title: 'Call the API',
        desc: 'Use your key server-side, watch logs, and receive webhooks.',
      },
    ],
  },
} as const;

export function HowItWorks({ locale = 'ar' }: { locale?: LandingLocale }) {
  const t = COPY[locale];

  return (
    <section className="border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-16 min-[720px]:px-8 min-[720px]:py-20">
        <p className="eyebrow-label">{t.eyebrow}</p>
        <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-[var(--foreground)] min-[720px]:text-3xl">
          {t.title}
        </h2>
        <ol className="mt-10 grid gap-6 min-[720px]:grid-cols-3">
          {t.steps.map((step) => (
            <li key={step.n} className="border-t border-[var(--border)] pt-5">
              <p className="font-mono text-xs font-semibold text-[var(--primary)]">
                {step.n}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-[var(--foreground)]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
