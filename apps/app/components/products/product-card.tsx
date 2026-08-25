'use client';

import { memo } from 'react';
import { Copy, Eye, EyeOff, Info, MoreVertical } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: StoreProduct;
  className?: string;
  isBusy?: boolean;
  onOpenDetails?: (product: StoreProduct) => void;
  onToggleVisibility?: (product: StoreProduct) => void;
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
}: ProductCardProps) {
  const imageUrl = getProductImage(product as MyStoreProduct);
  const title = getProductDisplayName(product);
  const stock = getProductStockDisplay(product);
  const isHidden = product.status === 'INACTIVE';
  const canToggleVisibility =
    product.status === 'ACTIVE' || product.status === 'INACTIVE';
  const discount = salePercent(product.price, product.salePrice);

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
          'relative aspect-square overflow-hidden rounded-2xl bg-[var(--surface-secondary)] ring-1 ring-inset ring-black/[0.06]',
          onOpenDetails && 'cursor-pointer',
        )}
        onClick={openDetails}
      >
        <ProductThumbnail
          imageUrl={imageUrl}
          alt={title}
          className="size-full rounded-2xl"
          imageClassName="transition-[transform,opacity] duration-300 group-hover/card:scale-[1.03] group-hover/card:opacity-[0.96] group-focus-within/card:scale-[1.03]"
        />

        <div className="absolute start-2.5 top-2.5 z-[1] flex max-w-[calc(100%-3.25rem)] flex-col items-start gap-1">
          {isHidden ? (
            <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              مخفي
            </span>
          ) : null}
          {discount ? (
            <span
              className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-[var(--primary-foreground)]"
              dir="ltr"
            >
              -{discount}%
            </span>
          ) : null}
        </div>

        {stock.variant === 'low' ? (
          <span className="absolute inset-x-2.5 bottom-2.5 z-[1] w-fit max-w-[calc(100%-1.25rem)] truncate rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {stock.label}
          </span>
        ) : null}

        <div
          className="absolute end-2.5 top-2.5 z-10"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Dropdown>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="خيارات المنتج"
              isDisabled={isBusy}
              className="size-8 rounded-full !bg-black/45 !text-white backdrop-blur-sm hover:!bg-black/60"
            >
              <MoreVertical className="size-4" />
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
                }}
              >
                <Dropdown.Item id="details" textValue="تفاصيل المنتج">
                  <Info className="size-4 shrink-0 text-muted" aria-hidden />
                  <Label>تفاصيل المنتج</Label>
                </Dropdown.Item>
                {canToggleVisibility ? (
                  <Dropdown.Item
                    id="toggle"
                    isDisabled={isBusy}
                    textValue={isHidden ? 'إظهار' : 'إخفاء'}
                  >
                    {isHidden ? (
                      <Eye className="size-4 shrink-0 text-muted" aria-hidden />
                    ) : (
                      <EyeOff className="size-4 shrink-0 text-muted" aria-hidden />
                    )}
                    <Label>{isHidden ? 'إظهار' : 'إخفاء'}</Label>
                  </Dropdown.Item>
                ) : null}
                {product.sku ? (
                  <Dropdown.Item id="copy-sku" textValue="نسخ الرمز">
                    <Copy className="size-4 shrink-0 text-muted" aria-hidden />
                    <Label>نسخ الرمز</Label>
                  </Dropdown.Item>
                ) : null}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>

      <div
        className={cn(
          'mt-3 flex min-w-0 flex-col gap-1.5 px-0.5',
          onOpenDetails && 'cursor-pointer',
        )}
        onClick={openDetails}
      >
        <h3
          dir="auto"
          className="line-clamp-2 min-h-[2.5em] text-[13px] font-medium leading-snug text-[var(--foreground)] sm:text-[14px]"
          title={title}
        >
          {title}
        </h3>

        <div className="flex min-w-0 items-end justify-between gap-2" dir="rtl">
          <ProductPriceDisplay
            price={product.price}
            salePrice={product.salePrice}
            layout="stack"
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
      <div className="aspect-square rounded-2xl bg-[var(--surface-secondary)]/70 ring-1 ring-inset ring-black/[0.04]" />
      <div className="mt-3 space-y-2 px-0.5">
        <div className="h-3.5 w-[88%] rounded-md bg-[var(--surface-secondary)]/70" />
        <div className="h-3.5 w-[42%] rounded-md bg-[var(--surface-secondary)]/60" />
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardComponent);
