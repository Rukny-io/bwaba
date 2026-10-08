'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button, Modal } from '@heroui/react';
import { Pencil, Trash2 } from 'lucide-react';
import {
  getProductDisplayName,
  fetchStoreProduct,
  uploadProductImages,
} from '@/lib/products/api';
import {
  formatProductPrice,
  getProductImage,
  getProductImageUrl,
} from '@/lib/collections/product-utils';
import type { MyStoreProduct } from '@/lib/collections/types';
import {
  formatProductDate,
  formatVariantAttributes,
  getProductAttributeRows,
  getProductCategoryLabel,
  getProductDescription,
  getProductKindLabelFor,
  getProductStatusDisplay,
  getProductStockDisplay,
  resolveProductKind,
} from '@/lib/products/product-display';
import type { StoreProduct } from '@/lib/products/types';
import { ProductImageUploadButton } from '@/components/products/product-image-upload-button';
import {
  ProductKindBadge,
  ProductPriceDisplay,
  ProductStockBadge,
  ProductThumbnail,
} from '@/components/products/product-list-primitives';
import { ApiException } from '@/lib/api-client';
import { formatNumber } from '@/lib/dashboard-format';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface ProductDetailSheetProps {
  product: StoreProduct | null;
  isOpen: boolean;
  isBusy?: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated?: (product: StoreProduct) => void;
  onEdit?: (product: StoreProduct) => void;
  onDelete?: (product: StoreProduct) => void;
}

function MetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-[11px] text-[var(--muted-foreground)]">{label}</span>
      <span dir="ltr" className="text-[12px] font-medium tabular-nums text-[var(--foreground)]">
        {value}
      </span>
    </span>
  );
}

