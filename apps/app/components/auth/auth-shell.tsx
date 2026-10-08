'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AuthShellProps {
  children: React.ReactNode;
  className?: string;
  showLogo?: boolean;
}

const PAGE_BACKGROUND_COLOR = '#ffffff';

export function AuthShell({
  children,
  className,
  showLogo = true,
}: AuthShellProps) {
  useEffect(() => {
    const themeMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    const prevThemeColor = themeMeta?.getAttribute('content') ?? null;
    if (themeMeta) {
      themeMeta.setAttribute('content', PAGE_BACKGROUND_COLOR);
    }

    return () => {
      if (themeMeta && prevThemeColor) {
        themeMeta.setAttribute('content', prevThemeColor);
      }
    };
  }, []);

  return (
    <div className="auth-shell-root relative flex min-h-[100svh] min-h-[100dvh] w-full flex-col font-sans text-[#1D1D1D]">
      <div
        aria-hidden
        className="pointer-events-none fixed -z-10 bg-white"
        style={{
          top: 'calc(-1 * env(safe-area-inset-top, 0px))',
          right: 'calc(-1 * env(safe-area-inset-right, 0px))',
          bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
          left: 'calc(-1 * env(safe-area-inset-left, 0px))',
        }}
      />

      {showLogo ? (
        <header
          className="relative z-10 flex shrink-0 justify-end px-6 pb-3 pt-[max(5rem,calc(env(safe-area-inset-top)+2.75rem))] sm:pb-2 sm:pt-[max(3.5rem,calc(env(safe-area-inset-top)+1.75rem))]"
        >
          <Link
            href="/login"
            dir="ltr"
            className="inline-flex items-center gap-2.5 text-[1.1rem] font-medium tracking-[-0.03em] text-[#1D1D1D] transition-opacity hover:opacity-80"
          >
            <Image
              src="/rukny-logo.svg"
              alt=""
              width={28}
              height={28}
              className="size-7"
              priority
            />
            Rukny
          </Link>
        </header>
      ) : null}

      <main
        className="relative z-10 flex flex-1 flex-col items-center justify-start px-6 pt-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:justify-center sm:py-16 sm:pb-[max(4rem,env(safe-area-inset-bottom))]"
      >
        <div className={cn('animate-rise w-full max-w-[352px] pb-6 sm:pb-10', className)}>
          {children}
        </div>
      </main>
    </div>
  );
}
