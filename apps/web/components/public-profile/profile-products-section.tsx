'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PublicProfileProduct } from './types';
import { PublicProductCard } from './public-product-card';
import { PublicProductDetailDialog } from './public-product-detail-dialog';
import { PROFILE_STORE_SECTION_ID } from './profile-header';
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
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.12 });
  const reduceMotion = useReducedMotion();
  const animateSection = reduceMotion || isInView;

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
      id={PROFILE_STORE_SECTION_ID}
      ref={sectionRef}
      className={cn(
        'profile-store-chrome',
        compact ? 'space-y-3.5 pt-1' : 'space-y-4 pt-2 sm:space-y-5',
      )}
      aria-label={resolvedHeading}
    >
      {showHeading ? (
        <motion.div
          className="flex items-center gap-3 sm:gap-4"
          variants={reduceMotion ? undefined : HEADING_MOTION}
          initial={reduceMotion ? false : 'hidden'}
          animate={animateSection ? 'visible' : 'hidden'}
        >
          <div className="h-px flex-1 bg-[var(--border)] opacity-60" aria-hidden />
          <div
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-full',
              'bg-[var(--surface-secondary)] shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-[var(--border)]',
              compact ? 'px-3 py-1' : 'px-3.5 py-1.5',
            )}
          >
            <ShoppingBag
              className={cn(
                'shrink-0 text-[var(--muted-foreground)]',
                compact ? 'size-3' : 'size-3.5',
              )}
              strokeWidth={2}
              aria-hidden
            />
            <h2
              className={cn(
                'font-bold tracking-tight text-[var(--foreground)]',
                compact ? 'text-[11px]' : 'text-xs sm:text-[13px]',
              )}
            >
              {resolvedHeading}
            </h2>
            <span
              className={cn(
                'inline-flex min-w-[1.25rem] items-center justify-center rounded-full',
                'bg-[var(--foreground)] font-bold tabular-nums text-[var(--background)]',
                compact ? 'px-1.5 py-0 text-[9px]' : 'px-1.5 py-0.5 text-[10px]',
              )}
              dir="ltr"
            >
              {products.length}
            </span>
          </div>
          <div className="h-px flex-1 bg-[var(--border)] opacity-60" aria-hidden />
        </motion.div>
      ) : null}
      <motion.div
        className={cn(
          'product-grid-dnd grid items-start',
          compact
            ? 'grid-cols-2 gap-x-2.5 gap-y-3.5'
            : 'grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 sm:gap-x-3.5 sm:gap-y-5',
        )}
        aria-label={t('productsGrid')}
        variants={reduceMotion ? undefined : GRID_STAGGER}
        initial={reduceMotion ? false : 'hidden'}
        animate={animateSection ? 'visible' : 'hidden'}
      >
        {products.map((product, index) => (
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
        ))}
      </motion.div>

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
