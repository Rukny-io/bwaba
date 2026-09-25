'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, ChevronDown, Menu, X, type LucideIcon } from 'lucide-react';
import { LanguageSwitcher } from '@/components/locale/language-switcher';
import { agLayout } from '@/lib/public-antigravity-theme';
import {
  MAIN_NAV_LINKS,
  PRODUCT_NAV_CONFIG,
  type ProductNavId,
} from '@/lib/marketing-nav-config';
import { siteUrls } from '@/lib/site-urls';
import { cn } from '@/lib/utils';

type DropdownId = 'product' | null;

type NavItem = {
  href: string;
  title: string;
  description: string;
  external?: boolean;
  icon?: LucideIcon;
};

function ProductMegaCard({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const className =
    'group flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-[#FAFAFA]';
  const body = (
    <>
      {Icon ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F5F5] text-[#1D1D1D]">
          <Icon className="size-4" strokeWidth={1.5} />
        </span>
      ) : null}
      <span className="min-w-0 flex-1 text-start">
        <span className="flex items-center justify-start gap-1 text-[14px] font-medium text-[#1D1D1D]">
          {item.external ? (
            <ArrowUpRight className="size-3.5 text-[#C4C4C4] rtl:-scale-x-100" aria-hidden />
          ) : null}
          {item.title}
        </span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-[#6B6F76]">
          {item.description}
        </span>
      </span>
    </>
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        className={className}
        rel="noopener noreferrer"
        onClick={onNavigate}
      >
        {body}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      {body}
    </Link>
  );
}

export function PublicAgHeader() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState<DropdownId>(null);

  const products: NavItem[] = PRODUCT_NAV_CONFIG.map((item) => ({
    href: item.href,
    icon: item.icon,
    title: t(`productItems.${item.id}.title`),
    description: t(`productItems.${item.id}.description`),
  }));

  const isActive = (href: string) =>
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setMobileProductsOpen(false);
    setDropdown(null);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdown(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const closeMenus = () => {
    setDropdown(null);
    setMobileOpen(false);
    setMobileProductsOpen(false);
  };

  const headerActive = scrolled || mobileOpen || Boolean(dropdown);

  return (
    <>
      <header
        className={cn(
          'pointer-events-none fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300',
          headerActive
            ? 'bg-white md:bg-white/92 md:backdrop-blur-xl'
            : 'bg-white md:bg-white/75 md:backdrop-blur-md',
        )}
        onMouseLeave={() => setDropdown(null)}
      >
        <div className="pointer-events-auto">
          <div className={`${agLayout.container} flex h-14 items-center gap-4 sm:gap-6`}>
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
                {t('brand')}
              </span>
            </Link>

            <nav
              className="hidden flex-1 items-center gap-0.5 md:flex"
              aria-label={t('mainAria')}
            >
              <button
                type="button"
                aria-expanded={dropdown === 'product'}
                onClick={() =>
                  setDropdown(dropdown === 'product' ? null : 'product')
                }
                onMouseEnter={() => setDropdown('product')}
                className={cn(
                  'inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-[13px] font-medium transition-colors',
                  dropdown === 'product' ? agLayout.navActive : agLayout.navIdle,
                )}
              >
                {t('products')}
                <ChevronDown
                  className={cn(
                    'size-3.5 opacity-40 transition-transform duration-200',
                    dropdown === 'product' && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>

              {MAIN_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors',
                    isActive(link.href) ? agLayout.navActive : agLayout.navIdle,
                  )}
                >
                  {t(link.key)}
                </Link>
              ))}
            </nav>

            <div className="ms-auto hidden items-center gap-0.5 md:flex">
              <LanguageSwitcher />
              <span
                className="mx-1.5 hidden h-4 w-px bg-[#EBEBEB] sm:block"
                aria-hidden
              />
              <Link href={siteUrls.accounts} className={agLayout.btnGhost}>
                {t('login')}
              </Link>
              <Link
                href={siteUrls.accounts}
                className={cn(
                  agLayout.btnPrimary,
                  'h-9 px-4 text-[13px]',
                )}
              >
                {t('startFree')}
              </Link>
            </div>

            <div className="ms-auto flex items-center gap-2 md:hidden">
              <LanguageSwitcher />
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full bg-[#F5F5F5] text-[#1D1D1D] transition-colors hover:bg-[#EBEBEB]"
                aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {dropdown === 'product' ? (
              <motion.div
                className="hidden bg-white/95 backdrop-blur-xl md:block"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={`${agLayout.container} py-7`}>
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <p className="text-[13px] text-[#6B6F76]">{t('productsLead')}</p>
                    <Link
                      href="/#products"
                      className="shrink-0 text-[13px] font-medium text-[#1D1D1D] hover:underline"
                      onClick={closeMenus}
                    >
                      {t('viewAll')}
                    </Link>
                  </div>
                  <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((item) => (
                      <ProductMegaCard
                        key={item.href}
                        item={item}
                        onNavigate={closeMenus}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </header>

      {mobileOpen ? (
        <div className="pointer-events-auto fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#1D1D1D]/20"
            aria-label={t('closeMenu')}
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 top-14 overflow-y-auto bg-white">
            <div className="px-5 py-5">
              <Link
                href={siteUrls.accounts}
                className={`${agLayout.btnPrimary} w-full`}
                onClick={closeMenus}
              >
                {t('startFree')}
              </Link>
            </div>

            <nav className="px-3 py-2" aria-label={t('mobileMenuAria')}>
              <button
                type="button"
                className="flex h-11 w-full items-center justify-between rounded-2xl px-3 text-[15px] font-medium text-[#1D1D1D] hover:bg-[#FAFAFA]"
                aria-expanded={mobileProductsOpen}
                onClick={() => setMobileProductsOpen((v) => !v)}
              >
                {t('products')}
                <ChevronDown
                  className={cn(
                    'size-4 opacity-50 transition-transform duration-200',
                    mobileProductsOpen && 'rotate-180',
                  )}
                />
              </button>

              {mobileProductsOpen ? (
                <div className="mb-2 mt-1 space-y-0.5 pe-2">
                  {products.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex h-10 items-center rounded-xl px-4 text-[14px] text-[#6B6F76] transition-colors hover:bg-[#FAFAFA] hover:text-[#1D1D1D]"
                      onClick={closeMenus}
                    >
                      {item.title}
                    </Link>
                  ))}
                  <Link
                    href="/#products"
                    className="flex h-10 items-center rounded-xl px-4 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:bg-[#FAFAFA]"
                    onClick={closeMenus}
                  >
                    {t('viewAllProducts')}
                  </Link>
                </div>
              ) : null}

              {MAIN_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex h-11 items-center rounded-2xl px-3 text-[15px] font-medium text-[#1D1D1D] hover:bg-[#FAFAFA]"
                  onClick={closeMenus}
                >
                  {t(link.key)}
                </Link>
              ))}

              <Link
                href={siteUrls.accounts}
                className="flex h-11 items-center rounded-2xl px-3 text-[15px] font-medium text-[#6B6F76] hover:bg-[#FAFAFA] hover:text-[#1D1D1D]"
                onClick={closeMenus}
              >
                {t('login')}
              </Link>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
