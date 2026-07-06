'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
  showLogo?: boolean;
}

export function AuthLayout({
  children,
  className,
  showLogo = true,
}: AuthLayoutProps) {
  const [isArabic, setIsArabic] = useState(true);

  useEffect(() => {
    setIsArabic(document.documentElement.lang !== 'en');
  }, []);

  const toggleLocale = () => {
    const root = document.documentElement;
    const next = root.lang === 'ar' ? 'en' : 'ar';
    root.lang = next;
    root.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`;
    setIsArabic(next === 'ar');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 md:px-6 pt-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5 md:px-6">
          {showLogo ? (
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center">
                <Image
                  src="/rukny-logo.svg"
                  alt="Rukny Logo"
                  width={24}
                  height={24}
                  className="size-6"
                  priority
                />
              </div>
              <span className="text-base font-semibold tracking-tight text-foreground md:text-lg">
                developers
              </span>
            </div>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={toggleLocale}
            className="flex cursor-pointer items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
            <span className="mb-0.5">{isArabic ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div
          className={cn(
            'flex w-full max-w-[420px] flex-col items-center',
            className,
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
