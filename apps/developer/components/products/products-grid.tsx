'use client';

import { Check, Download, Loader2 } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useSidebarProducts } from '@/hooks/use-sidebar-products';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import {
  DEVELOPER_PRODUCTS,
  type DeveloperProductId,
  type ProductStatus,
} from '@/lib/developer-products';
import {
  ProductIcon,
  usesPlatformSvg,
} from '@/components/products/product-icon';
import { appToast } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

function StatusBadge({ status, label }: { status: ProductStatus; label: string }) {
  const isAvailable = status === 'available';
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
        isAvailable
          ? 'bg-[color-mix(in_srgb,var(--success)_14%,var(--background))] text-[var(--success)]'
          : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
      )}
    >
      {label}
    </span>
  );
}

interface ProductsGridProps {
  appId: string;
}

export function ProductsGrid({ appId }: ProductsGridProps) {
  const t = useTranslations();
  const p = t.products;
  const items = (p.items ?? {}) as Record<string, { name?: string; desc?: string }>;
  const { isInstalled, install, isInstalling } = useSidebarProducts();

  async function handleInstall(productId: DeveloperProductId) {
    try {
      await install(productId);
      appToast.success(p.installSuccess);
    } catch (error) {
      appToast.fromError(error, p.installFailed);
    }
  }

  return (
    <div className="dashboard-section-stack">
      <DashboardPageHeader
        eyebrow={
          <p className="font-mono text-[11px] text-[var(--muted-foreground)]">
            {appId}
          </p>
        }
        title={p.title}
        description={p.catalogSubtitle}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DEVELOPER_PRODUCTS.map((product) => {
          const meta = items[product.id] ?? {};
          const isAvailable = product.status === 'available';
          const installed = isInstalled(product.id);
          const statusLabel =
            product.status === 'available' ? p.available : p.comingSoon;

          return (
            <article
              key={product.id}
              className={cn(
                'dashboard-card flex flex-col rounded-2xl p-5 sm:rounded-3xl',
                !isAvailable && 'opacity-80',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl',
                    usesPlatformSvg(product.id)
                      ? 'bg-[var(--surface-secondary)]'
                      : 'bg-[color-mix(in_srgb,var(--primary)_10%,var(--background))] text-[var(--primary)]',
                  )}
                >
                  <ProductIcon
                    productId={product.id}
                    className="size-5"
                    lucideClassName="size-5 text-[var(--primary)]"
                  />
                </span>
                <StatusBadge status={product.status} label={statusLabel} />
              </div>

              <div className="mt-4 min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  {meta.name ?? product.id}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  {meta.desc ?? ''}
                </p>
              </div>

              {isAvailable ? (
                installed ? (
                  <div className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-[var(--surface-secondary)] text-xs font-semibold text-[var(--foreground)]">
                    <Check className="size-3.5" />
                    {p.installed}
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isInstalling}
                    onClick={() => void handleInstall(product.id)}
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-[var(--primary)] text-xs font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {isInstalling ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    {p.install}
                  </button>
                )
              ) : (
                <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
                  {p.comingSoonHint}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
