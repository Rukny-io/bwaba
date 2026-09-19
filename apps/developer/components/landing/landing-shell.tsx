import Image from 'next/image';
import Link from 'next/link';

type LandingLocale = 'ar' | 'en';

const COPY = {
  ar: {
    announcement: 'Email API وForms متاحة الآن في بوابة المطوّرين',
    docs: 'التوثيق',
    pricing: 'الأسعار',
    login: 'تسجيل الدخول',
    start: 'ابدأ البناء',
    footerBrand: 'بوابة المطوّرين',
    products: 'المنتجات',
    resources: 'الموارد',
    company: 'الشركة',
    whatsapp: 'WhatsApp API',
    email: 'Email API',
    forms: 'Forms',
    getStarted: 'البدء',
    contact: 'تواصل',
  },
  en: {
    announcement: 'Email API and Forms are live in the developer portal',
    docs: 'Docs',
    pricing: 'Pricing',
    login: 'Sign in',
    start: 'Start Building',
    footerBrand: 'Developer portal',
    products: 'Products',
    resources: 'Resources',
    company: 'Company',
    whatsapp: 'WhatsApp API',
    email: 'Email API',
    forms: 'Forms',
    getStarted: 'Get started',
    contact: 'Contact',
  },
} as const;

export function LandingAnnouncement({ locale = 'ar' }: { locale?: LandingLocale }) {
  const t = COPY[locale];

  return (
    <div className="border-b border-[var(--border)] bg-[var(--primary)] text-[var(--primary-foreground)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-5 py-2.5 text-center text-xs font-medium tracking-wide sm:px-6">
        {t.announcement}
      </div>
    </div>
  );
}

export function LandingHeader({ locale = 'ar' }: { locale?: LandingLocale }) {
  const t = COPY[locale];

  return (
    <header className="sticky top-0 z-40 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[var(--background)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-5 sm:h-[3.75rem] sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/rukny-logo.svg"
            alt="Rukny"
            width={28}
            height={28}
            className="size-7 shrink-0 dark:brightness-0 dark:invert"
          />
          <span className="truncate text-sm font-medium tracking-tight text-[var(--foreground)]/90 sm:text-base">
            Rukny
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1">
          <Link
            href="/documentation"
            className="hidden h-9 items-center px-3 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] sm:inline-flex"
          >
            {t.docs}
          </Link>
          <Link
            href="/pricing"
            className="hidden h-9 items-center px-3 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] sm:inline-flex"
          >
            {t.pricing}
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center px-3 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            {t.login}
          </Link>
          <Link
            href="/login?next=/apps"
            className="ms-1 inline-flex h-9 items-center rounded-full bg-[var(--primary)] px-3.5 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--brand-blue-hover)]"
          >
            {t.start}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function LandingFooter({ locale = 'ar' }: { locale?: LandingLocale }) {
  const t = COPY[locale];

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-6 min-[720px]:grid-cols-4">
        <div className="min-[720px]:col-span-1">
          <div className="flex items-center gap-2.5">
            <Image
              src="/rukny-logo.svg"
              alt="Rukny"
              width={28}
              height={28}
              className="dark:brightness-0 dark:invert"
            />
            <span className="text-[15px] font-semibold">Rukny</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--muted-foreground)]">
            {t.footerBrand}
          </p>
        </div>
        <div>
          <p className="eyebrow-label mb-4">{t.products}</p>
          <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
            <li>
              <Link href="/documentation" className="hover:text-[var(--foreground)]">
                {t.whatsapp}
              </Link>
            </li>
            <li>
              <Link
                href="/documentation/email-api"
                className="hover:text-[var(--foreground)]"
              >
                {t.email}
              </Link>
            </li>
            <li>
              <Link href="/documentation/forms" className="hover:text-[var(--foreground)]">
                {t.forms}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow-label mb-4">{t.resources}</p>
          <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
            <li>
              <Link href="/documentation" className="hover:text-[var(--foreground)]">
                {t.docs}
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-[var(--foreground)]">
                {t.pricing}
              </Link>
            </li>
            <li>
              <Link href="/login?next=/apps" className="hover:text-[var(--foreground)]">
                {t.getStarted}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow-label mb-4">{t.company}</p>
          <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
            <li>
              <Link href="/login" className="hover:text-[var(--foreground)]">
                {t.login}
              </Link>
            </li>
            <li>
              <a
                href="mailto:developers@rukny.io"
                className="hover:text-[var(--foreground)]"
              >
                {t.contact}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--border)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 text-sm text-[var(--muted-foreground)] sm:px-6">
          <p>
            © {new Date().getFullYear()} Rukny — {t.footerBrand}
          </p>
        </div>
      </div>
    </footer>
  );
}
