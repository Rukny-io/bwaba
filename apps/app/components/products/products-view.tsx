'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCard, ProductCardSkeleton } from '@/components/products/product-card';
import { ProductDetailSheet } from '@/components/products/product-detail-sheet';
import { PRODUCT_CATALOG_CONFIG } from '@/components/products/product-catalog-config';
import { ProductsToolbar } from '@/components/products/products-toolbar';
import type { ProductsSortOption } from '@/components/products/products-view-mode';
import { fetchStoreProducts, updateProductStatus } from '@/lib/products/api';
import { PRODUCTS_CREATE_PATH } from '@/lib/products/paths';
import type { StoreProduct } from '@/lib/products/types';
import { ApiException } from '@/lib/api-client';
import { exportProductsToCsv } from '@/lib/products/export';
import { sortProducts } from '@/lib/products/sort';
import { cn } from '@/lib/utils';

const config = PRODUCT_CATALOG_CONFIG.products;

export function ProductsView() {
  const router = useRouter();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ProductsSortOption>('newest');
  const [showHidden, setShowHidden] = useState(false);
  const [detailProduct, setDetailProduct] = useState<StoreProduct | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setError(null);
    try {
      const rows = await fetchStoreProducts();
      setProducts(rows);
    } catch (err) {
      setError(
        err instanceof ApiException ? err.message : 'تعذّر تحميل المنتجات',
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const visibleProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = products.filter((product) => {
      if (!showHidden && product.status === 'INACTIVE') {
        return false;
      }

      if (!query) return true;

      const haystack = [
        product.name,
        product.nameAr,
        product.sku,
        product.product_categories?.name,
        product.product_categories?.nameAr,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });

    return sortProducts(filtered, sortBy, products);
  }, [products, searchQuery, showHidden, sortBy]);

  const handleSortByChange = useCallback((nextSort: ProductsSortOption) => {
    setSortBy(nextSort);
  }, []);

  const handleOpenDetails = useCallback((product: StoreProduct) => {
    setDetailProduct(product);
    setDetailOpen(true);
  }, []);

  const handleDetailOpenChange = useCallback((open: boolean) => {
    setDetailOpen(open);
  }, []);

  const handleToggleVisibility = useCallback(async (product: StoreProduct) => {
    const previous = product.status;
    const next = previous === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    setBusyId(product.id);
    setActionError(null);
    setProducts((rows) =>
      rows.map((row) => (row.id === product.id ? { ...row, status: next } : row)),
    );
    setDetailProduct((current) =>
      current?.id === product.id ? { ...current, status: next } : current,
    );
    try {
      await updateProductStatus(product.id, next);
    } catch (err) {
      setProducts((rows) =>
        rows.map((row) =>
          row.id === product.id ? { ...row, status: previous } : row,
        ),
      );
      setDetailProduct((current) =>
        current?.id === product.id ? { ...current, status: previous } : current,
      );
      setActionError(
        err instanceof ApiException ? err.message : 'تعذّر تحديث حالة المنتج',
      );
    } finally {
      setBusyId(null);
    }
  }, []);

  const emptyMessage = useMemo(() => {
    if (searchQuery.trim()) {
      return {
        title: config.searchEmptyTitle,
        description: `جرّب بحثاً مختلفاً عن «${searchQuery}».`,
      };
    }

    return {
      title: config.emptyTitle,
      description: config.emptyDescription,
    };
  }, [searchQuery]);

  const EmptyIcon = config.emptyIcon;

  return (
    <section className="dashboard-page flex flex-col gap-4 pt-5 sm:gap-5 sm:pt-6">
      <ProductsToolbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        showHidden={showHidden}
        onShowHiddenChange={setShowHidden}
        searchPlaceholder={config.searchPlaceholder}
        addButtonLabel={config.addButtonLabel}
        showHiddenLabel={config.showHiddenLabel}
        hiddenSwitchAriaLabel={config.hiddenSwitchAriaLabel}
        exportDisabled={loading || visibleProducts.length === 0}
        onExport={() => exportProductsToCsv(visibleProducts)}
        onAdd={() => router.push(PRODUCTS_CREATE_PATH)}
      />

      {actionError ? (
        <p className="text-[13px] text-[var(--danger)]">{actionError}</p>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-8 text-center">
          <p className="text-[14px] font-medium text-[var(--foreground)]">{error}</p>
        </div>
      ) : loading ? (
        <ProductsGridSkeleton />
      ) : visibleProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-16 text-center sm:py-20">
          <EmptyIcon
            className="mb-3 size-8 text-[var(--muted-foreground)]/70"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="text-[14px] font-medium text-[var(--foreground)]">
            {emptyMessage.title}
          </p>
          <p className="mt-1 max-w-sm text-[13px] text-[var(--muted-foreground)]">
            {emptyMessage.description}
          </p>
        </div>
      ) : (
        <ProductsGrid
          key={sortBy}
          products={visibleProducts}
          sortBy={sortBy}
          busyId={busyId}
          onOpenDetails={handleOpenDetails}
          onToggleVisibility={handleToggleVisibility}
        />
      )}

      <ProductDetailSheet
        product={detailProduct}
        isOpen={detailOpen}
        onOpenChange={handleDetailOpenChange}
      />
    </section>
  );
}

function ProductsGrid({
  products,
  sortBy,
  busyId,
  onOpenDetails,
  onToggleVisibility,
}: {
  products: StoreProduct[];
  sortBy: ProductsSortOption;
  busyId: string | null;
  onOpenDetails: (product: StoreProduct) => void;
  onToggleVisibility: (product: StoreProduct) => void;
}) {
  return (
    <div
      className={cn(
        'product-grid-dnd grid gap-x-5 gap-y-7',
        'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
      )}
      aria-label="شبكة المنتجات"
      data-sort={sortBy}
    >
      {products.map((product, index) => (
        <div
          key={`${sortBy}-${product.id}`}
          className="min-w-0"
          style={{ order: index }}
        >
          <ProductCard
            product={product}
            isBusy={busyId === product.id}
            onOpenDetails={onOpenDetails}
            onToggleVisibility={onToggleVisibility}
          />
        </div>
      ))}
    </div>
  );
}

function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
