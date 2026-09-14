type LandingLocale = 'ar' | 'en';

const COPY = {
  ar: {
    eyebrow: 'Console',
    title: 'كل منتج في تطبيق واحد',
    support: 'إدارة المفاتيح، النطاقات، الرسائل، والنماذج من لوحة المطوّرين.',
    apps: 'التطبيقات',
    keys: 'مفاتيح API',
    email: 'Email API',
    forms: 'Forms',
    status: 'نشط',
  },
  en: {
    eyebrow: 'Console',
    title: 'Every product in one app',
    support: 'Manage keys, domains, messages, and forms from the developer console.',
    apps: 'Apps',
    keys: 'API keys',
    email: 'Email API',
    forms: 'Forms',
    status: 'Active',
  },
} as const;

export function ProductConsoleMock({ locale = 'ar' }: { locale?: LandingLocale }) {
  const t = COPY[locale];

  return (
    <section className="border-b border-[var(--border)] bg-[var(--surface-secondary)]">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-16 min-[720px]:px-8 min-[720px]:py-20">
        <div className="max-w-xl">
          <p className="eyebrow-label">{t.eyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)] min-[720px]:text-3xl">
            {t.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            {t.support}
          </p>
        </div>

        <div
          dir="ltr"
          className="mt-10 overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)]"
        >
          <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3">
            <span className="size-2.5 rounded-full bg-[#ef4444]" />
            <span className="size-2.5 rounded-full bg-[#f59e0b]" />
            <span className="size-2.5 rounded-full bg-[#10b981]" />
            <span className="ms-3 text-xs text-[var(--muted-foreground)]">
              developers.rukny.io
            </span>
          </div>
          <div className="grid min-[720px]:grid-cols-[200px_1fr]">
            <aside className="border-b border-[var(--border)] p-4 text-sm min-[720px]:border-b-0 min-[720px]:border-e">
              <p className="text-xs font-semibold text-[var(--muted-foreground)]">
                {t.apps}
              </p>
              <ul className="mt-3 space-y-2 text-[var(--foreground)]">
                <li className="bg-[var(--surface-secondary)] px-3 py-2 font-medium">
                  Acme Store
                </li>
                <li className="px-3 py-2 text-[var(--muted-foreground)]">Ops Bot</li>
              </ul>
            </aside>
            <div className="p-4 min-[720px]:p-6">
              <div className="flex flex-wrap gap-2">
                {[t.keys, t.email, t.forms].map((label) => (
                  <span
                    key={label}
                    className="border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { label: t.keys, value: '3' },
                  { label: t.email, value: t.status },
                  { label: t.forms, value: '2' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="border border-[var(--border)] bg-[var(--background)] p-4"
                  >
                    <p className="text-xs text-[var(--muted-foreground)]">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
