'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button, Drawer } from '@heroui/react';
import { getProductDisplayName, fetchStoreProduct } from '@/lib/products/api';
import { formatProductPrice, getProductImage } from '@/lib/collections/product-utils';
import type { MyStoreProduct } from '@/lib/collections/types';
import { resolveMediaUrl } from '@/lib/media-url';
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
import {
  ProductKindBadge,
  ProductPriceDisplay,
  ProductStockBadge,
  ProductThumbnail,
} from '@/components/products/product-list-primitives';
import { cn } from '@/lib/utils';

interface ProductDetailSheetProps {
  product: StoreProduct | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)]/80 py-2.5 last:border-b-0">
      <dt className="shrink-0 text-[13px] text-[var(--muted-foreground)]">{label}</dt>
      <dd className="min-w-0 text-end text-[13px] font-medium text-[var(--foreground)]">
        {children}
      </dd>
    </div>
  );
}

export function ProductDetailSheet({
  product,
  isOpen,
  onOpenChange,
}: ProductDetailSheetProps) {
  const [detail, setDetail] = useState<StoreProduct | null>(product);

  useEffect(() => {
    setDetail(product);
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
  const imageUrl = view ? getProductImage(view as MyStoreProduct) : null;
  const kind = view ? resolveProductKind(view) : 'PHYSICAL';
  const status = view ? getProductStatusDisplay(view) : null;
  const stock = view ? getProductStockDisplay(view) : null;
  const category = view ? getProductCategoryLabel(view) : null;
  const description = view ? getProductDescription(view) : null;
  const createdAt = view ? formatProductDate(view.createdAt) : null;
  const attributes = useMemo(
    () => (view ? getProductAttributeRows(view) : []),
    [view],
  );
  const variants = view?.variants ?? [];
  const extraImages = (view?.product_images ?? [])
    .slice()
    .sort((a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)))
    .slice(1, 5);
  const salesCount = view?._count?.order_items;
  const digitalFiles = view?.digitalAssets ?? [];

  if (!view) return null;

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement="bottom">
        <Drawer.Dialog className="overflow-hidden sm:mx-auto sm:max-w-lg">
          <Drawer.CloseTrigger className="left-4 right-auto" />
          <Drawer.Handle />
          <Drawer.Header className="pe-10">
            <Drawer.Heading>تفاصيل المنتج</Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body>
            <div className="flex flex-col gap-4 pb-1">
              <ProductThumbnail
                imageUrl={imageUrl}
                alt={title}
                className="aspect-[4/3] w-full overflow-hidden rounded-2xl"
              />

              {extraImages.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto">
                  {extraImages.map((image) => (
                    <ProductThumbnail
                      key={image.id ?? image.imagePath}
                      imageUrl={resolveMediaUrl(image.imagePath)}
                      alt=""
                      className="size-14 shrink-0 rounded-xl"
                    />
                  ))}
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <h2
                  dir="auto"
                  className="text-[17px] font-semibold leading-snug text-[var(--foreground)]"
                >
                  {title}
                </h2>
                <div className="flex flex-wrap items-center gap-1.5">
                  <ProductKindBadge kind={kind} label={getProductKindLabelFor(view)} />
                  {status ? (
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                        status.color === 'success' &&
                          'border-[color-mix(in_srgb,var(--success)_28%,var(--border))] bg-[color-mix(in_srgb,var(--success)_10%,var(--surface))] text-[color-mix(in_srgb,var(--success)_80%,var(--foreground))]',
                        status.color === 'danger' &&
                          'border-[color-mix(in_srgb,var(--danger)_22%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] text-[var(--danger)]',
                        status.color === 'warning' &&
                          'border-[color-mix(in_srgb,var(--warning)_28%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_10%,var(--surface))] text-[color-mix(in_srgb,var(--warning)_80%,var(--foreground))]',
                        status.color === 'default' &&
                          'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
                      )}
                    >
                      {status.label}
                    </span>
                  ) : null}
                </div>
              </div>

              <ProductPriceDisplay
                price={view.price}
                salePrice={view.salePrice}
                layout="stack"
                size="md"
              />

              {description ? (
                <p
                  dir="auto"
                  className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--muted-foreground)]"
                >
                  {description}
                </p>
              ) : null}

              <dl>
                {category ? <DetailRow label="التصنيف">{category}</DetailRow> : null}
                {view.sku ? (
                  <DetailRow label="رمز المنتج">
                    <span dir="ltr">{view.sku}</span>
                  </DetailRow>
                ) : null}
                {stock && stock.variant !== 'muted' ? (
                  <DetailRow label="المخزون">
                    <ProductStockBadge label={stock.label} variant={stock.variant} />
                  </DetailRow>
                ) : null}
                {typeof salesCount === 'number' ? (
                  <DetailRow label="المبيعات">{salesCount}</DetailRow>
                ) : null}
                {createdAt ? <DetailRow label="تاريخ الإضافة">{createdAt}</DetailRow> : null}
                {attributes.map((row) => (
                  <DetailRow key={row.label} label={row.label}>
                    {row.value}
                  </DetailRow>
                ))}
              </dl>

              {variants.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[13px] font-medium text-[var(--foreground)]">المتغيرات</p>
                  <ul className="flex flex-col gap-1.5">
                    {variants.map((variant) => {
                      const attrs = formatVariantAttributes(variant.attributes);
                      return (
                        <li
                          key={variant.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-secondary)] px-3 py-2 text-[12px]"
                        >
                          <span className="min-w-0 truncate text-[var(--foreground)]">
                            {attrs || variant.sku || 'متغير'}
                          </span>
                          <span className="shrink-0 tabular-nums text-[var(--muted-foreground)]">
                            {variant.stock} · {formatProductPrice(variant.price)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {digitalFiles.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[13px] font-medium text-[var(--foreground)]">الملفات الرقمية</p>
                  <ul className="flex flex-col gap-1">
                    {digitalFiles.map((file) => (
                      <li
                        key={file.id}
                        className="truncate text-[13px] text-[var(--muted-foreground)]"
                        dir="auto"
                      >
                        {file.fileName}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button slot="close" variant="secondary">
              إغلاق
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
