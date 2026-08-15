'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  LayoutGrid,
  Menu,
  ShoppingBag,
  ClipboardList,
  UserCircle2,
  TrendingUp,
  BrainCircuit,
  X,
  type LucideIcon,
} from 'lucide-react';
import { RuknyLogo } from '@/components/rukny-logo';
import { siteUrls } from '@/lib/site-urls';
import { marketingNav } from '@/lib/marketing-theme';
import { cn } from '@/lib/utils';

const productIcons: Record<string, LucideIcon> = {
  '/products/stores': ShoppingBag,
  '/products/forms': ClipboardList,
  '/products/profile': UserCircle2,
  '/products/analytics': TrendingUp,
  '/products/ai': BrainCircuit,
};

export function MarketingHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProductsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setProductsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header dir="rtl" className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          'border-b transition-all duration-300',
          scrolled
            ? 'border-white/10 bg-[#0a0a0a]/88 backdrop-blur-xl'
            : 'border-transparent bg-[#0a0a0a]/50 backdrop-blur-md',
        )}
      >
        <div className="mx-auto flex h-[3.75rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-white transition-opacity hover:opacity-85"
            aria-label="Rukny — الصفحة الرئيسية"
          >
            <RuknyLogo className="h-8 w-8 brightness-0 invert" />
            <span className="text-[15px] font-bold tracking-tight" dir="ltr">
              Rukny
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="التنقل الرئيسي"
          >
            <div className="relative" ref={panelRef}>
              <button
                type="button"
                aria-expanded={productsOpen}
                onClick={() => setProductsOpen((v) => !v)}
                className={cn(
                  'flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors',
                  productsOpen
                    ? 'bg-white/10 text-white'
                    : 'text-white/65 hover:bg-white/5 hover:text-white',
                )}
              >
                المنتجات
                <ChevronDown
                  className={cn(
                    'size-3.5 opacity-60 transition-transform',
                    productsOpen && 'rotate-180',
                  )}
                />
              </button>

              {productsOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+0.5rem)] w-[min(100vw-2rem,22rem)] rounded-2xl border border-white/10 bg-[#11181a] p-2 shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
                  onMouseLeave={() => setProductsOpen(false)}
                >
                  {marketingNav.products.map((item) => {
                    const Icon = productIcons[item.href] ?? ShoppingBag;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
                        onClick={() => setProductsOpen(false)}
                      >
                        <span
                          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-teal-300"
                        >
                          <Icon className="size-4" strokeWidth={1.75} />
                        </span>
                        <span>
                          <span className="block text-[13px] font-semibold text-white">
                            {item.name}
                          </span>
                          <span className="block text-[12px] leading-snug text-white/50">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {marketingNav.links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-white/10 text-white'
                    : 'text-white/65 hover:bg-white/5 hover:text-white',
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={siteUrls.privacy}
              className="hidden rounded-full px-3 py-2 text-[12px] font-medium text-white/45 transition-colors hover:text-white md:inline-flex"
            >
              Privacy
            </Link>
            <Link
              href={siteUrls.accounts}
              className="hidden rounded-full px-3 py-2 text-[13px] font-medium text-white/65 transition-colors hover:text-white sm:inline-flex"
            >
              تسجيل الدخول
            </Link>
            <Link
              href={siteUrls.accounts}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-[#062c30] transition hover:bg-white/90"
            >
              <span>ابدأ مجاناً</span>
              <LayoutGrid className="size-3.5 opacity-80" />
            </Link>
            <button
              type="button"
              aria-label="فتح القائمة"
              className="flex size-9 items-center justify-center rounded-xl border border-white/10 text-white lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="absolute inset-y-0 right-0 w-[min(100%,20rem)] border-l border-white/10 bg-[#0f1416] p-5 shadow-2xl"
            dir="rtl"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white" dir="ltr">Rukny</span>
              <button
                type="button"
                aria-label="إغلاق"
                onClick={() => setMobileOpen(false)}
                className="flex size-9 items-center justify-center rounded-xl border border-white/10 text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-6 space-y-1">
              <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wide text-white/35">
                المنتجات
              </p>
              {marketingNav.products.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-3 py-2.5 text-[14px] font-medium text-white/85 hover:bg-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="my-3 h-px bg-white/10" />
              {marketingNav.links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-3 py-2.5 text-[14px] font-medium text-white/85 hover:bg-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
