'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { MediaUrlResolver, PublicProfileCollection, PublicProfileProduct } from './types';
import { PublicProductCard } from './public-product-card';
import { PublicProductDetailDialog } from './public-product-detail-dialog';
import { PROFILE_STORE_SECTION_ID } from './profile-header';
import { ProfileCollectionFilters } from './profile-collection-filters';
import { getProductCategories, ProfileProductFilters } from './profile-product-filters';
import { cn } from './utils';

const EASE_OUT = [0.32, 0.72, 0, 1] as const;

const GRID_STAGGER: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const GRID_ITEM: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: EASE_OUT },
  },
};

const HEADING_MOTION: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: EASE_OUT },
  },
};

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
  /** Limit products shown on profile preview; omit to show all */
  limit?: number;
  viewAllHref?: string;
  assignSectionId?: boolean;
  showCategoryFilter?: boolean;
  collections?: PublicProfileCollection[];
  resolveMediaUrl?: MediaUrlResolver;
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
  limit,
  viewAllHref,
  assignSectionId = false,
  showCategoryFilter = false,
  collections = [],
  resolveMediaUrl,
}: ProfileProductsSectionProps) {
  const t = useTranslations('publicProfile.sections');
  const tStore = useTranslations('publicProfile.store');
  const resolvedHeading = heading ?? t('products');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categories = useMemo(() => getProductCategories(products), [products]);
  const useCollectionFilter = collections.length > 0;
  const filteredProducts = useMemo(() => {
    if (useCollectionFilter && selectedCollectionId) {
      const collection = collections.find((item) => item.id === selectedCollectionId);
      if (!collection) return products;
      const productIds = new Set(collection.productIds);
      return products.filter((product) => productIds.has(product.id));
    }

    if (!useCollectionFilter && selectedCategory) {
      return products.filter((product) => product.category?.trim() === selectedCategory);
    }

    return products;
  }, [collections, products, selectedCategory, selectedCollectionId, useCollectionFilter]);
  const displayedProducts = useMemo(
    () => (limit != null ? filteredProducts.slice(0, limit) : filteredProducts),
    [filteredProducts, limit],
  );
  const hasMoreProducts = limit != null && filteredProducts.length > limit;
  const [detailProduct, setDetailProduct] = useState<PublicProfileProduct | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const reduceMotion = useReducedMotion();

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
    <section
      id={assignSectionId ? PROFILE_STORE_SECTION_ID : undefined}
      className={cn(
        'profile-store-chrome',
        compact ? 'space-y-3.5 pt-1' : 'space-y-4 pt-2 sm:space-y-5',
      )}
      aria-label={resolvedHeading}
    >
      {showHeading ? (
        <motion.div
          className="flex items-center gap-2 px-1"
          variants={reduceMotion ? undefined : HEADING_MOTION}
          initial={reduceMotion ? false : 'hidden'}
          animate="visible"
        >
          <ShoppingBag
            className={cn(
              'shrink-0 text-[var(--muted-foreground)]',
              compact ? 'size-3.5' : 'size-4',
            )}
            strokeWidth={2}
            aria-hidden
          />
          <h2
            className={cn(
              'font-bold tracking-tight text-[var(--foreground)]',
              compact ? 'text-xs' : 'text-sm sm:text-[15px]',
            )}
          >
            {resolvedHeading}
          </h2>
          <span
            className={cn(
              'font-semibold tabular-nums text-[var(--muted-foreground)]',
              compact ? 'text-[11px]' : 'text-xs sm:text-[13px]',
            )}
            dir="ltr"
          >
            {(useCollectionFilter && selectedCollectionId) ||
            (!useCollectionFilter && showCategoryFilter && selectedCategory)
              ? filteredProducts.length
              : products.length}
          </span>
        </motion.div>
      ) : null}

      {useCollectionFilter && resolveMediaUrl ? (
        <ProfileCollectionFilters
          collections={collections}
          value={selectedCollectionId}
          onChange={setSelectedCollectionId}
          resolveMediaUrl={resolveMediaUrl}
          compact={compact}
        />
      ) : showCategoryFilter ? (
        <ProfileProductFilters
          categories={categories}
          value={selectedCategory}
          onChange={setSelectedCategory}
          compact={compact}
        />
      ) : null}

      <motion.div
        className={cn(
          'product-grid-dnd grid items-start',
          compact
            ? 'grid-cols-2 gap-x-2.5 gap-y-3.5'
            : 'grid-cols-2 gap-x-3.5 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6',
        )}
        aria-label={t('productsGrid')}
        variants={reduceMotion ? undefined : GRID_STAGGER}
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
      >
        {displayedProducts.length > 0 ? (
          displayedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              className="min-w-0 h-full"
              variants={reduceMotion ? undefined : GRID_ITEM}
            >
              <PublicProductCard
                product={product}
                storeSlug={storeSlug}
                preview={preview}
                priorityImage={index < 4}
                onOpenDetails={preview ? undefined : handleOpenDetails}
              />
            </motion.div>
          ))
        ) : (
          <p
            className={cn(
              'col-span-full px-1 text-center text-[var(--muted-foreground)]',
              compact ? 'py-6 text-xs' : 'py-8 text-sm',
            )}
          >
            {useCollectionFilter
              ? tStore('noProductsInCollection')
              : tStore('noProductsInCategory')}
          </p>
        )}
      </motion.div>

      {viewAllHref && !preview ? (
        <Link
          href={viewAllHref}
          className={cn(
            'flex w-full items-center justify-center rounded-3xl border border-[var(--border)] font-semibold',
            'text-[var(--foreground)] transition-[transform,border-color] duration-200 ease-out',
            'hover:border-[var(--muted-foreground)]/35 active:scale-[0.99]',
            compact ? 'h-10 text-xs' : 'h-12 text-sm sm:h-11 sm:text-[13px]',
          )}
        >
          {hasMoreProducts ? t('viewAllProducts') : t('goToStore')}
        </Link>
      ) : null}

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
