'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Check, Loader2, Minus, Package, Plus, Trash2 } from 'lucide-react';
import { Alert } from '@heroui/react';
import { ApiException } from '@/lib/api-client';
import {
  fetchMyStoreProducts,
  getProductDisplayName,
} from '@/lib/collections/api';
import type { MyStoreProduct } from '@/lib/collections/types';
import {
  calculateDiscountedPrice,
  deleteDiscount,
  updateDiscount,
} from '@/lib/discounts/api';
import type { ProductDiscount } from '@/lib/discounts/types';
import { buildReservedProductMap } from '@/lib/discounts/reserved-products';
import { formatProductPrice, getProductImage } from '@/lib/collections/product-utils';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { cn } from '@/lib/utils';

interface EditDiscountFormProps {
  discount: ProductDiscount;
  allDiscounts?: ProductDiscount[];
  onUpdated?: () => void;
  onDeleted?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function EditDiscountForm({
  discount,
  allDiscounts = [],
  onUpdated,
  onDeleted,
  onCancel,
  className,
}: EditDiscountFormProps) {
  const [percentage, setPercentage] = useState(discount.percentage);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(discount.productIds);
  const [products, setProducts] = useState<MyStoreProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPercentage, setEditingPercentage] = useState(false);

  const loadProducts = useCallback(async (search?: string) => {
    setLoadingProducts(true);
    try {
      const rows = await fetchMyStoreProducts(search);
      setProducts(rows.filter((product) => product.status !== 'DISCONTINUED'));
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : 'تعذّر تحميل المنتجات',
      );
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts(productSearch);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadProducts, productSearch]);

