'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, Pause, Pencil, Percent, Play, Plus, Trash2 } from 'lucide-react';
import { Button } from '@heroui/react';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { CreateDiscountDialog } from '@/components/products/discounts/create-discount-dialog';
import { EditDiscountDialog } from '@/components/products/discounts/edit-discount-dialog';
import { DiscountStrip } from '@/components/products/discounts/discount-strip';
import { DiscountsPageActions } from '@/components/products/discounts/discounts-page-actions';
import {
  CollectionProductCard,
  CollectionProductCardSkeleton,
} from '@/components/products/collections/collection-product-card';
import { fetchMyStoreProducts } from '@/lib/collections/api';
import type { MyStoreProduct } from '@/lib/collections/types';
import {
  deleteDiscount,
  fetchDiscounts,
  formatDiscountLabel,
  toggleDiscountActive,
} from '@/lib/discounts/api';
import type { ProductDiscount } from '@/lib/discounts/types';
import { ApiException } from '@/lib/api-client';
import { formatNumber } from '@/lib/dashboard-format';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const panelClass = 'rounded-xl bg-[var(--surface)] p-4 sm:p-5';
const panelActionClass =
  'h-9 shrink-0 gap-1.5 rounded-lg px-3 text-sm font-medium !shadow-none';

export function DiscountsView() {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [discounts, setDiscounts] = useState<ProductDiscount[]>([]);
  const [products, setProducts] = useState<MyStoreProduct[]>([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);
  const [loadingDiscounts, setLoadingDiscounts] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<ProductDiscount | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProductDiscount | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadDiscounts = useCallback(async () => {
    setError(null);
    try {
      const rows = await fetchDiscounts(true);
      setDiscounts(rows);
      setSelectedDiscountId((current) => {
        if (current && rows.some((row) => row.id === current)) return current;
        return rows[0]?.id ?? null;
      });
    } catch (err) {
      setError(
        err instanceof ApiException ? err.message : t('discounts.loadFailed'),
      );
      setDiscounts([]);
      setSelectedDiscountId(null);
    } finally {
      setLoadingDiscounts(false);
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
    void loadDiscounts();
    void loadProducts();
  }, [loadDiscounts, loadProducts]);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setCreateOpen(true);
      router.replace('/app/products/discounts', { scroll: false });
    }
  }, [searchParams, router]);

  const sortedDiscounts = useMemo(
    () =>
      [...discounts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [discounts],
  );

  const selectedDiscount = useMemo(
    () => sortedDiscounts.find((discount) => discount.id === selectedDiscountId) ?? null,
    [selectedDiscountId, sortedDiscounts],
  );

  const discountedProducts = useMemo(() => {
    if (!selectedDiscount) return [];

    const byId = new Map(products.map((product) => [product.id, product]));

    return selectedDiscount.productIds
      .map((id) => byId.get(id))
      .filter((product): product is MyStoreProduct => Boolean(product));
  }, [products, selectedDiscount]);

  const productsLoading = loadingDiscounts || loadingProducts;

  const handleToggleActive = useCallback(
    async (discount: ProductDiscount) => {
      const previous = discount.isActive;
      setBusyId(discount.id);
      setActionError(null);
      setDiscounts((rows) =>
        rows.map((row) =>
          row.id === discount.id ? { ...row, isActive: !previous } : row,
        ),
      );
      try {
        await toggleDiscountActive(discount.id);
      } catch (err) {
        setDiscounts((rows) =>
          rows.map((row) =>
            row.id === discount.id ? { ...row, isActive: previous } : row,
          ),
        );
        setActionError(
          err instanceof ApiException ? err.message : t('discounts.toggleFailed'),
        );
      } finally {
        setBusyId(null);
      }
    },
    [t],
  );

  const handleDelete = useCallback(
    async (discount: ProductDiscount) => {
      setBusyId(discount.id);
      setActionError(null);
      try {
        await deleteDiscount(discount.id);
        setPendingDelete(null);
        setEditingDiscount((current) =>
          current?.id === discount.id ? null : current,
        );
        setLoadingDiscounts(true);
        await loadDiscounts();
      } catch (err) {
        setActionError(
          err instanceof ApiException ? err.message : t('discounts.deleteFailed'),
        );
      } finally {
        setBusyId(null);
      }
    },
    [loadDiscounts, t],
  );

  return (
    <section className="dashboard-page flex w-full min-w-0 flex-col gap-4 pt-5 sm:gap-4 sm:pt-6">
      <CreateDiscountDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        discounts={discounts}
        onCreated={() => {
          setLoadingDiscounts(true);
          void loadDiscounts();
        }}
      />

      <EditDiscountDialog
        discount={editingDiscount}
        allDiscounts={discounts}
        open={Boolean(editingDiscount)}
        onClose={() => setEditingDiscount(null)}
        onUpdated={() => {
          setLoadingDiscounts(true);
          void loadDiscounts();
        }}
        onDeleted={() => {
          setEditingDiscount(null);
          setLoadingDiscounts(true);
          void loadDiscounts();
        }}
      />

      {pendingDelete ? (
        <div className="fixed inset-0 z-[120]">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            aria-label={t('discounts.close')}
            onClick={() => setPendingDelete(null)}
          />
          <div className="relative flex h-full items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-discount-title"
              className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 !shadow-none"
            >
              <h2
                id="delete-discount-title"
                className="text-base font-semibold text-[var(--foreground)]"
              >
                {t('discounts.deleteTitle', {
                  label: formatDiscountLabel(pendingDelete.percentage),
                })}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {t('discounts.deleteBody')}
              </p>
              <div className="mt-5 flex gap-2">
                <Button
                  variant="danger"
                  isDisabled={busyId === pendingDelete.id}
                  onPress={() => void handleDelete(pendingDelete)}
                  className="h-9 flex-1 rounded-lg text-sm font-medium"
                >
                  {t('discounts.deleteConfirm')}
                </Button>
                <Button
                  variant="secondary"
                  isDisabled={busyId === pendingDelete.id}
                  onPress={() => setPendingDelete(null)}
                  className="h-9 rounded-lg px-4 text-sm font-medium"
                >
                  {t('discounts.undo')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className={panelClass}>
        <DashboardPageHeader
          className="mb-0"
          title={t('discounts.title')}
          description={t('discounts.description')}
          actions={
            <DiscountsPageActions
              addLabel={t('discounts.add')}
              onAdd={() => setCreateOpen(true)}
            />
          }
        />
      </div>

      {error ? (
        <div
          className={cn(
            panelClass,
            'border border-[var(--danger)]/20 bg-[var(--danger)]/5 text-center',
          )}
        >
          <p className="text-sm font-medium text-[var(--danger)]">{error}</p>
        </div>
      ) : null}

      {actionError ? (
        <p className="text-sm text-[var(--danger)]">{actionError}</p>
      ) : null}

      {!error && !loadingDiscounts && sortedDiscounts.length === 0 ? (
        <div
          className={cn(
            panelClass,
            'items-center border border-dashed border-[var(--border)] py-16 text-center sm:py-20',
          )}
        >
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <Percent className="size-5" strokeWidth={1.75} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
            {t('discounts.emptyTitle')}
          </p>
          <p className="mt-1 max-w-sm text-xs text-[var(--muted-foreground)] sm:text-sm">
            {t('discounts.emptyDescription')}
          </p>
          <Button
            onPress={() => setCreateOpen(true)}
            className="mt-5 h-9 gap-1.5 rounded-lg bg-[var(--primary)] px-3.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            <Plus className="size-3.5" strokeWidth={2.25} aria-hidden />
            {t('discounts.add')}
          </Button>
        </div>
      ) : null}

      {!error && (loadingDiscounts || sortedDiscounts.length > 0) ? (
        <div className={cn(panelClass, 'gap-4')}>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              {t('discounts.yourDiscounts')}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {loadingDiscounts
                ? t('discounts.loading')
                : t('discounts.count', { n: formatNumber(sortedDiscounts.length) })}
            </p>
          </div>

          <DiscountStrip
            discounts={sortedDiscounts}
            selectedDiscountId={selectedDiscountId}
            loading={loadingDiscounts}
            onSelect={setSelectedDiscountId}
            onEdit={setEditingDiscount}
          />
        </div>
      ) : null}

      {!error && selectedDiscount ? (
        <div className={cn(panelClass, 'gap-5')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  {formatDiscountLabel(selectedDiscount.percentage)}
                </h2>
                <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
                  {t('discounts.productCount', {
                    n: formatNumber(discountedProducts.length),
                  })}
                </span>
                {!selectedDiscount.isActive ? (
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[var(--warning)]">
                    {t('discounts.inactive')}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {selectedDiscount.productsCount === 1
                  ? t('discounts.coversOne')
                  : t('discounts.coversMany', {
                      n: formatNumber(selectedDiscount.productsCount),
                    })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                onPress={() => setEditingDiscount(selectedDiscount)}
                className={cn(
                  panelActionClass,
                  'bg-[var(--surface-secondary)] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--surface-secondary)_80%,var(--foreground)_8%)]',
                )}
              >
                <Pencil className="size-3.5" aria-hidden />
                {t('discounts.edit')}
              </Button>
              <Button
                variant="ghost"
                isDisabled={busyId === selectedDiscount.id}
                onPress={() => void handleToggleActive(selectedDiscount)}
                className={cn(
                  panelActionClass,
                  'bg-[var(--surface-secondary)] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--surface-secondary)_80%,var(--foreground)_8%)]',
                )}
              >
                {selectedDiscount.isActive ? (
                  <Pause className="size-3.5" aria-hidden />
                ) : (
                  <Play className="size-3.5" aria-hidden />
                )}
                {selectedDiscount.isActive
                  ? t('discounts.pause')
                  : t('discounts.activate')}
              </Button>
              <Button
                variant="ghost"
                isDisabled={busyId === selectedDiscount.id}
                onPress={() => setPendingDelete(selectedDiscount)}
                className={cn(
                  panelActionClass,
                  'text-[var(--danger)] hover:bg-[var(--danger)]/10',
                )}
              >
                <Trash2 className="size-3.5" aria-hidden />
                {t('discounts.delete')}
              </Button>
            </div>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <CollectionProductCardSkeleton key={index} />
              ))}
            </div>
          ) : discountedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-[var(--surface-secondary)]/50 px-4 py-14 text-center">
              <Package
                className="mb-3 size-8 text-[var(--muted-foreground)]/70"
                strokeWidth={1.5}
                aria-hidden
              />
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {t('discounts.emptyProductsTitle')}
              </p>
              <p className="mt-1 max-w-sm text-xs text-[var(--muted-foreground)] sm:text-sm">
                {t('discounts.emptyProductsDescription')}
              </p>
              <Button
                variant="ghost"
                onPress={() => setEditingDiscount(selectedDiscount)}
                className="mt-4 h-9 rounded-lg px-3 text-sm font-medium text-[var(--primary)] hover:bg-[var(--surface-secondary)]"
              >
                {t('discounts.editDiscount')}
              </Button>
            </div>
          ) : (
            <div
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
              aria-label={t('discounts.productsAria')}
            >
              {discountedProducts.map((product) => (
                <CollectionProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
