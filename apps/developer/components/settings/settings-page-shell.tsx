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
    <div className="flex min-h-dvh flex-col bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)]/70 bg-[var(--background)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-5 md:px-6">
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
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-5 sm:pt-8 sm:pb-6 md:px-6 pb-24">
          {children}
        </div>
      </main>
    </div>
  );
}
