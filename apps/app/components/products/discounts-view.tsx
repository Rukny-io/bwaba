'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, Pause, Pencil, Percent, Play, Plus, Trash2 } from 'lucide-react';
import { Button } from '@heroui/react';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import {
  dashboardPagePanelClass,
  dashboardPageSectionClass,
} from '@/components/app/dashboard-page-frame';
import { CreateDiscountDialog } from '@/components/products/discounts/create-discount-dialog';
import { EditDiscountDialog } from '@/components/products/discounts/edit-discount-dialog';
import { DiscountStrip } from '@/components/products/discounts/discount-strip';
import { DiscountsPageActions } from '@/components/products/discounts/discounts-page-actions';
import {
  CollectionProductCard,
  CollectionProductCardSkeleton,
} from '@/components/products/collections/collection-product-card';
import { PRODUCT_CATALOG_CONFIG } from '@/components/products/product-catalog-config';
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
import { cn } from '@/lib/utils';

const config = PRODUCT_CATALOG_CONFIG.discounts;

const panelActionClass =
  'h-9 shrink-0 gap-1.5 rounded-lg px-3 text-sm font-medium';

export function DiscountsView() {
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
        err instanceof ApiException ? err.message : 'تعذّر تحميل الخصومات',
      );
      setDiscounts([]);
      setSelectedDiscountId(null);
    } finally {
      setLoadingDiscounts(false);
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

  const handleToggleActive = useCallback(async (discount: ProductDiscount) => {
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
        err instanceof ApiException ? err.message : 'تعذّر تحديث حالة الخصم',
      );
    } finally {
      setBusyId(null);
    }
  }, []);

  const handleDelete = useCallback(async (discount: ProductDiscount) => {
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
        err instanceof ApiException ? err.message : 'تعذّر حذف الخصم',
      );
    } finally {
      setBusyId(null);
    }
  }, [loadDiscounts]);

  return (
    <section className={dashboardPageSectionClass}>
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
            aria-label="إغلاق"
            onClick={() => setPendingDelete(null)}
          />
          <div className="relative flex h-full items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-discount-title"
              dir="rtl"
              className="relative w-full max-w-sm rounded-2xl bg-[var(--surface)] p-5 ring-1 ring-[var(--border)]"
            >
              <h2
                id="delete-discount-title"
                className="text-base font-semibold text-[var(--foreground)]"
              >
                حذف {formatDiscountLabel(pendingDelete.percentage)}؟
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                يُلغى الخصم عن المنتجات المشمولة ولا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="mt-5 flex gap-2">
                <Button
                  variant="danger"
                  isDisabled={busyId === pendingDelete.id}
                  onPress={() => void handleDelete(pendingDelete)}
                  className="h-9 flex-1 rounded-lg text-sm font-medium"
                >
                  حذف الخصم
                </Button>
                <Button
                  variant="secondary"
                  isDisabled={busyId === pendingDelete.id}
                  onPress={() => setPendingDelete(null)}
                  className="h-9 rounded-lg px-4 text-sm font-medium"
                >
                  تراجع
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <DashboardPageHeader
        title="الخصومات"
        description="طبّق خصماً بنسبة مئوية على منتجات محددة في متجرك"
        actions={
          <DiscountsPageActions
            addLabel={config.addButtonLabel}
            onAdd={() => setCreateOpen(true)}
          />
        }
      />

      {error ? (
        <div
          className={cn(
            dashboardPagePanelClass,
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
            dashboardPagePanelClass,
            'items-center border border-dashed border-[var(--border)] py-16 text-center sm:py-20',
          )}
        >
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <Percent className="size-5" strokeWidth={1.75} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
            {config.emptyTitle}
          </p>
          <p className="mt-1 max-w-sm text-xs text-[var(--muted-foreground)] sm:text-sm">
            {config.emptyDescription}
          </p>
          <Button
            onPress={() => setCreateOpen(true)}
            className="mt-5 h-9 gap-1.5 rounded-lg bg-[var(--primary)] px-3.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            <Plus className="size-3.5" strokeWidth={2.25} aria-hidden />
            {config.addButtonLabel}
          </Button>
        </div>
      ) : null}

      {!error && (loadingDiscounts || sortedDiscounts.length > 0) ? (
        <div className={cn(dashboardPagePanelClass, 'gap-4')}>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              خصوماتك
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {loadingDiscounts
                ? 'جاري التحميل…'
                : `${formatNumber(sortedDiscounts.length)} خصم`}
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
        <div className={cn(dashboardPagePanelClass, 'gap-5')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  {formatDiscountLabel(selectedDiscount.percentage)}
                </h2>
                <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
                  {formatNumber(discountedProducts.length)} منتج
                </span>
                {!selectedDiscount.isActive ? (
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[var(--warning)]">
                    متوقف
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {selectedDiscount.productsCount === 1
                  ? 'يشمل منتجاً واحداً'
                  : `يشمل ${formatNumber(selectedDiscount.productsCount)} منتجات`}
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
                تعديل
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
                {selectedDiscount.isActive ? 'إيقاف' : 'تفعيل'}
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
                حذف
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
                لا توجد منتجات في هذا الخصم
              </p>
              <p className="mt-1 max-w-sm text-xs text-[var(--muted-foreground)] sm:text-sm">
                أضف منتجات عند إنشاء الخصم أو عدّله لاحقاً.
              </p>
              <Button
                variant="ghost"
                onPress={() => setEditingDiscount(selectedDiscount)}
                className="mt-4 h-9 rounded-lg px-3 text-sm font-medium text-[var(--primary)] hover:bg-[var(--surface-secondary)]"
              >
                تعديل الخصم
              </Button>
            </div>
          ) : (
            <div
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
              aria-label="منتجات هذا الخصم"
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