export function ProductDetailSheet({
  product,
  isOpen,
  isBusy = false,
  onOpenChange,
  onProductUpdated,
  onEdit,
  onDelete,
}: ProductDetailSheetProps) {
  const { t } = useTranslations();
  const [detail, setDetail] = useState<StoreProduct | null>(product);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setDetail(product);
    setActiveImageIndex(0);
  }, [product]);

  useEffect(() => {
    if (!isOpen || !product?.id) return;

    let cancelled = false;

    void fetchStoreProduct(product.id)
      .then((full) => {
        if (!cancelled) setDetail(full);
      })
      .catch(() => {
        /* keep the list snapshot */
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, product?.id]);

  const view = detail ?? product;

  const title = view ? getProductDisplayName(view) : '';
  const kind = view ? resolveProductKind(view) : 'PHYSICAL';
  const status = view ? getProductStatusDisplay(view, t) : null;
  const stock = view ? getProductStockDisplay(view, t) : null;
  const category = view ? getProductCategoryLabel(view) : null;
  const description = view ? getProductDescription(view) : null;
  const createdAt = view ? formatProductDate(view.createdAt) : null;
  const attributes = useMemo(
    () => (view ? getProductAttributeRows(view, t) : []),
    [view, t],
  );
  const variants = view?.variants ?? [];
  const salesCount = view?._count?.order_items;

  const galleryImages = useMemo(() => {
    const images = view?.product_images ?? [];
    return [...images].sort(
      (a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)),
    );
  }, [view?.product_images]);

  const imageCount = galleryImages.length;
  const activeImage = galleryImages[activeImageIndex] ?? galleryImages[0];
  const heroImageUrl = activeImage
    ? getProductImageUrl(activeImage)
    : view
      ? getProductImage(view as MyStoreProduct)
      : null;

  async function handleUploadImages(files: File[]) {
    if (!view?.id) return;
    setUploadError(null);

    try {
      await uploadProductImages(view.id, files);
      const full = await fetchStoreProduct(view.id);
      setDetail(full);
      setActiveImageIndex(0);
      onProductUpdated?.(full);
    } catch (err) {
      setUploadError(
        err instanceof ApiException ? err.message : t('products.uploadFailed'),
      );
    }
  }

  if (!view) return null;

  const infoRows = [
    ...(category ? [{ label: t('products.category'), value: category }] : []),
    ...(view.sku ? [{ label: t('products.sku'), value: view.sku, ltr: true }] : []),
    ...attributes.map((row) => ({ label: row.label, value: row.value })),
  ];

  const showActions = Boolean(onEdit || onDelete);

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      variant="blur"
    >
      <Modal.Container placement="center" className="px-2 sm:px-3">
        <Modal.Dialog

          className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-0 !shadow-none ring-0 outline-none"
        >
          <div className="grid min-w-0 gap-4 p-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-5 sm:p-5">
            <div className="flex min-w-0 flex-col gap-2">
              <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]">
                <ProductThumbnail
                  imageUrl={heroImageUrl}
                  alt={title}
                  className="aspect-square w-full"
                  imageClassName="object-cover"
                />
                {status ? (
                  <span
                    className={cn(
                      'absolute start-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                      status.color === 'danger'
                        ? 'bg-[var(--danger)]/15 text-[var(--danger)]'
                        : 'bg-[var(--surface)]/90 text-[var(--foreground)]',
                    )}
                  >
                    {status.label}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-1.5 overflow-hidden ps-1">
                {galleryImages.map((image, index) => (
                  <button
                    key={image.id ?? image.imagePath}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={cn(
                      'shrink-0 overflow-hidden rounded-lg transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98]',
                      index === activeImageIndex
                        ? 'opacity-100'
                        : 'opacity-55 hover:opacity-75',
                    )}
                    aria-label={t('products.imageAria', { n: index + 1 })}
                  >
                    <ProductThumbnail
                      imageUrl={getProductImageUrl(image)}
                      alt=""
                      className="size-11"
                    />
                  </button>
                ))}
                {imageCount < 5 ? (
                  <ProductImageUploadButton
                    variant="tile"
                    label={imageCount === 0 ? t('products.upload') : '+'}
                    onPick={handleUploadImages}
                    className="!border-0 !bg-[var(--surface-secondary)] !shadow-none hover:!bg-[var(--surface-secondary)]/80 active:scale-[0.98]"
                  />
                ) : null}
              </div>

              {uploadError ? (
                <p className="ps-1 text-[11px] leading-tight text-[var(--danger)]">{uploadError}</p>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                  <ProductKindBadge kind={kind} label={getProductKindLabelFor(view, t)} />
                  {stock && stock.variant !== 'muted' ? (
                    <>
                      <span className="text-[var(--border)]" aria-hidden>·</span>
                      <ProductStockBadge label={stock.label} variant={stock.variant} />
                    </>
                  ) : null}
                </div>
                <h2
                  dir="auto"
                  className="text-[18px] font-semibold leading-snug tracking-tight text-[var(--foreground)]"
                >
                  {title}
                </h2>
                <ProductPriceDisplay
                  price={view.price}
                  salePrice={view.salePrice}
                  layout="inline"
                  size="md"
                  className="mt-0.5"
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-0.5">
                <MetaItem
                  label={t('products.stock')}
                  value={stock && stock.variant !== 'muted' ? stock.label : '—'}
                />
                <MetaItem
                  label={t('products.sales')}
                  value={
                    typeof salesCount === 'number' ? formatNumber(salesCount) : '—'
                  }
                />
                <MetaItem label={t('products.addedOn')} value={createdAt ?? '—'} />
              </div>

              {description ? (
                <p
                  dir="auto"
                  className="line-clamp-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]"
                >
                  {description}
                </p>
              ) : null}

              {infoRows.length > 0 ? (
                <dl className="grid grid-cols-2 gap-x-5 gap-y-2">
                  {infoRows.map((row) => (
                    <div key={row.label} className="min-w-0">
                      <dt className="text-[11px] text-[var(--muted-foreground)]">{row.label}</dt>
                      <dd
                        dir={'ltr' in row && row.ltr ? 'ltr' : 'auto'}
                        className="mt-0.5 truncate text-[13px] font-medium text-[var(--foreground)]"
                      >
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {variants.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-medium text-[var(--muted-foreground)]">
                    {t('products.variants')}
                  </p>
                  <ul className="flex flex-col gap-1">
                    {variants.map((variant) => {
                      const attrs = formatVariantAttributes(variant.attributes);
                      return (
                        <li
                          key={variant.id}
                          className="flex items-center justify-between gap-2 rounded-lg px-0.5 py-1"
                        >
                          <span className="min-w-0 truncate text-[12px] text-[var(--foreground)]">
                            {attrs || variant.sku || t('products.variantFallback')}
                          </span>
                          <span
                            dir="ltr"
                            className="shrink-0 text-[11px] tabular-nums text-[var(--muted-foreground)]"
                          >
                            {formatNumber(variant.stock)} · {formatProductPrice(variant.price)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {showActions ? (
                <div className="flex items-stretch gap-2 pt-2">
                  {onEdit ? (
                    <Button
                      type="button"
                      variant="secondary"
                      isDisabled={isBusy}
                      onPress={() => onEdit(view)}
                      className="h-10 min-w-0 flex-1 gap-1.5 rounded-xl text-[13px] font-medium !shadow-none"
                    >
                      <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
                      {t('products.edit')}
                    </Button>
                  ) : null}
                  {onDelete ? (
                    <Button
                      type="button"
                      variant="danger-soft"
                      isDisabled={isBusy}
                      onPress={() => onDelete(view)}
                      className="h-10 min-w-0 flex-1 gap-1.5 rounded-xl text-[13px] font-medium !shadow-none"
                    >
                      <Trash2 className="size-3.5" strokeWidth={2} aria-hidden />
                      {t('products.delete')}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
