'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { isNavItemActive } from '@/components/layout/nav-config';
import { useSidebarProducts } from '@/hooks/use-sidebar-products';
import { appProducts } from '@/lib/app-routes';
import {
  resolveProductHref,
  type DeveloperProduct,
} from '@/lib/developer-products';
import {
  ProductIcon,
  usesPlatformSvg,
} from '@/components/products/product-icon';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/components/providers/translations-provider';

function Tooltip({ label, isRtl }: { label: string; isRtl: boolean }) {
  return (
    <span
      className={`
      pointer-events-none absolute top-1/2 z-50 -translate-y-1/2
      whitespace-nowrap rounded-xl bg-[var(--foreground)] px-2.5 py-1.5 text-xs font-medium text-[var(--background)]
      opacity-0 transition-opacity duration-150 group-hover:opacity-100
      ${
        isRtl
          ? 'left-0 -translate-x-[calc(100%+10px)] after:absolute after:right-[-5px] after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-[var(--foreground)]'
          : 'right-0 translate-x-[calc(100%+10px)] after:absolute after:left-[-5px] after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-r-[var(--foreground)]'
      }
    `}
    >
      {label}
    </span>
  );
}

function navClasses(isActive: boolean) {
  return `relative group flex size-10 items-center justify-center transition-all duration-200 ${
    isActive
      ? 'rounded-full bg-[var(--foreground)] text-[var(--background)]'
      : 'rounded-2xl text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]'
  }`;
}

function PinnedProductLink({
  product,
  appId,
  label,
  pathname,
  isRtl,
}: {
  product: DeveloperProduct;
  appId: string;
  label: string;
  pathname: string;
  isRtl: boolean;
}) {
  const href = resolveProductHref(product, appId);
  if (!href) return null;

  const isExternal = Boolean(product.externalHref);
  const isActive = !isExternal && isNavItemActive(pathname, href);
  const className = navClasses(isActive);
  const icon = (
    <ProductIcon
      productId={product.id}
      size={19}
      strokeWidth={isActive ? 2 : 1.7}
      className={cn(
        usesPlatformSvg(product.id) && isActive && 'brightness-0 invert',
      )}
    />
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={label}
      >
        {icon}
        <Tooltip label={label} isRtl={isRtl} />
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-label={label}>
      {icon}
      <Tooltip label={label} isRtl={isRtl} />
    </Link>
  );
}

export function SidebarProductsRail() {
  const pathname = usePathname();
  const t = useTranslations();
  const isRtl = t.common.switchLang === 'English';
  const { appId, installedProducts, hydrated } = useSidebarProducts();
  const items = (t.products.items ?? {}) as Record<string, { name?: string }>;
  const catalogHref = appProducts(appId);
  const catalogActive = isNavItemActive(pathname, catalogHref);

  if (!hydrated) {
    return (
      <div
        className="mb-3 flex flex-col items-center gap-1.5 rounded-3xl bg-[var(--surface)] px-2 py-3"
        aria-hidden
      >
        <div className="size-10 rounded-2xl bg-[var(--surface-secondary)]" />
      </div>
    );
  }

  return (
    <div className="mb-3 flex flex-col items-center gap-1.5 rounded-3xl bg-[var(--surface)] px-2 py-3">
      <nav
        className="flex flex-col items-center gap-1.5"
        aria-label={t.products.sidebarRail}
      >
        {installedProducts.map((product) => (
          <PinnedProductLink
            key={product.id}
            product={product}
            appId={appId}
            label={items[product.id]?.name ?? product.id}
            pathname={pathname}
            isRtl={isRtl}
          />
        ))}

        <Link
          href={catalogHref}
          className={navClasses(catalogActive)}
          aria-label={t.products.addProduct}
        >
          <Plus size={19} strokeWidth={catalogActive ? 2 : 1.7} />
          <Tooltip label={t.products.addProduct} isRtl={isRtl} />
        </Link>
      </nav>
    </div>
  );
}
