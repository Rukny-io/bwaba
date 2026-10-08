'use client';

import { memo } from 'react';
import { Copy, Eye, EyeOff, Info, MoreVertical, Trash2 } from 'lucide-react';
import { Button, Dropdown, Label } from '@heroui/react';
import type { StoreProduct } from '@/lib/products/types';
import { getProductDisplayName } from '@/lib/products/api';
import { getProductImage } from '@/lib/collections/product-utils';
import type { MyStoreProduct } from '@/lib/collections/types';
import { getProductStockDisplay } from '@/lib/products/product-display';
import {
  ProductPriceDisplay,
  ProductThumbnail,
} from '@/components/products/product-list-primitives';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: StoreProduct;
  className?: string;
  isBusy?: boolean;
  onOpenDetails?: (product: StoreProduct) => void;
  onToggleVisibility?: (product: StoreProduct) => void;
  onDelete?: (product: StoreProduct) => void;
}

function salePercent(price: number | string, salePrice: number | string | null | undefined) {
  const base = Number(price);
  const sale =
    salePrice != null && salePrice !== '' ? Number(salePrice) : null;
  if (!Number.isFinite(base) || base <= 0 || sale == null || !Number.isFinite(sale) || sale >= base) {
    return null;
  }
  return Math.max(1, Math.round((1 - sale / base) * 100));
}

function ProductCardComponent({
  product,
  className,
  isBusy = false,
  onOpenDetails,
  onToggleVisibility,
  onDelete,
}: ProductCardProps) {
  const { t } = useTranslations();
  const imageUrl = getProductImage(product as MyStoreProduct);
  const title = getProductDisplayName(product);
  const stock = getProductStockDisplay(product, t);
  const isHidden = product.status === 'INACTIVE';
  const canToggleVisibility =
    product.status === 'ACTIVE' || product.status === 'INACTIVE';
  const discount = salePercent(product.price, product.salePrice);
  const showLabel = t('products.show');
  const hideLabel = t('products.hide');
  const detailsLabel = t('products.details');
  const copySkuLabel = t('products.copySku');
  const deleteLabel = t('products.deleteProduct');

  const openDetails = () => onOpenDetails?.(product);

  return (
    <article
      className={cn(
        'group/card relative flex h-full min-w-0 flex-col',
        isHidden && 'opacity-70',
        className,
      )}
    >
      <div
        className={cn(
          'relative aspect-square overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]',
          onOpenDetails && 'cursor-pointer',
        )}
        onClick={openDetails}
      >
        <ProductThumbnail
          imageUrl={imageUrl}
          alt={title}
          className="size-full rounded-xl"
          imageClassName="transition-opacity duration-200 group-hover/card:opacity-[0.96]"
        />

        <div className="absolute start-2 top-2 z-[1] flex max-w-[calc(100%-2.75rem)] flex-col items-start gap-0.5">
          {isHidden ? (
            <span className="rounded-md bg-[var(--surface)]/90 px-1.5 py-0.5 text-[10px] font-medium text-[var(--foreground)]">
              {t('products.hidden')}
            </span>
          ) : null}
          {discount ? (
            <span
              className="rounded-md bg-[var(--primary)] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[var(--primary-foreground)]"
              dir="ltr"
            >
              -{discount}%
            </span>
          ) : null}
        </div>

        {stock.variant === 'low' ? (
          <span className="absolute inset-x-2 bottom-2 z-[1] w-fit max-w-[calc(100%-1rem)] truncate rounded-md bg-[var(--surface)]/90 px-1.5 py-0.5 text-[9px] font-medium text-[var(--foreground)]">
            {stock.label}
          </span>
        ) : null}

        <div
          className="absolute end-2 top-2 z-10"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Dropdown>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={t('products.options')}
              isDisabled={isBusy}
              className="size-7 rounded-full border border-[var(--border)] !bg-[var(--surface)] !text-[var(--foreground)] !shadow-none hover:!bg-[var(--surface-secondary)]"
            >
              <MoreVertical className="size-3.5" />
            </Button>
            <Dropdown.Popover placement="bottom end">
              <Dropdown.Menu
                onAction={(key) => {
                  if (key === 'details') {
                    queueMicrotask(() => onOpenDetails?.(product));
                  }
                  if (key === 'toggle') onToggleVisibility?.(product);
                  if (key === 'copy-sku' && product.sku) {
                    void navigator.clipboard.writeText(product.sku);
                  }
                  if (key === 'delete') onDelete?.(product);
                }}
              >
                <Dropdown.Item id="details" textValue={detailsLabel}>
                  <Info className="size-4 shrink-0 text-muted" aria-hidden />
                  <Label>{detailsLabel}</Label>
                </Dropdown.Item>
                {canToggleVisibility ? (
                  <Dropdown.Item
                    id="toggle"
                    isDisabled={isBusy}
                    textValue={isHidden ? showLabel : hideLabel}
                  >
                    {isHidden ? (
                      <Eye className="size-4 shrink-0 text-muted" aria-hidden />
                    ) : (
                      <EyeOff className="size-4 shrink-0 text-muted" aria-hidden />
                    )}
                    <Label>{isHidden ? showLabel : hideLabel}</Label>
                  </Dropdown.Item>
                ) : null}
                {product.sku ? (
                  <Dropdown.Item id="copy-sku" textValue={copySkuLabel}>
                    <Copy className="size-4 shrink-0 text-muted" aria-hidden />
                    <Label>{copySkuLabel}</Label>
                  </Dropdown.Item>
                ) : null}
                <Dropdown.Item
                  id="delete"
                  variant="danger"
                  isDisabled={isBusy}
                  textValue={deleteLabel}
                >
                  <Trash2 className="size-4 shrink-0" aria-hidden />
                  <Label>{deleteLabel}</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>

      <div
        className={cn(
          'mt-2 flex min-w-0 flex-col gap-1 px-0.5',
          onOpenDetails && 'cursor-pointer',
        )}
        onClick={openDetails}
      >
        <h3
          dir="auto"
          className="line-clamp-2 text-[13px] font-medium leading-snug text-[var(--foreground)] sm:text-[14px]"
          title={title}
        >
          {title}
        </h3>

        <div className="flex min-w-0 items-end justify-between gap-1.5">
          <ProductPriceDisplay
            price={product.price}
            salePrice={product.salePrice}
            layout="stack"
            size="md"
          />
          {stock.variant === 'default' || stock.variant === 'unlimited' ? (
            <span className="mb-px shrink-0 text-[11px] font-medium text-[var(--muted-foreground)]">
              {stock.label}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col">
      <div className="aspect-square rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/70" />
      <div className="mt-2 space-y-1.5 px-0.5">
        <div className="h-3 w-[88%] rounded-md bg-[var(--surface-secondary)]/70" />
        <div className="h-3 w-[42%] rounded-md bg-[var(--surface-secondary)]/60" />
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardComponent);
