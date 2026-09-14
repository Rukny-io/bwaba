import Link from 'next/link';

type LandingLocale = 'ar' | 'en';

const COPY = {
  ar: {
    eyebrow: 'Products',
    title: 'قدرات جاهزة للإنتاج',
    bands: [
      {
        title: 'WhatsApp API',
        desc: 'Embedded Signup، قوالب، محفظة IQD، وwebhooks للتسليم والوارد.',
        href: '/documentation',
        cta: 'التوثيق',
      },
      {
        title: 'Email API',
        desc: 'نطاقات موثّقة، رسائل معاملاتية، وSDK جاهز للخادم.',
        href: '/documentation/email-api',
        cta: 'Email API',
      },
      {
        title: 'Forms',
        desc: 'نماذج قابلة للتضمين مع أحداث وwebhooks وربط بالتطبيق.',
        href: '/documentation/forms',
        cta: 'Forms',
      },
    ],
  },
  en: {
    eyebrow: 'Products',
    title: 'Production-ready capabilities',
    bands: [
      {
        title: 'WhatsApp API',
        desc: 'Embedded Signup, templates, IQD wallet, and delivery webhooks.',
        href: '/documentation',
        cta: 'Docs',
      },
      {
        title: 'Email API',
        desc: 'Verified domains, transactional mail, and a server SDK.',
        href: '/documentation/email-api',
        cta: 'Email API',
      },
      {
        title: 'Forms',
        desc: 'Embeddable forms with events, webhooks, and app linking.',
        href: '/documentation/forms',
        cta: 'Forms',
      },
    ],
  },
} as const;

export function CapabilityBands({ locale = 'ar' }: { locale?: LandingLocale }) {
  const t = COPY[locale];

  return (
    <section className="border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-16 min-[720px]:px-8 min-[720px]:py-20">
        <p className="eyebrow-label">{t.eyebrow}</p>
        <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-[var(--foreground)] min-[720px]:text-3xl">
          {t.title}
        </h2>
        <div className="mt-10 divide-y divide-[var(--border)] border border-[var(--border)]">
          {t.bands.map((band) => (
            <article
              key={band.title}
              className="grid gap-4 px-5 py-8 min-[720px]:grid-cols-[1fr_auto] min-[720px]:items-center min-[720px]:px-8"
            >
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  {band.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {band.desc}
                </p>
              </div>
              <Link
                href={band.href}
                className="inline-flex h-10 w-fit items-center border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
              >
                {band.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
