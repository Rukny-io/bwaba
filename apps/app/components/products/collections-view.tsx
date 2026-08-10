'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layers, Package } from 'lucide-react';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { CollectionsPageActions } from '@/components/products/collections/collections-page-actions';
import { CreateCollectionDialog } from '@/components/products/collections/create-collection-dialog';
import { EditCollectionDialog } from '@/components/products/collections/edit-collection-dialog';
import { CollectionStrip } from '@/components/products/collections/collection-strip';
import { CollectionProductCard, CollectionProductCardSkeleton } from '@/components/products/collections/collection-product-card';
import {
  fetchCollections,
  fetchMyStoreProducts,
} from '@/lib/collections/api';
import type { MyStoreProduct, ProductCollection } from '@/lib/collections/types';
import { ApiException } from '@/lib/api-client';
import {
  exportAllCollectionsToCsv,
  exportCollectionProductsToCsv,
} from '@/lib/collections/export';
import { PRODUCT_CATALOG_CONFIG } from '@/components/products/product-catalog-config';

const config = PRODUCT_CATALOG_CONFIG.collections;

export function CollectionsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [products, setProducts] = useState<MyStoreProduct[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<ProductCollection | null>(null);

  const loadCollections = useCallback(async () => {
    setError(null);
    try {
      const rows = await fetchCollections(false);
      setCollections(rows);
      setSelectedCollectionId((current) => {
        if (current && rows.some((row) => row.id === current)) return current;
        return rows[0]?.id ?? null;
      });
    } catch (err) {
      setError(
        err instanceof ApiException ? err.message : 'تعذّر تحميل المجموعات',
      );
      setCollections([]);
      setSelectedCollectionId(null);
    } finally {
      setLoadingCollections(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const rows = await fetchMyStoreProducts();
      setProducts(rows.filter((product) => product.status !== 'DISCONTINUED'));
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    void loadCollections();
    void loadProducts();
  }, [loadCollections, loadProducts]);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setCreateOpen(true);
      router.replace('/app/products/collections', { scroll: false });
    }
  }, [searchParams, router]);

  function handleCreateClose() {
    setCreateOpen(false);
  }

  function handleCreated() {
    setCreateOpen(false);
    setLoadingCollections(true);
    void loadCollections();
  }

  const sortedCollections = useMemo(
    () =>
      [...collections].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [collections],
  );

  const selectedCollection = useMemo(
    () => sortedCollections.find((collection) => collection.id === selectedCollectionId) ?? null,
    [selectedCollectionId, sortedCollections],
  );

  const collectionProducts = useMemo(() => {
    if (!selectedCollection) return [];

    const idSet = new Set(selectedCollection.productIds);
    const byId = new Map(products.map((product) => [product.id, product]));

    return selectedCollection.productIds
      .map((id) => byId.get(id))
      .filter((product): product is MyStoreProduct => Boolean(product));
  }, [products, selectedCollection]);

  const productsLoading = loadingCollections || loadingProducts;

  const hasExportableData = useMemo(() => {
    if (!sortedCollections.length) return false;
    if (selectedCollection && collectionProducts.length > 0) return true;
    return sortedCollections.some((collection) => collection.productIds.length > 0);
  }, [collectionProducts.length, selectedCollection, sortedCollections]);

  function handleExport() {
    if (!sortedCollections.length) return;

    if (selectedCollection && collectionProducts.length > 0) {
      exportCollectionProductsToCsv(selectedCollection, collectionProducts);
      return;
    }

    exportAllCollectionsToCsv(sortedCollections, products);
  }

  return (
    <section className="dashboard-page flex flex-col gap-5 sm:gap-6">
      <CreateCollectionDialog
        open={createOpen}
        onClose={handleCreateClose}
        onCreated={handleCreated}
      />

      <EditCollectionDialog
        collection={editingCollection}
        open={Boolean(editingCollection)}
        onClose={() => setEditingCollection(null)}
        onUpdated={() => {
          setLoadingCollections(true);
          void loadCollections();
        }}
        onDeleted={() => {
          setEditingCollection(null);
          setLoadingCollections(true);
          void loadCollections();
        }}
      />

      <DashboardPageHeader
        title="المجموعات"
        description="نظّم منتجاتك في مجموعات واعرضها في متجرك"
        className="mb-0"
        actions={
          <CollectionsPageActions
            addLabel={config.addButtonLabel}
            onAdd={() => setCreateOpen(true)}
            onExport={handleExport}
            exportDisabled={loadingCollections || !hasExportableData}
            exportLabel={
              selectedCollection && collectionProducts.length > 0
                ? 'تصدير المجموعة'
                : 'تصدير الكل'
            }
          />
        }
      />

      {error ? (
        <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-8 text-center">
          <p className="text-[14px] font-medium text-[var(--foreground)]">{error}</p>
        </div>
      ) : (
        <>
          <CollectionStrip
            collections={sortedCollections}
            selectedCollectionId={selectedCollectionId}
            loading={loadingCollections}
            onSelect={setSelectedCollectionId}
            onEdit={setEditingCollection}
          />

          {loadingCollections ? null : sortedCollections.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center sm:py-20">
              <Layers
                className="mb-3 size-8 text-[var(--muted-foreground)]/70"
                strokeWidth={1.5}
                aria-hidden
              />
              <p className="text-[14px] font-medium text-[var(--foreground)]">
                {config.emptyTitle}
              </p>
              <p className="mt-1 max-w-sm text-[13px] text-[var(--muted-foreground)]">
                {config.emptyDescription}
              </p>
            </div>
          ) : selectedCollection ? (
            <div className="flex flex-col gap-4">
              {selectedCollection.description?.trim() ? (
                <p
                  dir="auto"
                  className="max-w-2xl text-[13px] leading-relaxed text-[var(--muted-foreground)]"
                >
                  {selectedCollection.description}
                </p>
              ) : null}

              {productsLoading ? (
                <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <CollectionProductCardSkeleton key={index} />
                  ))}
                </div>
              ) : collectionProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] px-4 py-14 text-center">
                  <Package
                    className="mb-3 size-8 text-[var(--muted-foreground)]/70"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <p className="text-[14px] font-medium text-[var(--foreground)]">
                    لا توجد منتجات في هذه المجموعة
                  </p>
                  <p className="mt-1 max-w-sm text-[13px] text-[var(--muted-foreground)]">
                    أضف منتجات عند إنشاء المجموعة أو عدّلها لاحقاً.
                  </p>
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                  aria-label="منتجات هذه المجموعة"
                >
                  {collectionProducts.map((product) => (
                    <CollectionProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
