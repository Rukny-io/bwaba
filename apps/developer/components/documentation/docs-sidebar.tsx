'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import {
  DOCUMENTATION_BASE,
  DOCUMENTATION_PRODUCTS,
  getDocumentationProduct,
  isDocNavActive,
  type DocumentationNavGroup,
  type DocumentationProductId,
} from '@/lib/documentation-nav';
import { cn } from '@/lib/utils';

function DocsNavGroups({
  groups,
  pathname,
  productTitle,
  onNavigate,
}: {
  groups: DocumentationNavGroup[];
  pathname: string;
  productTitle: string;
  onNavigate?: () => void;
}) {
  return (
    <nav
      className="flex flex-col gap-5"
      aria-label={`${productTitle} documentation`}
    >
      {groups.map((group) => (
        <div key={group.label} className="min-w-0">
          <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted-foreground)]">
            {group.label}
          </p>
          <div className="flex flex-col border-s border-[var(--border)] ps-px">
            {group.items.map((item) => {
              const active = isDocNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={onNavigate}
                  className={cn(
                    '-ms-px border-s-2 py-1 ps-3 pe-2 text-[13px] leading-5 transition-colors',
                    active
                      ? 'border-[var(--foreground)] font-medium text-[var(--foreground)]'
                      : 'border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function DocsSidebar({
  productId,
}: {
  productId: DocumentationProductId;
}) {
  const pathname = usePathname();
  const product = getDocumentationProduct(productId);
  const groups = product?.navGroups ?? [];
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentLabel = useMemo(() => {
    for (const group of groups) {
      for (const item of group.items) {
        if (isDocNavActive(pathname, item.href)) return item.label;
      }
    }
    return product?.title ?? 'Docs';
  }, [groups, pathname, product?.title]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  if (!product || groups.length === 0) return null;

  const availableProducts = DOCUMENTATION_PRODUCTS.filter((item) => item.available);
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile: compact sticky bar under header */}
      <div className="sticky top-14 z-30 -mx-5 mb-6 border-b border-[var(--border)] bg-[var(--background)]/90 px-5 backdrop-blur-md sm:top-[3.75rem] sm:-mx-6 sm:px-6 lg:hidden">
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="docs-mobile-nav"
          onClick={() => setMobileOpen((value) => !value)}
          className="flex h-12 w-full items-center justify-between gap-3"
        >
          <span className="min-w-0 text-start">
            <span className="block truncate text-[11px] text-[var(--muted-foreground)]">
              {product.title}
            </span>
            <span className="block truncate text-[14px] font-semibold text-[var(--foreground)]">
              {currentLabel}
            </span>
          </span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-[var(--muted-foreground)] transition-transform duration-200',
              mobileOpen && 'rotate-180',
            )}
            aria-hidden
          />
        </button>

        {mobileOpen ? (
          <div
            id="docs-mobile-nav"
            className="max-h-[min(65vh,24rem)] overflow-y-auto overscroll-contain border-t border-[var(--border)] pb-4 pt-3"
          >
            {availableProducts.length > 1 ? (
              <div className="mb-4 flex gap-2">
                {availableProducts.map((item) => {
                  const active = item.id === productId;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={closeMobile}
                      className={cn(
                        'inline-flex h-8 flex-1 items-center justify-center rounded-lg text-[12.5px] font-medium transition-colors',
                        active
                          ? 'bg-[var(--foreground)] text-[var(--background)]'
                          : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
                      )}
                    >
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            ) : null}
            <DocsNavGroups
              groups={groups}
              pathname={pathname}
              productTitle={product.title}
              onNavigate={closeMobile}
            />
            <Link
              href={DOCUMENTATION_BASE}
              onClick={closeMobile}
              className="mt-4 inline-flex text-[13px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              All documentation
            </Link>
          </div>
        ) : null}
      </div>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close documentation menu"
          className="fixed inset-0 z-20 bg-[color-mix(in_srgb,var(--foreground)_12%,transparent)] lg:hidden"
          onClick={closeMobile}
        />
      ) : null}

      {/* Desktop sidebar — stretch with article row so sticky can follow scroll */}
      <aside className="hidden lg:block">
        <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain pe-2 sm:top-[3.75rem] sm:max-h-[calc(100dvh-3.75rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <p className="mb-4 px-3 text-[13px] font-semibold text-[var(--foreground)]">
            {product.title}
          </p>
          <DocsNavGroups
            groups={groups}
            pathname={pathname}
            productTitle={product.title}
          />
          <div className="mt-6 border-t border-[var(--border)] pt-3">
            <Link
              href={DOCUMENTATION_BASE}
              className="block px-3 text-[12.5px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              All documentation
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

/** @deprecated Prefer DocsSidebar with productId */
export function EmailApiDocsSidebar() {
  return <DocsSidebar productId="email-api" />;
}
