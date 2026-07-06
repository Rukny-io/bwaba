import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function SettingsPageShell({
  children,
  backLabel,
  isRtl,
}: {
  children: ReactNode;
  backLabel: string;
  isRtl: boolean;
}) {
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/apps"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <BackArrow className="size-4" />
            {backLabel}
          </Link>
          <Link href="/apps" className="flex items-center gap-2">
            <Image
              src="/rukny-logo.svg"
              alt="Rukny"
              width={28}
              height={28}
              className="dark:brightness-0 dark:invert"
            />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
