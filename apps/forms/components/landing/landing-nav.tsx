'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const NAV_LINKS = [
  { href: '#features', label: 'المميزات' },
  { href: '#integrations', label: 'التكاملات' },
  { href: '#pricing', label: 'الأسعار' },
  { href: '/login', label: 'تسجيل الدخول' },
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
  const topLineClass = open
    ? `${lineClass} translate-y-[4px] rotate-45`
    : lineClass;
  const bottomLineClass = open
    ? `${lineClass} -translate-y-[4px] -rotate-45`
    : lineClass;

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
        className={topLineClass}
      />
      <path
        d="M4 14H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={bottomLineClass}
      />
    </svg>
  );
}

function BrandLink({ showWordmark = true }: { showWordmark?: boolean }) {
  return (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-3 rounded-full py-2 ps-3 pe-4 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--foreground)]/20"
    >
      <RuknyLogoIcon className="h-6 w-auto shrink-0 text-[var(--foreground)]" />
      <div className="min-w-0">
        {showWordmark ? (
          <span className="block truncate text-[13px] font-medium text-[var(--muted-foreground)]">
            Forms
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

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
    <header className="sticky top-0 z-50 bg-transparent">
      {/* Desktop — pill centered (≥720px) */}
      <div className="mx-auto hidden max-w-[1280px] justify-center px-4 pt-5 min-[720px]:flex sm:pt-6">
        <nav
          aria-label="التنقل الرئيسي"
          className="liquid-glass flex h-[64px] w-full max-w-[680px] items-center justify-between gap-4 rounded-[32px] px-5"
        >
          <div className="flex grow items-center">
            <BrandLink showWordmark />
          </div>
          <div className="flex items-center gap-6">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-semibold text-[var(--foreground)] transition-opacity hover:opacity-70 whitespace-nowrap"
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Mobile — bar in layout flow; menu overlays page (like Mobbin) */}
      <div className="relative z-50 h-14 shrink-0 px-3 pt-2 min-[720px]:hidden">
        <nav
          aria-label="التنقل الرئيسي"
          className={`liquid-glass absolute top-2 right-3 left-3 z-50 w-[calc(100%-1.5rem)] rounded-[22px] ${
            menuOpen ? 'liquid-glass-expanded rounded-[28px]' : ''
          }`}
        >
          <div className="flex items-center justify-between py-3 ps-5 pe-3">
            <BrandLink />
            <button
              type="button"
              className="landing-subtle-hover relative z-10 flex h-9 w-10 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-xl outline-none transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--foreground)]/20"
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
              className="liquid-menu-panel flex flex-col gap-6 px-5 pt-4 pb-5"
            >
              <ul className="flex flex-col gap-3">
                {NAV_LINKS.map(({ href, label }) => (
                  <li key={href} className="liquid-menu-item">
                    <Link
                      href={href}
                      className="landing-subtle-hover block rounded-xl px-2 py-2.5 text-base font-semibold text-[var(--foreground)] transition-[background-color,opacity] duration-200 active:opacity-80"
                      onClick={closeMenu}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
