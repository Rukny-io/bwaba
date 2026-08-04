'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '#features', label: 'المميزات' },
  { href: '#integrations', label: 'التكاملات' },
  { href: '#pricing', label: 'الأسعار' },
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

function MenuIcon({ open }: { open: boolean }) {
  const lineClass =
    'origin-center transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]';
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      aria-hidden
      className="pointer-events-none text-[var(--foreground)]"
    >
      <path
        d="M4 6H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={cn(lineClass, open && 'translate-y-[4px] rotate-45')}
      />
      <path
        d="M4 14H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={cn(lineClass, open && '-translate-y-[4px] -rotate-45')}
      />
    </svg>
  );
}

function BrandLink() {
  return (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-2.5 rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
    >
      <RuknyLogoIcon className="h-[22px] w-auto shrink-0 text-[var(--primary)]" />
      <span className="text-[15px] font-bold tracking-tight text-[var(--foreground)]">
        ركني
      </span>
      <span className="hidden text-[12px] font-medium text-[var(--muted-foreground)] min-[480px]:inline">
        Forms
      </span>
    </Link>
  );
}

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen, closeMenu]);

  return (
    <header
      className={cn(
        'landing-nav-shell sticky top-0 z-50',
        scrolled && 'is-scrolled',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 min-[720px]:h-[72px] min-[720px]:px-6">
        <BrandLink />

        <nav
          aria-label="التنقل الرئيسي"
          className="hidden items-center gap-1 min-[720px]:flex"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-[var(--foreground)]/75 transition-colors hover:bg-[var(--landing-subtle-hover)] hover:text-[var(--foreground)]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 min-[720px]:flex">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-[var(--foreground)]/80 transition-colors hover:text-[var(--foreground)]"
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/app"
            className="landing-invert-btn inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold"
          >
            لوحة التحكم
          </Link>
        </div>

        <button
          type="button"
          className="landing-subtle-hover relative z-10 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25 min-[720px]:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MenuIcon open={menuOpen} />
        </button>
      </div>

      {menuOpen ? (
        <div
          id="mobile-nav-menu"
          className="border-t border-[var(--border)] bg-white px-5 py-5 min-[720px]:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="block rounded-xl px-3 py-3 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--landing-subtle-hover)]"
                  onClick={closeMenu}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2 border-t border-[var(--border)] pt-4">
            <Link
              href="/login"
              onClick={closeMenu}
              className="flex h-11 items-center justify-center rounded-full border border-[var(--border)] text-sm font-semibold text-[var(--foreground)]"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/app"
              onClick={closeMenu}
              className="landing-invert-btn flex h-11 items-center justify-center rounded-full text-sm font-semibold"
            >
              لوحة التحكم
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
