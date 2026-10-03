'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Globe, Menu, X } from 'lucide-react';
import { setLocaleAction } from '@/actions/set-locale';
import { useTranslations } from '@/components/providers/translations-provider';
import { DOCUMENTATION_BASE } from '@/lib/documentation-nav';
import { localizeDocumentationProducts } from '@/lib/documentation-i18n';
import { cn } from '@/lib/utils';

const container = 'mx-auto w-full max-w-[1200px] px-5 sm:px-8';

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DocsLocaleToggle() {
  const t = useTranslations();
  const isEn = t.common.locale === 'en';

  return (
    <button
      type="button"
      onClick={() => {
        void setLocaleAction(isEn ? 'ar' : 'en').then(() => {
          window.location.reload();
        });
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-[#6B6F76] transition-colors hover:bg-[#F5F5F5] hover:text-[#1D1D1D]"
    >
      <Globe className="size-3.5 opacity-70" aria-hidden />
      {t.common.switchLang}
    </button>
  );
}

export function DocumentationHeader() {
  const t = useTranslations();
  const d = t.docs;
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const products = localizeDocumentationProducts(d).filter((p) => p.available);

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
  const navIdle = 'text-[#6B6F76] hover:bg-[#FAFAFA] hover:text-[#1D1D1D]';
  const navActive = 'bg-[#F5F5F5] text-[#1D1D1D]';

  return (
    <>
      <header
        className={cn(
          'pointer-events-none fixed inset-x-0 top-0 z-50 transition-[background-color] duration-300',
          headerActive
            ? 'bg-white md:bg-white/92 md:backdrop-blur-xl'
            : 'bg-white md:bg-white/75 md:backdrop-blur-md',
        )}
      >
        <div className="pointer-events-auto">
          <div className={`${container} flex h-14 items-center gap-3 sm:gap-6`}>
            <Link
              href={DOCUMENTATION_BASE}
              className="group flex shrink-0 items-center gap-2"
            >
              <Image
                src="/rukny-logo.svg"
                alt=""
                width={22}
                height={22}
                priority
                className="transition-transform duration-200 group-hover:scale-[1.03]"
              />
              <span className="text-[15px] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                {d.brand}
              </span>
              <span className="hidden text-[13px] font-medium text-[#9CA3AF] sm:inline">
                {d.brandDocs}
              </span>
            </Link>

            <nav
              className="hidden flex-1 items-center gap-0.5 md:flex"
              aria-label={d.navAria}
            >
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={product.href}
                  className={cn(
                    'inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors',
                    isActive(pathname, product.href) ? navActive : navIdle,
                  )}
                >
                  {product.title}
                </Link>
              ))}
              <Link
                href="/pricing"
                className={cn(
                  'inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors',
                  isActive(pathname, '/pricing') ? navActive : navIdle,
                )}
              >
                {d.pricing}
              </Link>
            </nav>

            <div className="ms-auto hidden items-center gap-0.5 md:flex">
              <DocsLocaleToggle />
              <span className="mx-1.5 hidden h-4 w-px bg-[#EBEBEB] sm:block" aria-hidden />
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-full px-3.5 text-[14px] font-medium text-[#6B6F76] transition-colors hover:bg-[#F5F5F5] hover:text-[#1D1D1D]"
              >
                {d.login}
              </Link>
              <Link
                href="/login?next=/apps"
                className="inline-flex h-9 items-center justify-center rounded-full bg-[#1D1D1D] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#0A0A0A]"
              >
                {d.dashboard}
              </Link>
            </div>

            <div className="ms-auto flex items-center gap-1 md:hidden">
              <DocsLocaleToggle />
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full bg-[#F5F5F5] text-[#1D1D1D] transition-colors hover:bg-[#EBEBEB]"
                aria-label={mobileOpen ? d.closeMenu : d.openMenu}
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
            aria-label={d.closeMenu}
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 top-14 overflow-y-auto bg-white">
            <div className="px-5 py-5">
              <Link
                href="/login?next=/apps"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1D1D1D] px-6 text-[14px] font-medium text-white"
                onClick={() => setMobileOpen(false)}
              >
                {d.dashboard}
              </Link>
            </div>
            <nav className="px-3 py-2" aria-label={d.mobileMenuAria}>
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={product.href}
                  className="flex h-11 items-center rounded-2xl px-3 text-[15px] font-medium text-[#1D1D1D] hover:bg-[#FAFAFA]"
                  onClick={() => setMobileOpen(false)}
                >
                  {product.title}
                </Link>
              ))}
              <Link
                href="/pricing"
                className="flex h-11 items-center rounded-2xl px-3 text-[15px] font-medium text-[#1D1D1D] hover:bg-[#FAFAFA]"
                onClick={() => setMobileOpen(false)}
              >
                {d.pricing}
              </Link>
              <Link
                href="/login"
                className="flex h-11 items-center rounded-2xl px-3 text-[15px] font-medium text-[#6B6F76] hover:bg-[#FAFAFA] hover:text-[#1D1D1D]"
                onClick={() => setMobileOpen(false)}
              >
                {d.login}
              </Link>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function DocumentationFooter() {
  const d = useTranslations().docs;
  const products = localizeDocumentationProducts(d).filter((p) => p.available);

  return (
    <footer className="mt-auto border-t border-[#EBEBEB] bg-white">
      <div
        className={`${container} flex flex-col gap-4 py-10 text-[13px] text-[#6B6F76] sm:flex-row sm:items-center sm:justify-between`}
      >
        <p>© {new Date().getFullYear()} {d.brand}</p>
        <div className="flex flex-wrap gap-5">
          <Link href={DOCUMENTATION_BASE} className="transition-colors hover:text-[#1D1D1D]">
            {d.brandDocs}
          </Link>
          {products.map((product) => (
            <Link
              key={product.id}
              href={product.href}
              className="transition-colors hover:text-[#1D1D1D]"
            >
              {product.title}
            </Link>
          ))}
          <Link href="/pricing" className="transition-colors hover:text-[#1D1D1D]">
            {d.pricing}
          </Link>
          <Link href="/login" className="transition-colors hover:text-[#1D1D1D]">
            {d.signIn}
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function DocumentationShellClient({
  children,
  dir,
  lang,
}: {
  children: ReactNode;
  dir: 'ltr' | 'rtl';
  lang: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1D1D1D]" dir={dir} lang={lang}>
      <DocumentationHeader />
      <div className="flex-1 pt-14">{children}</div>
      <DocumentationFooter />
    </div>
  );
}
