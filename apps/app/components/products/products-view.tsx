'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProductCard, ProductCardSkeleton } from '@/components/products/product-card';
import { ProductDetailSheet } from '@/components/products/product-detail-sheet';
import { ProductsToolbar } from '@/components/products/products-toolbar';
import type { ProductsSortOption } from '@/components/products/products-view-mode';
import {
  deleteProduct,
  fetchStoreProducts,
  getProductDisplayName,
  updateProductStatus,
} from '@/lib/products/api';
import {
  readCachedStoreProducts,
  writeCachedStoreProducts,
} from '@/lib/products/products-cache';
import { getProductCreateKindPath, PRODUCTS_CREATE_PATH } from '@/lib/products/paths';
import { resolveProductKind } from '@/lib/products/product-display';
import type { StoreProduct } from '@/lib/products/types';
import { ApiException } from '@/lib/api-client';
import { exportProductsToCsv } from '@/lib/products/export';
import { sortProducts } from '@/lib/products/sort';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function ProductsView() {
  const { t } = useTranslations();
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

  useEffect(() => {
    const cached = readCachedStoreProducts();
    if (cached.length > 0) {
      setProducts(cached);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setError(null);
    try {
      const rows = await fetchStoreProducts();
      setProducts(rows);
      writeCachedStoreProducts(rows);
    } catch (err) {
      const message =
        err instanceof ApiException ? err.message : t('products.loadFailed');
      const cached = readCachedStoreProducts();

      setProducts((current) => {
        if (current.length > 0) return current;
        if (cached.length > 0) return cached;
        return [];
      });

      if (
        cached.length > 0 &&
        typeof navigator !== 'undefined' &&
        !navigator.onLine
      ) {
        setError(t('products.offlineCached'));
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

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

  const handleEdit = useCallback(
    (product: StoreProduct) => {
      setDetailOpen(false);
      router.push(
        `${getProductCreateKindPath(resolveProductKind(product))}?edit=${product.id}`,
      );
    },
    [router],
  );

  const handleDelete = useCallback(async (product: StoreProduct) => {
    const label = getProductDisplayName(product);
    if (!window.confirm(t('products.deleteConfirm', { name: label }))) {
      return;
    }

    setBusyId(product.id);
    setActionError(null);

    const previous = products;
    const next = products.filter((row) => row.id !== product.id);
    setProducts(next);
    writeCachedStoreProducts(next);

    if (detailProduct?.id === product.id) {
      setDetailOpen(false);
      setDetailProduct(null);
    }

    try {
      await deleteProduct(product.id);
    } catch (err) {
      setProducts(previous);
      writeCachedStoreProducts(previous);
      setActionError(
        err instanceof ApiException ? err.message : t('products.deleteFailed'),
      );
    } finally {
      setBusyId(null);
    }
  }, [products, detailProduct?.id, t]);

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
        err instanceof ApiException ? err.message : t('products.statusFailed'),
      );
    } finally {
      setBusyId(null);
    }
  }, [t]);

  const emptyMessage = useMemo(() => {
    if (searchQuery.trim()) {
      return {
        title: t('products.searchEmptyTitle'),
        description: t('products.searchEmptyDescription', { query: searchQuery }),
      };
    }

    return {
      title: t('products.emptyTitle'),
      description: t('products.emptyDescription'),
    };
  }, [searchQuery, t]);

  return (
    <section className="dashboard-page flex flex-col gap-4 pt-5 sm:gap-4 sm:pt-6">
      <div className="rounded-xl bg-[var(--surface)] p-4 sm:p-5">
        <div className="mb-4 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
            {t('products.title')}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
            {t('products.description')}
          </p>
        </div>
        <ProductsToolbar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          sortBy={sortBy}
          onSortByChange={handleSortByChange}
          showHidden={showHidden}
          onShowHiddenChange={setShowHidden}
          exportDisabled={loading || visibleProducts.length === 0}
          onExport={() => exportProductsToCsv(visibleProducts)}
          onAdd={() => router.push(PRODUCTS_CREATE_PATH)}
        />
      </div>

      {actionError ? (
        <p className="text-[13px] text-[var(--danger)]">{actionError}</p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-8 text-center">
          <p className="text-[14px] font-medium text-[var(--foreground)]">{error}</p>
        </div>
      ) : loading ? (
        <div className="rounded-xl bg-[var(--surface)] p-4 sm:p-5">
          <ProductsGridSkeleton />
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-16 text-center sm:py-20">
          <Package
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
        <div className="rounded-xl bg-[var(--surface)] p-4 sm:p-5">
          <ProductsGrid
            key={sortBy}
            products={visibleProducts}
            sortBy={sortBy}
            busyId={busyId}
            gridLabel={t('products.gridAria')}
            onOpenDetails={handleOpenDetails}
            onToggleVisibility={handleToggleVisibility}
            onDelete={handleDelete}
          />
        </div>
      )}

      <ProductDetailSheet
        product={detailProduct}
        isOpen={detailOpen}
        isBusy={detailProduct ? busyId === detailProduct.id : false}
        onOpenChange={handleDetailOpenChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onProductUpdated={(updated) => {
          setProducts((rows) => {
            const next = rows.map((row) =>
              row.id === updated.id ? updated : row,
            );
            writeCachedStoreProducts(next);
            return next;
          });
          setDetailProduct(updated);
        }}
      />
    </section>
  );
}

function ProductsGrid({
  products,
  sortBy,
  busyId,
  gridLabel,
  onOpenDetails,
  onToggleVisibility,
  onDelete,
}: {
  products: StoreProduct[];
  sortBy: ProductsSortOption;
  busyId: string | null;
  gridLabel: string;
  onOpenDetails: (product: StoreProduct) => void;
  onToggleVisibility: (product: StoreProduct) => void;
  onDelete: (product: StoreProduct) => void;
}) {
  return (
    <div
      className={cn(
        'product-grid-dnd grid gap-x-3 gap-y-4 sm:gap-x-3.5 sm:gap-y-5',
        'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
      )}
      aria-label={gridLabel}
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
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}

function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-2 sm:gap-x-3.5 sm:gap-y-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
