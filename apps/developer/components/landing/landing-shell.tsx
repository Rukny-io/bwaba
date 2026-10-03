'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUp, Globe, Menu, X } from 'lucide-react';
import { setLocaleAction } from '@/actions/set-locale';
import type { LandingCopy } from '@/lib/landing-copy';
import { agLayout } from '@/lib/ag-theme';
import { cn } from '@/lib/utils';

export function LandingHeader({
  copy,
  locale,
}: {
  copy: LandingCopy;
  locale: 'ar' | 'en';
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isEn = locale === 'en';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
          'pointer-events-none fixed inset-x-0 top-0 z-50 transition-[background-color] duration-300',
          headerActive
            ? 'bg-white md:bg-white/92 md:backdrop-blur-xl'
            : 'bg-transparent md:bg-white/75 md:backdrop-blur-md',
        )}
      >
        <div className="pointer-events-auto">
          <div className={`${agLayout.container} flex h-14 items-center gap-3 sm:gap-6`}>
            <Link href="/" className="group flex shrink-0 items-center gap-2">
              <Image
                src="/rukny-logo.svg"
                alt=""
                width={22}
                height={22}
                priority
                className="transition-transform duration-200 group-hover:scale-[1.03]"
              />
              <span className="text-[15px] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                {copy.brand}
              </span>
            </Link>

            <nav className="ms-auto hidden items-center gap-0.5 md:flex">
              <Link
                href="/documentation"
                className={cn(
                  'inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors',
                  agLayout.navIdle,
                )}
              >
                {copy.docs}
              </Link>
              <Link
                href="/pricing"
                className={cn(
                  'inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors',
                  agLayout.navIdle,
                )}
              >
                {copy.pricing}
              </Link>
              <button
                type="button"
                onClick={() => {
                  void setLocaleAction(isEn ? 'ar' : 'en').then(() => {
                    window.location.reload();
                  });
                }}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors',
                  agLayout.navIdle,
                )}
              >
                <Globe className="size-3.5 opacity-70" aria-hidden />
                {copy.switchLang}
              </button>
              <span className="mx-1.5 h-4 w-px bg-[#EBEBEB]" aria-hidden />
              <Link
                href="/login"
                className={cn(
                  'inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors',
                  agLayout.navIdle,
                )}
              >
                {copy.login}
              </Link>
              <Link
                href="/login?next=/apps"
                className="inline-flex h-9 items-center rounded-full bg-[#1D1D1D] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#0A0A0A]"
              >
                {copy.start}
              </Link>
            </nav>

            <div className="ms-auto flex items-center gap-1 md:hidden">
              <button
                type="button"
                onClick={() => {
                  void setLocaleAction(isEn ? 'ar' : 'en').then(() => {
                    window.location.reload();
                  });
                }}
                className="inline-flex size-10 items-center justify-center rounded-full text-[#1D1D1D]"
                aria-label={copy.switchLang}
              >
                <Globe className="size-4" />
              </button>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full bg-[#F5F5F5] text-[#1D1D1D]"
                aria-label={mobileOpen ? 'Close' : 'Menu'}
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
            aria-label="Close"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 top-14 overflow-y-auto bg-white">
            <div className="px-5 py-5">
              <Link
                href="/login?next=/apps"
                className={`${agLayout.btnPrimary} w-full`}
                onClick={() => setMobileOpen(false)}
              >
                {copy.start}
              </Link>
            </div>
            <nav className="px-3 py-2">
              {[
                { href: '/documentation', label: copy.docs },
                { href: '/pricing', label: copy.pricing },
                { href: '/login', label: copy.login },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex h-11 items-center rounded-2xl px-3 text-[15px] font-medium text-[#1D1D1D] hover:bg-[#FAFAFA]"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function LandingFooter({
  copy,
  year,
}: {
  copy: LandingCopy;
  year: number;
}) {
  return (
    <footer className={`${agLayout.sectionMuted} pt-20 sm:pt-24`}>
      <div className={`${agLayout.container} pb-16 sm:pb-20 md:pb-24`}>
        <div className="rounded-[2rem] bg-white p-7 sm:p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-12">
            <div className="text-start">
              <p className={agLayout.eyebrow}>{copy.ctaEyebrow}</p>
              <h2 className="mt-3 text-[clamp(1.5rem,3vw,2rem)] font-medium tracking-[-0.03em] text-[#1D1D1D]">
                {copy.ctaTitle}
              </h2>
              <p className={`${agLayout.lead} mt-3 max-w-lg`}>{copy.ctaSupport}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
              <Link
                href="/login?next=/apps"
                className={`${agLayout.btnPrimary} sm:min-w-[10rem]`}
              >
                {copy.startFree}
              </Link>
              <Link
                href="/pricing"
                className={`${agLayout.btnSecondary} sm:min-w-[10rem]`}
              >
                {copy.pricing}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image src="/rukny-logo.svg" alt="" width={24} height={24} />
              <span className="text-[1.35rem] font-medium tracking-[-0.03em] text-[#1D1D1D]">
                {copy.brand}
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-pretty text-[15px] leading-[1.75] text-[#6B6F76]">
              {copy.footerTagline}
            </p>
            <div className="mt-6 border-t border-[#EBEBEB] pt-6">
              <p className={agLayout.eyebrow}>{copy.contact}</p>
              <a
                href="mailto:developers@rukny.io"
                dir="ltr"
                className="mt-3 inline-flex text-[15px] text-[#1D1D1D] underline underline-offset-4 transition-colors hover:text-[#6B6F76]"
              >
                developers@rukny.io
              </a>
            </div>
          </div>

          <div>
            <p className={agLayout.eyebrow}>{copy.products}</p>
            <ul className="mt-4 space-y-2">
              {[
                { href: '/documentation/whatsapp-api', label: copy.whatsapp },
                { href: '/documentation/email-api', label: copy.email },
                { href: '/documentation/forms', label: copy.forms },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex text-[14px] leading-relaxed text-[#6B6F76] transition-colors hover:text-[#1D1D1D]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={agLayout.eyebrow}>{copy.resources}</p>
            <ul className="mt-4 space-y-2">
              {[
                { href: '/documentation', label: copy.docs },
                { href: '/pricing', label: copy.pricing },
                { href: '/login?next=/apps', label: copy.getStarted },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex text-[14px] leading-relaxed text-[#6B6F76] transition-colors hover:text-[#1D1D1D]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={agLayout.eyebrow}>{copy.company}</p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/login"
                  className="inline-flex text-[14px] leading-relaxed text-[#6B6F76] transition-colors hover:text-[#1D1D1D]"
                >
                  {copy.login}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 rounded-[1.5rem] bg-white px-5 py-4 sm:mt-16 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#9CA3AF]">
              <span>
                © {year} {copy.brand}
              </span>
              <span className="hidden sm:inline" aria-hidden>
                ·
              </span>
              <span>{copy.footerBrand}</span>
            </div>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1D1D1D] transition-opacity hover:opacity-70"
            >
              {copy.backToTop}
              <ArrowUp className="size-3.5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
