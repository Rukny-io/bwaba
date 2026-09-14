'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  getDocumentationProduct,
  isDocNavActive,
  type DocumentationProductId,
} from '@/lib/documentation-nav';
import { cn } from '@/lib/utils';

export function DocsSidebar({
  productId,
}: {
  productId: DocumentationProductId;
}) {
  const pathname = usePathname();
  const product = getDocumentationProduct(productId);
  const groups = product?.navGroups ?? [];

  if (!product || groups.length === 0) return null;

  return (
    <aside className="w-full shrink-0 lg:w-52 xl:w-56">
      <div className="lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto">
        <p className="mb-4 hidden text-[13px] font-semibold text-[var(--foreground)] lg:block">
          {product.title}
        </p>
        <nav
          className="flex gap-4 overflow-x-auto pb-1 lg:flex-col lg:gap-6 lg:overflow-visible lg:pb-0"
          aria-label={`${product.title} documentation`}
        >
          {groups.map((group) => (
            <div key={group.label} className="min-w-max lg:min-w-0">
              <p className="eyebrow-label mb-2">
                {group.label}
              </p>
              <div className="flex gap-1 lg:flex-col">
                {group.items.map((item) => {
                  const active = isDocNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'inline-flex h-8 shrink-0 items-center rounded-none px-2.5 text-[13px] transition-colors lg:w-full',
                        active
                          ? 'bg-[var(--surface-secondary)] font-medium text-[var(--foreground)]'
                          : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
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
      </div>
    </aside>
  );
}

/** @deprecated Prefer DocsSidebar with productId */
export function EmailApiDocsSidebar() {
  return <DocsSidebar productId="email-api" />;
}
