'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '#features', label: 'المميزات' },
  { href: '#channels', label: 'القنوات' },
  { href: '#cta', label: 'ابدأ الآن' },
] as const;

function RuknyLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 1080 1080"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="352.46" y="211.99" width="411.5" height="239.89" />
      <rect
        x="25"
        y="539.45"
        width="415.04"
        height="239.89"
        transform="translate(891.92 426.88) rotate(90)"
      />
      <path d="m967.42,665.78v175.97c0,13.89-11.26,25.15-25.15,25.15h-190.54c-6.67,0-13.07-2.65-17.78-7.37l-141.2-141.2c-15.84-15.84-4.62-42.93,17.78-42.93h128.24c13.89,0,25.15-11.26,25.15-25.15v-137.68c0-22.41,27.09-33.63,42.93-17.78l153.21,153.21c4.72,4.72,7.37,11.11,7.37,17.78Z" />
    </svg>
  );
}

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const onScroll = useCallback(() => {
    setScrolled(window.scrollY > 8);
  }, []);

  useEffect(() => {
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return (
    <header
      className={cn(
        'landing-nav-shell sticky top-0 z-50 border-b border-transparent',
        scrolled && 'is-scrolled',
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 min-[720px]:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <RuknyLogoIcon className="text-[var(--primary)]" />
          <span className="text-[15px] font-bold text-[var(--foreground)]">ركني</span>
          <span className="hidden text-[12px] font-medium text-[var(--muted-foreground)] min-[480px]:inline">
            Business
          </span>
        </Link>

        <nav className="hidden items-center gap-1 min-[720px]:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-[13px] font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--landing-subtle-hover)] hover:text-[var(--foreground)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="landing-outline-btn hidden h-10 items-center rounded-full px-4 text-sm font-semibold min-[720px]:inline-flex"
          >
            تسجيل الدخول
          </Link>
          <Link href="/login" className="landing-invert-btn inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold">
            ابدأ مجاناً
          </Link>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-[var(--border)] px-5 py-3 min-[720px]:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block rounded-xl px-3 py-2 text-sm font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </header>
  );
}
