'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, Percent, Plus } from 'lucide-react';
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
import { fetchDiscounts } from '@/lib/discounts/api';
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
            onSelect={setSelectedDiscountId}
            onEdit={setEditingDiscount}
          />

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
