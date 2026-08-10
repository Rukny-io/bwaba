'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AuthShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthShell({ children, className = '' }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--background)] font-sans text-[var(--foreground)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--border) 70%, transparent) 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[var(--surface-secondary)]/60 via-[var(--surface-secondary)]/20 to-transparent"
        aria-hidden
      />

      <header className="relative z-10 px-4 pt-4 md:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5 md:px-6">
          <Link
            href="/login"
            className="text-base font-semibold tracking-tight text-[var(--foreground)] transition-opacity hover:opacity-80 md:text-lg"
          >
            ركني — نماذج
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:py-12">
        <div className={cn('flex w-full max-w-[420px] flex-col items-center', className)}>
          {children}
        </div>
      </main>
    </div>
  );
}
