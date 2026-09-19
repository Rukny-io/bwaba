import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { DOCUMENTATION_BASE } from '@/lib/documentation-nav';

export function DocumentationHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[var(--background)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 px-5 sm:h-[3.75rem] sm:px-6 lg:max-w-6xl">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
          <Link
            href={DOCUMENTATION_BASE}
            className="flex min-w-0 items-center gap-2 sm:gap-2.5"
          >
            <Image
              src="/rukny-logo.svg"
              alt="Rukny"
              width={28}
              height={28}
              className="size-7 shrink-0 dark:brightness-0 dark:invert"
            />
            <span className="truncate text-sm font-medium tracking-tight text-[var(--foreground)]/90 sm:text-base">
              Rukny Docs
            </span>
          </Link>
          <span className="hidden text-[13px] text-[var(--muted-foreground)] sm:inline">
            /
          </span>
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href={`${DOCUMENTATION_BASE}/email-api`}
              className="text-[13px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
            >
              Email API
            </Link>
            <Link
              href={`${DOCUMENTATION_BASE}/forms`}
              className="text-[13px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
            >
              Forms
            </Link>
          </div>
        </div>
        <nav className="flex shrink-0 items-center gap-1.5">
          <Link
            href="/pricing"
            className="hidden h-9 items-center px-2.5 text-[13px] font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] sm:inline-flex"
          >
            Pricing
          </Link>
          <Link
            href="/login?next=/apps"
            className="inline-flex h-8 items-center rounded-full bg-[var(--primary)] px-3 text-[12.5px] font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--brand-blue-hover)] sm:h-9 sm:text-[13px]"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function DocumentationFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)]">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 py-8 text-[13px] text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:max-w-6xl">
        <p>© {new Date().getFullYear()} Rukny</p>
        <div className="flex flex-wrap gap-4">
          <Link
            href={DOCUMENTATION_BASE}
            className="transition-colors hover:text-[var(--foreground)]"
          >
            Docs
          </Link>
          <Link
            href={`${DOCUMENTATION_BASE}/email-api`}
            className="transition-colors hover:text-[var(--foreground)]"
          >
            Email API
          </Link>
          <Link
            href={`${DOCUMENTATION_BASE}/forms`}
            className="transition-colors hover:text-[var(--foreground)]"
          >
            Forms
          </Link>
          <Link
            href="/pricing"
            className="transition-colors hover:text-[var(--foreground)]"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="transition-colors hover:text-[var(--foreground)]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function DocumentationShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]"
      dir="ltr"
      lang="en"
    >
      <DocumentationHeader />
      <div className="flex-1">{children}</div>
      <DocumentationFooter />
    </div>
  );
}
