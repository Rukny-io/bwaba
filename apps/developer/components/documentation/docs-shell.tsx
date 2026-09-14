import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { DOCUMENTATION_BASE } from '@/lib/documentation-nav';

export function DocumentationHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex h-[73px] w-full max-w-[1280px] items-center justify-between gap-4 px-5 min-[720px]:px-8">
        <div className="flex min-w-0 items-center gap-3.5">
          <Link
            href={DOCUMENTATION_BASE}
            className="flex min-w-0 items-center gap-2.5"
          >
            <Image
              src="/rukny-logo.svg"
              alt="Rukny"
              width={26}
              height={26}
              className="shrink-0 dark:brightness-0 dark:invert"
            />
            <span className="truncate text-sm font-semibold tracking-tight">
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
            className="inline-flex h-9 items-center bg-[var(--primary)] px-3 text-[13px] font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--brand-blue-hover)]"
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
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-5 py-8 text-[13px] text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between min-[720px]:px-8">
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
