'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pencil, Pause, Play, Package, Percent, Plus, Trash2 } from 'lucide-react';
import { Button } from '@heroui/react';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { CreateDiscountDialog } from '@/components/products/discounts/create-discount-dialog';
import { EditDiscountDialog } from '@/components/products/discounts/edit-discount-dialog';
import { DiscountStrip } from '@/components/products/discounts/discount-strip';
import {
  CollectionProductCard,
  CollectionProductCardSkeleton,
} from '@/components/products/collections/collection-product-card';
import { PRODUCT_CATALOG_CONFIG } from '@/components/products/product-catalog-config';
import { fetchMyStoreProducts } from '@/lib/collections/api';
import type { MyStoreProduct } from '@/lib/collections/types';
import { fetchDiscounts, deleteDiscount, toggleDiscountActive, formatDiscountLabel } from '@/lib/discounts/api';
import type { ProductDiscount } from '@/lib/discounts/types';
import { ApiException } from '@/lib/api-client';

const config = PRODUCT_CATALOG_CONFIG.discounts;

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
    [discounts, selectedDiscountId, sortedDiscounts],
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
    <section className="dashboard-page flex flex-col gap-5 sm:gap-6">
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
              className="relative w-full max-w-sm rounded-2xl border border-[rgba(34,34,34,0.1)] bg-white p-5 shadow-[0px_8px_12px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-zinc-950"
            >
              <h2
                id="delete-discount-title"
                className="text-[15px] font-semibold text-[var(--foreground)]"
              >
                حذف {formatDiscountLabel(pendingDelete.percentage)}؟
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
                يُلغى الخصم عن المنتجات المشمولة ولا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="mt-5 flex gap-2">
                <Button
                  variant="danger"
                  isDisabled={busyId === pendingDelete.id}
                  onPress={() => void handleDelete(pendingDelete)}
                  className="h-10 flex-1 rounded-xl text-[13px] font-semibold"
                >
                  حذف الخصم
                </Button>
                <Button
                  variant="secondary"
                  isDisabled={busyId === pendingDelete.id}
                  onPress={() => setPendingDelete(null)}
                  className="h-10 rounded-xl px-4 text-[13px]"
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
        className="mb-0"
        actions={
          <Button
            onPress={() => setCreateOpen(true)}
            className="h-10 shrink-0 gap-2 rounded-xl px-4 text-[13px] font-bold shadow-[0_4px_14px_rgba(59,130,246,0.22)] bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95 sm:text-[14px]"
          >
            <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            <span>{config.addButtonLabel}</span>
          </Button>
        }
      />

      {error ? (
        <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-8 text-center">
          <p className="text-[14px] font-medium text-[var(--foreground)]">{error}</p>
        </div>
      ) : (
        <>
          <DiscountStrip
            discounts={sortedDiscounts}
            selectedDiscountId={selectedDiscountId}
            loading={loadingDiscounts}
            busyId={busyId}
            onSelect={setSelectedDiscountId}
            onEdit={setEditingDiscount}
            onToggleActive={(discount) => void handleToggleActive(discount)}
            onDelete={setPendingDelete}
          />

          {actionError ? (
            <p className="text-[13px] text-[var(--danger)]">{actionError}</p>
          ) : null}

          {loadingDiscounts ? null : sortedDiscounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center sm:py-20">
              <Percent
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
          ) : selectedDiscount ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] text-[var(--muted-foreground)]">
                  {formatDiscountLabel(selectedDiscount.percentage)}
                  {selectedDiscount.isActive ? '' : ' · متوقف'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={() => setEditingDiscount(selectedDiscount)}
                    className="h-9 gap-1.5 rounded-xl px-3 text-[13px]"
                  >
                    <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={busyId === selectedDiscount.id}
                    onPress={() => void handleToggleActive(selectedDiscount)}
                    className="h-9 gap-1.5 rounded-xl px-3 text-[13px]"
                  >
                    {selectedDiscount.isActive ? (
                      <Pause className="size-3.5" strokeWidth={2} aria-hidden />
                    ) : (
                      <Play className="size-3.5" strokeWidth={2} aria-hidden />
                    )}
                    {selectedDiscount.isActive ? 'إيقاف' : 'تفعيل'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    isDisabled={busyId === selectedDiscount.id}
                    onPress={() => setPendingDelete(selectedDiscount)}
                    className="h-9 gap-1.5 rounded-xl px-3 text-[13px]"
                  >
                    <Trash2 className="size-3.5" strokeWidth={2} aria-hidden />
                    حذف
                  </Button>
                </div>
              </div>

              {productsLoading ? (
                <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <CollectionProductCardSkeleton key={index} />
                  ))}
                </div>
              ) : discountedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] px-4 py-14 text-center">
                  <Package
                    className="mb-3 size-8 text-[var(--muted-foreground)]/70"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <p className="text-[14px] font-medium text-[var(--foreground)]">
                    لا توجد منتجات في هذا الخصم
                  </p>
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                  aria-label="منتجات هذا الخصم"
                >
                  {discountedProducts.map((product) => (
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