  const reservedProducts = useMemo(
    () => buildReservedProductMap(allDiscounts, discount.id),
    [allDiscounts, discount.id],
  );

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      const label = getProductDisplayName(product).toLowerCase();
      return label.includes(query);
    });
  }, [products, productSearch]);

  const isBusy = saving || deleting;

  function toggleProduct(productId: string) {
    if (reservedProducts.has(productId)) return;

    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

  function adjustPercentage(delta: number) {
    setPercentage((current) => Math.min(100, Math.max(1, current + delta)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (percentage < 1 || percentage > 100) {
      setError('أدخل نسبة خصم بين 1% و 100%');
      return;
    }

    if (!selectedProductIds.length) {
      setError('اختر منتجاً واحداً على الأقل');
      return;
    }

    setSaving(true);
    try {
      await updateDiscount(discount.id, {
        percentage,
        productIds: selectedProductIds,
      });
      onUpdated?.();
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : 'تعذّر حفظ التعديلات',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    try {
      await deleteDiscount(discount.id);
      onDeleted?.();
    } catch (err) {
      setError(
        err instanceof ApiException ? err.message : 'تعذّر حذف الخصم',
      );
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex min-h-0 flex-1 flex-col', className)}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col gap-4 px-4 py-4">
          <section className="rounded-2xl border border-[rgba(34,34,34,0.08)] bg-[var(--surface-secondary)]/40 p-4 dark:border-white/10">
            <p className="mb-3 text-[12px] font-medium text-[var(--muted-foreground)]">
              نسبة الخصم
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => adjustPercentage(-5)}
                className="flex size-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
                aria-label="تقليل النسبة"
              >
                <Minus className="size-4" strokeWidth={2} />
              </button>

              <div className="flex min-w-[7rem] flex-col items-center">
                {editingPercentage ? (
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={percentage}
                      autoFocus
                      onBlur={() => setEditingPercentage(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingPercentage(false);
                      }}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        if (!Number.isFinite(next)) return;
                        setPercentage(Math.min(100, Math.max(1, next)));
                      }}
                      className="w-16 border-0 bg-transparent p-0 text-center text-[32px] font-bold leading-none text-[var(--foreground)] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      aria-label="نسبة الخصم"
                    />
                    <span className="text-[20px] font-semibold text-[var(--muted-foreground)]">
                      %
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingPercentage(true)}
                    className="flex items-baseline gap-1 rounded-lg px-1 py-0.5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                    aria-label="تعديل نسبة الخصم"
                  >
                    <AnimatedNumber
                      value={percentage}
                      duration={420}
                      className="min-w-[2ch] text-center text-[32px] font-bold leading-none text-[var(--foreground)]"
                    />
                    <span className="text-[20px] font-semibold text-[var(--muted-foreground)]">
                      %
                    </span>
                  </button>
                )}
                <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                  من 1% إلى 100%
                </p>
              </div>

              <button
                type="button"
                onClick={() => adjustPercentage(5)}
                className="flex size-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
                aria-label="زيادة النسبة"
              >
                <Plus className="size-4" strokeWidth={2} />
              </button>
            </div>
          </section>

          <section className="flex min-h-0 flex-col">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[12px] text-[var(--muted-foreground)]">
                المنتجات المشمولة
              </p>
              {selectedProductIds.length > 0 ? (
                <span className="text-[11px] font-medium text-[var(--foreground)]">
                  {selectedProductIds.length} محدد
                </span>
              ) : null}
            </div>

            <input
              type="search"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="بحث في المنتجات…"
              className="mb-3 h-9 w-full rounded-lg border border-[rgba(34,34,34,0.1)] bg-transparent px-3 text-[12px] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]/60 focus:border-[rgba(34,34,34,0.18)] dark:border-white/10 dark:focus:border-white/20"
            />

            {loadingProducts ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-10 text-center">
                <Package
                  className="mx-auto mb-2 size-6 text-[var(--muted-foreground)]/60"
                  strokeWidth={1.5}
                />
                <p className="text-[13px] text-[var(--muted-foreground)]">
                  لا توجد منتجات
                </p>
              </div>
            ) : (
              <div className="flex max-h-[12rem] flex-col overflow-y-auto">
                {filteredProducts.map((product) => {
                  const selected = selectedProductIds.includes(product.id);
                  const reserved = reservedProducts.get(product.id);
                  const isDisabled = Boolean(reserved);
                  const imageUrl = getProductImage(product);
                  const discountedPrice = calculateDiscountedPrice(
                    product.price,
                    percentage,
                  );

                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => toggleProduct(product.id)}
                      className={cn(
                        'flex w-full items-center gap-3 border-b border-[rgba(34,34,34,0.08)] py-3 text-right transition-colors last:border-b-0 dark:border-white/10',
                        isDisabled
                          ? 'cursor-not-allowed opacity-55'
                          : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]',
                      )}
                    >
                      <div
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                          selected
                            ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                            : 'border-[rgba(34,34,34,0.18)] bg-transparent dark:border-white/20',
                        )}
                      >
                        {selected ? (
                          <Check className="size-3.5" strokeWidth={2.5} />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[var(--foreground)]">
                          {getProductDisplayName(product)}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px]">
                          <span className="text-[var(--muted-foreground)] line-through">
                            {formatProductPrice(product.price)}
                          </span>
                          {reserved ? (
                            <span className="font-medium text-[var(--muted-foreground)]">
                              {reserved.label}
                            </span>
                          ) : selected ? (
                            <AnimatedNumber
                              value={discountedPrice}
                              format={formatProductPrice}
                              duration={380}
                              animateFromZeroOnMount={false}
                              className="font-semibold text-[var(--primary)]"
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-secondary)]">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="size-4 text-[var(--muted-foreground)]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {error ? (
        <div className="shrink-0 px-4 pb-2">
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      ) : null}

      <div className="flex shrink-0 gap-2 border-t border-[rgba(34,34,34,0.08)] px-4 py-3 dark:border-white/10">
        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex h-10 min-w-0 flex-1 items-center justify-center rounded-lg bg-[var(--primary)] px-4 text-[13px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <span>حفظ التعديلات</span>
          )}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => {
            if (confirmDelete) {
              void handleDelete();
              return;
            }
            setConfirmDelete(true);
          }}
          className={cn(
            'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3.5 text-[13px] font-semibold transition-opacity disabled:opacity-60',
            confirmDelete
              ? 'bg-[var(--danger)] text-white hover:opacity-90'
              : 'border border-[var(--danger)]/35 text-[var(--danger)] hover:bg-[var(--danger)]/5',
          )}
        >
          {deleting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <>
              <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
              <span>{confirmDelete ? 'تأكيد الحذف' : 'حذف'}</span>
            </>
          )}
        </button>

        {onCancel ? (
          <button
            type="button"
            onClick={() => {
              if (confirmDelete) {
                setConfirmDelete(false);
                return;
              }
              onCancel();
            }}
            disabled={isBusy}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-[rgba(34,34,34,0.12)] px-4 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-black/[0.03] disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/[0.05]"
          >
            {confirmDelete ? 'تراجع' : 'إلغاء'}
          </button>
        ) : null}
      </div>
    </form>
  );
}
