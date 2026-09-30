'use client';

import { useTranslations } from 'next-intl';
import type { PublicProfileProduct } from './types';
import {
  formatProfileProductPrice,
  getPublicProductStockDisplayLocalized,
} from '@/lib/public-profile-copy';
import { useMediaUrl } from './media-url-context';
import {
  getProductDiscountPercent,
  ProductPriceDisplay,
  ProductThumbnail,
} from './product-card-primitives';
import { cn } from './utils';

interface PublicProductCardProps {
  product: PublicProfileProduct;
  storeSlug: string;
  preview?: boolean;
  priorityImage?: boolean;
  onOpenDetails?: (product: PublicProfileProduct) => void;
}

export function PublicProductCard({
  product,
  preview,
  priorityImage = false,
  onOpenDetails,
}: PublicProductCardProps) {
  const t = useTranslations('publicProfile');
  const resolveMedia = useMediaUrl();
  const imageUrl = resolveMedia(product.images[0] ?? null);
  const stock = getPublicProductStockDisplayLocalized(product, t);
  const discount = getProductDiscountPercent(product);
  const outOfStock = !product.isDigital && product.stock <= 0;

  const interactive = !preview && Boolean(onOpenDetails);

  const openDetails = () => {
    if (interactive) onOpenDetails?.(product);
  };

  return (
    <article
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? openDetails : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openDetails();
              }
            }
          : undefined
      }
      className={cn(
        'group/card relative flex h-full min-w-0 flex-col',
        outOfStock && 'opacity-70',
        preview && 'pointer-events-none',
        interactive && 'cursor-pointer touch-manipulation select-none',
      )}
      aria-label={product.name}
    >
      <div
        className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--surface-secondary)]"
      >
        <ProductThumbnail
          imageUrl={imageUrl}
          alt={product.name}
          className="size-full rounded-2xl"
          imageClassName="transition-[transform,opacity] duration-300 group-hover/card:scale-[1.03] group-hover/card:opacity-[0.96]"
          priority={priorityImage}
        />

        <div className="absolute start-2 top-2 z-[1] flex max-w-[calc(100%-1rem)] flex-col items-start gap-0.5">
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
          <span className="absolute inset-x-2 bottom-2 z-[1] w-fit max-w-[calc(100%-1rem)] truncate rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
            {stock.label}
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 flex min-w-0 flex-col gap-1 px-0.5">
        <h3
          dir="auto"
          className="line-clamp-2 text-[13px] font-medium leading-snug text-[var(--foreground)] sm:text-sm"
          title={product.name}
        >
          {product.name}
        </h3>

        <div className="flex min-w-0 items-end justify-between gap-1.5">
          <ProductPriceDisplay
            price={product.price}
            salePrice={product.salePrice}
            layout="stack"
            size="sm"
            currencyShort={t('product.currencyShort')}
          />
          {stock.variant === 'default' ? (
            <span className="mb-px shrink-0 text-[10px] font-medium text-[var(--muted-foreground)]">
              {stock.label}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
