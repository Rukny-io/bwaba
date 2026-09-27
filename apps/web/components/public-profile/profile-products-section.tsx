'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { PublicProfileProduct } from './types';
import { PublicProductCard } from './public-product-card';
import { PublicProductDetailDialog } from './public-product-detail-dialog';
import { cn } from './utils';

interface ProfileProductsSectionProps {
  products: PublicProfileProduct[];
  storeSlug: string;
  storeName?: string | null;
  storeAvatar?: string | null;
  initialProductId?: string | null;
  preview?: boolean;
  /** شبكة مضغوطة داخل معاينة الهاتف */
  compact?: boolean;
  showHeading?: boolean;
  heading?: string;
}

export function ProfileProductsSection({
  products,
  storeSlug,
  storeName,
  storeAvatar,
  initialProductId = null,
  preview,
  compact = false,
  showHeading = true,
  heading,
}: ProfileProductsSectionProps) {
  const t = useTranslations('publicProfile.sections');
  const resolvedHeading = heading ?? t('products');
  const [detailProduct, setDetailProduct] = useState<PublicProfileProduct | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (preview || !initialProductId) return;
    const match = products.find((item) => item.id === initialProductId);
    if (!match) return;
    setDetailProduct(match);
    setDetailOpen(true);
  }, [initialProductId, preview, products]);

  const handleOpenDetails = useCallback((product: PublicProfileProduct) => {
    setDetailProduct(product);
    setDetailOpen(true);
  }, []);

  const handleDetailOpenChange = useCallback((open: boolean) => {
    setDetailOpen(open);
    if (!open) setDetailProduct(null);
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="profile-store-chrome space-y-2.5" aria-label={resolvedHeading}>
      {showHeading ? (
        <p className="px-1 text-center text-[11px] font-bold tracking-wide text-[var(--muted-foreground)]">
          {resolvedHeading}
        </p>
      ) : null}
      <div
        className={cn(
          'product-grid-dnd grid items-start gap-x-3 gap-y-4 sm:gap-x-3.5 sm:gap-y-5',
          compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3',
        )}
        aria-label={t('productsGrid')}
      >
        {products.map((product, index) => (
          <div key={product.id} className="min-w-0 h-full">
            <PublicProductCard
              product={product}
              storeSlug={storeSlug}
              preview={preview}
              priorityImage={index < 4}
              onOpenDetails={preview ? undefined : handleOpenDetails}
            />
          </div>
        ))}
      </div>

      {!preview ? (
        <PublicProductDetailDialog
          product={detailProduct}
          storeSlug={storeSlug}
          storeName={storeName}
          storeAvatar={storeAvatar}
          isOpen={detailOpen}
          onOpenChange={handleDetailOpenChange}
        />
      ) : null}
    </section>
  );
}
