type LandingLocale = 'ar' | 'en';

const COPY = {
  ar: {
    eyebrow: 'Quickstart',
    title: 'أرسل أول رسالة في دقائق',
    support: 'مفتاح API واحد وطلب HTTP — بدون SDK إلزامي.',
  },
  en: {
    eyebrow: 'Quickstart',
    title: 'Send your first message in minutes',
    support: 'One API key and an HTTP request — SDK optional.',
  },
} as const;

const SNIPPET = `curl -X POST https://api.rukny.io/v1/whatsapp/messages \\
  -H "X-API-Key: rk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+9647xxxxxxxxx",
    "type": "text",
    "text": { "body": "Hello from Rukny" }
  }'`;

export function QuickstartSnippet({ locale = 'ar' }: { locale?: LandingLocale }) {
  const t = COPY[locale];

  return (
    <section className="border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-5 py-16 min-[720px]:grid-cols-2 min-[720px]:items-center min-[720px]:px-8 min-[720px]:py-20">
        <div>
          <p className="eyebrow-label">{t.eyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)] min-[720px]:text-3xl">
            {t.title}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">
            {t.support}
          </p>
        </div>
        <pre
          dir="ltr"
          className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)] p-4 text-[12px] leading-relaxed text-[var(--foreground)] min-[720px]:p-5 min-[720px]:text-[13px]"
        >
          <code>{SNIPPET}</code>
        </pre>
      </div>
    </section>
  );
}
