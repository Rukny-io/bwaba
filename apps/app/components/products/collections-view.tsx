'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layers, Package, Pencil, Plus } from 'lucide-react';
import { Button } from '@heroui/react';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { CollectionsPageActions } from '@/components/products/collections/collections-page-actions';
import { CreateCollectionDialog } from '@/components/products/collections/create-collection-dialog';
import { EditCollectionDialog } from '@/components/products/collections/edit-collection-dialog';
import { CollectionStrip } from '@/components/products/collections/collection-strip';
import {
  CollectionProductCard,
  CollectionProductCardSkeleton,
} from '@/components/products/collections/collection-product-card';
import {
  fetchCollections,
  fetchMyStoreProducts,
  getCollectionDisplayName,
} from '@/lib/collections/api';
import type { MyStoreProduct, ProductCollection } from '@/lib/collections/types';
import { ApiException } from '@/lib/api-client';
import {
  exportAllCollectionsToCsv,
  exportCollectionProductsToCsv,
} from '@/lib/collections/export';
import { formatNumber } from '@/lib/dashboard-format';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function CollectionsView() {
  const { t } = useTranslations();
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
        err instanceof ApiException ? err.message : t('collections.loadFailed'),
      );
      setCollections([]);
      setSelectedCollectionId(null);
    } finally {
      setLoadingCollections(false);
    }
  }, [t]);

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
    <section className="dashboard-page flex w-full min-w-0 flex-col gap-4 pt-5 sm:gap-4 sm:pt-6">
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

      <div className="rounded-xl bg-[var(--surface)] p-4 sm:p-5">
        <DashboardPageHeader
          className="mb-0"
          title={t('collections.title')}
          description={t('collections.description')}
          actions={
            <CollectionsPageActions
              addLabel={t('collections.add')}
              onAdd={() => setCreateOpen(true)}
              onExport={handleExport}
              exportDisabled={loadingCollections || !hasExportableData}
              exportLabel={
                selectedCollection && collectionProducts.length > 0
                  ? t('collections.exportOne')
                  : t('collections.exportAll')
              }
            />
          }
        />
      </div>

      {error ? (
        <div
          className={cn(
            'rounded-xl bg-[var(--surface)] p-4 sm:p-5',
            'border border-[var(--danger)]/20 bg-[var(--danger)]/5 text-center',
          )}
        >
          <p className="text-sm font-medium text-[var(--danger)]">{error}</p>
        </div>
      ) : null}

      {!error && !loadingCollections && sortedCollections.length === 0 ? (
        <div
          className={cn(
            'rounded-xl bg-[var(--surface)] p-4 sm:p-5',
            'items-center border border-dashed border-[var(--border)] py-16 text-center sm:py-20',
          )}
        >
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <Layers className="size-5" strokeWidth={1.75} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
            {t('collections.emptyTitle')}
          </p>
          <p className="mt-1 max-w-sm text-xs text-[var(--muted-foreground)] sm:text-sm">
            {t('collections.emptyDescription')}
          </p>
          <Button
            onPress={() => setCreateOpen(true)}
            className="mt-5 h-9 gap-1.5 rounded-lg bg-[var(--primary)] px-3.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            {t('collections.add')}
          </Button>
        </div>
      ) : null}

      {!error && (loadingCollections || sortedCollections.length > 0) ? (
        <div className={cn('rounded-xl bg-[var(--surface)] p-4 sm:p-5', 'gap-4')}>
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                {t('collections.yourCollections')}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {loadingCollections
                  ? t('collections.loading')
                  : t('collections.count', { n: formatNumber(sortedCollections.length) })}
              </p>
            </div>
          </div>

          <CollectionStrip
            collections={sortedCollections}
            selectedCollectionId={selectedCollectionId}
            loading={loadingCollections}
            onSelect={setSelectedCollectionId}
            onEdit={setEditingCollection}
          />
        </div>
      ) : null}

      {!error && selectedCollection ? (
        <div className={cn('rounded-xl bg-[var(--surface)] p-4 sm:p-5', 'gap-5')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  dir="auto"
                  className="text-base font-semibold text-[var(--foreground)]"
                >
                  {getCollectionDisplayName(selectedCollection)}
                </h2>
                <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
                  {t('collections.productCount', { n: formatNumber(collectionProducts.length) })}
                </span>
                {!selectedCollection.isActive ? (
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[var(--warning)]">
                    {t('collections.hidden')}
                  </span>
                ) : null}
              </div>
              {selectedCollection.description?.trim() ? (
                <p
                  dir="auto"
                  className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]"
                >
                  {selectedCollection.description}
                </p>
              ) : null}
            </div>

            <Button
              variant="ghost"
              onPress={() => setEditingCollection(selectedCollection)}
              className="h-9 shrink-0 gap-1.5 rounded-lg px-3 text-sm font-medium text-[var(--foreground)] !shadow-none hover:bg-[var(--surface-secondary)]"
            >
              <Pencil className="size-3.5" aria-hidden />
              {t('collections.edit')}
            </Button>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <CollectionProductCardSkeleton key={index} />
              ))}
            </div>
          ) : collectionProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-[var(--surface-secondary)]/50 px-4 py-14 text-center">
              <Package
                className="mb-3 size-8 text-[var(--muted-foreground)]/70"
                strokeWidth={1.5}
                aria-hidden
              />
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {t('collections.emptyProductsTitle')}
              </p>
              <p className="mt-1 max-w-sm text-xs text-[var(--muted-foreground)] sm:text-sm">
                {t('collections.emptyProductsDescription')}
              </p>
              <Button
                variant="ghost"
                onPress={() => setEditingCollection(selectedCollection)}
                className="mt-4 h-9 rounded-lg px-3 text-sm font-medium text-[var(--primary)] hover:bg-[var(--surface-secondary)]"
              >
                {t('collections.editCollection')}
              </Button>
            </div>
          ) : (
            <div
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
              aria-label={t('collections.productsAria')}
            >
              {collectionProducts.map((product) => (
                <CollectionProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
