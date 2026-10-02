'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { DOCUMENTATION_BASE } from '@/lib/documentation-nav';
import { cn } from '@/lib/utils';

const DOC_NAV = [
  { href: `${DOCUMENTATION_BASE}/email-api`, label: 'Email API' },
  { href: `${DOCUMENTATION_BASE}/forms`, label: 'Forms' },
] as const;

const container = 'mx-auto w-full max-w-[1200px] px-5 sm:px-8';

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DocumentationHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const headerActive = scrolled || mobileOpen;

  return (
    <>
      <header
        className={cn(
          'pointer-events-none fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300',
          headerActive
            ? 'bg-white md:bg-white/92 md:backdrop-blur-xl'
            : 'bg-white md:bg-white/75 md:backdrop-blur-md',
        )}
      >
        <div className="pointer-events-auto">
          <div className={`${container} flex h-14 items-center gap-4 sm:gap-6`}>
            <Link href={DOCUMENTATION_BASE} className="group flex shrink-0 items-center gap-2">
              <Image
                src="/rukny-logo.svg"
                alt=""
                width={22}
                height={22}
                priority
                className="transition-transform duration-200 group-hover:scale-[1.03]"
              />
              <span className="text-[15px] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                Rukny
              </span>
              <span className="hidden text-[13px] font-medium text-[#9CA3AF] sm:inline">
                Docs
              </span>
            </Link>

            <nav
              className="hidden flex-1 items-center gap-0.5 md:flex"
              aria-label="Documentation"
            >
              {DOC_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors',
                    isActive(pathname, link.href)
                      ? 'bg-[#F5F5F5] text-[#1D1D1D]'
                      : 'text-[#6B6F76] hover:bg-[#FAFAFA] hover:text-[#1D1D1D]',
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/pricing"
                className={cn(
                  'inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors',
                  isActive(pathname, '/pricing')
                    ? 'bg-[#F5F5F5] text-[#1D1D1D]'
                    : 'text-[#6B6F76] hover:bg-[#FAFAFA] hover:text-[#1D1D1D]',
                )}
              >
                Pricing
              </Link>
            </nav>

            <div className="ms-auto hidden items-center gap-0.5 md:flex">
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-full px-3.5 text-[14px] font-medium text-[#6B6F76] transition-colors hover:bg-[#F5F5F5] hover:text-[#1D1D1D]"
              >
                Log in
              </Link>
              <Link
                href="/login?next=/apps"
                className="inline-flex h-9 items-center justify-center rounded-full bg-[#1D1D1D] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#0A0A0A]"
              >
                Dashboard
              </Link>
            </div>

            <div className="ms-auto flex items-center md:hidden">
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full bg-[#F5F5F5] text-[#1D1D1D] transition-colors hover:bg-[#EBEBEB]"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="pointer-events-auto fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#1D1D1D]/20"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 top-14 overflow-y-auto bg-white">
            <div className="px-5 py-5">
              <Link
                href="/login?next=/apps"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1D1D1D] px-6 text-[14px] font-medium text-white"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
            </div>
            <nav className="px-3 py-2" aria-label="Documentation menu">
              {DOC_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex h-11 items-center rounded-2xl px-3 text-[15px] font-medium text-[#1D1D1D] hover:bg-[#FAFAFA]"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/pricing"
                className="flex h-11 items-center rounded-2xl px-3 text-[15px] font-medium text-[#1D1D1D] hover:bg-[#FAFAFA]"
                onClick={() => setMobileOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="flex h-11 items-center rounded-2xl px-3 text-[15px] font-medium text-[#6B6F76] hover:bg-[#FAFAFA] hover:text-[#1D1D1D]"
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function DocumentationFooter() {
  return (
    <footer className="mt-auto border-t border-[#EBEBEB] bg-white">
      <div
        className={`${container} flex flex-col gap-4 py-10 text-[13px] text-[#6B6F76] sm:flex-row sm:items-center sm:justify-between`}
      >
        <p>© {new Date().getFullYear()} Rukny</p>
        <div className="flex flex-wrap gap-5">
          <Link
            href={DOCUMENTATION_BASE}
            className="transition-colors hover:text-[#1D1D1D]"
          >
            Docs
          </Link>
          <Link
            href={`${DOCUMENTATION_BASE}/email-api`}
            className="transition-colors hover:text-[#1D1D1D]"
          >
            Email API
          </Link>
          <Link
            href={`${DOCUMENTATION_BASE}/forms`}
            className="transition-colors hover:text-[#1D1D1D]"
          >
            Forms
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-[#1D1D1D]">
            Pricing
          </Link>
          <Link href="/login" className="transition-colors hover:text-[#1D1D1D]">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function DocumentationShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1D1D1D]" dir="ltr" lang="en">
      <DocumentationHeader />
      <div className="flex-1 pt-14">{children}</div>
      <DocumentationFooter />
    </div>
  );
}
