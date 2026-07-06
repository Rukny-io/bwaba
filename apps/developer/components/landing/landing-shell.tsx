import Image from 'next/image';
import Link from 'next/link';

export function LandingHeader() {
  return (
    <header className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 px-5 py-4 min-[720px]:px-6 min-[720px]:py-5 min-[1280px]:px-0">
      <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <Image
          src="/rukny-logo.svg"
          alt="Rukny"
          width={36}
          height={36}
          className="shrink-0 dark:brightness-0 dark:invert"
        />
        <span className="truncate text-base font-semibold sm:text-lg">
          Rukny Developers
        </span>
      </Link>
      <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Link
          href="/pricing"
          className="touch-target inline-flex h-9 items-center justify-center rounded-full px-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] sm:px-4"
        >
          الأسعار
        </Link>
        <Link
          href="/login"
          className="touch-target inline-flex h-9 items-center justify-center rounded-full px-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] sm:px-4"
        >
          تسجيل الدخول
        </Link>
        <Link
          href="/login?next=/apps"
          className="touch-target inline-flex h-9 items-center justify-center rounded-full bg-[var(--primary)] px-3 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 sm:px-4"
        >
          ابدأ الآن
        </Link>
      </nav>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-[var(--muted-foreground)] min-[720px]:flex-row min-[720px]:px-6 min-[1280px]:px-0">
        <p>© {new Date().getFullYear()} Rukny — بوابة المطوّرين</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/pricing" className="transition-colors hover:text-[var(--foreground)]">
            الأسعار
          </Link>
          <Link href="/app/docs" className="transition-colors hover:text-[var(--foreground)]">
            التوثيق
          </Link>
          <Link href="/login" className="transition-colors hover:text-[var(--foreground)]">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </footer>
  );
}
