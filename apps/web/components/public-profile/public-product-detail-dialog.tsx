'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Copy, ExternalLink, Minus, Plus, ShoppingBag, Truck } from 'lucide-react';
import { buildProductCheckoutUrl } from '@/lib/checkout-url';
import { getDirection, type AppLocale } from '@/lib/i18n';
import {
  formatProfileDialogPriceIqd,
  getProductAttributeRowsLocalized,
  getProductKindLabelLocalized,
  getPublicProductStockDisplayLocalized,
  getVariantAttributeLabelLocalized,
  getVariantLabelLocalized,
} from '@/lib/public-profile-copy';
import type { PublicProfileProduct, PublicProfileProductVariant } from './types';
import { useMediaUrl } from './media-url-context';
import {
  getProductDiscountPercent,
  ProductThumbnail,
} from './product-card-primitives';
import { cn } from './utils';

interface PublicProductDetailDialogProps {
  product: PublicProfileProduct | null;
  storeSlug: string;
  storeName?: string | null;
  storeAvatar?: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const EASE_OUT = [0.32, 0.72, 0, 1] as const;

const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const dialogShellMotion = {
  initial: { opacity: 0, scale: 0.96, y: 16 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 10 },
};

const contentContainerMotion = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.08,
    },
  },
};

const contentItemMotion = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: EASE_OUT,
    },
  },
};

const buyBarMotion = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.16,
      duration: 0.28,
      ease: EASE_OUT,
    },
  },
};

const numberSpring = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 34,
  mass: 0.72,
};

function AnimatedCounter({
  value,
  reduceMotion,
  className,
}: {
  value: number;
  reduceMotion: boolean | null;
  className?: string;
}) {
  const previousValueRef = useRef(value);
  let direction = 1;
  if (value !== previousValueRef.current) {
    direction = value > previousValueRef.current ? 1 : -1;
    previousValueRef.current = value;
  }

  if (reduceMotion) {
    return (
      <span dir="ltr" className={cn('tabular-nums', className)}>
        {value}
      </span>
    );
  }

  return (
    <span
      dir="ltr"
      className={cn(
        'relative inline-grid overflow-hidden tabular-nums',
        className,
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="invisible col-start-1 row-start-1">{value}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: direction * 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: direction * -14, opacity: 0 }}
          transition={numberSpring}
          className="col-start-1 row-start-1 justify-self-center whitespace-nowrap"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function AnimatedPriceValue({
  amount,
  currencyCode,
  reduceMotion,
  className,
}: {
  amount: number;
  currencyCode: string;
  reduceMotion: boolean | null;
  className?: string;
}) {
  const formatted = formatProfileDialogPriceIqd(amount, currencyCode);
  const previousAmountRef = useRef(amount);
  let direction = 1;
  if (amount !== previousAmountRef.current) {
    direction = amount > previousAmountRef.current ? 1 : -1;
    previousAmountRef.current = amount;
  }

  if (reduceMotion) {
    return (
      <span dir="ltr" className={cn('tabular-nums', className)}>
        {formatted}
      </span>
    );
  }

  return (
    <span
      dir="ltr"
      className={cn('relative inline-grid overflow-hidden tabular-nums', className)}
    >
      <span className="invisible col-start-1 row-start-1 whitespace-nowrap">{formatted}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={formatted}
          initial={{ y: direction * 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: direction * -12, opacity: 0 }}
          transition={numberSpring}
          className="col-start-1 row-start-1 justify-self-end whitespace-nowrap"
        >
          {formatted}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function getPrimaryVariantAttributeKey(variant: PublicProfileProductVariant | null): string {
  if (!variant?.attributes || typeof variant.attributes !== 'object') return 'variant';
  const [key] = Object.keys(variant.attributes as Record<string, unknown>);
  return key ?? 'variant';
}

function getMaxPurchaseQuantity(
  product: PublicProfileProduct,
  variant: PublicProfileProductVariant | null,
): number {
  if (product.isDigital) return 99;
  if (variant) return Math.max(0, variant.stock);
  return Math.max(0, product.stock);
}

function ProductQuantityStepper({
  value,
  max,
  onChange,
  onRemoveAtMin,
  decreaseLabel,
  increaseLabel,
  removeLabel,
  fullWidth = false,
  reduceMotion = false,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
  onRemoveAtMin?: () => void;
  decreaseLabel: string;
  increaseLabel: string;
  removeLabel?: string;
  fullWidth?: boolean;
  reduceMotion?: boolean | null;
}) {
  const canDecrease = value > 1 || Boolean(onRemoveAtMin);
  const canIncrease = value < max;

  return (
    <div
      className={cn(
        'inline-flex h-12 items-center rounded-xl bg-[var(--surface-secondary)] p-1',
        fullWidth ? 'w-full justify-between px-1.5' : 'shrink-0',
      )}
    >
      <button
        type="button"
        aria-label={value <= 1 && removeLabel ? removeLabel : decreaseLabel}
        disabled={!canDecrease}
        onClick={() => {
          if (value <= 1) {
            onRemoveAtMin?.();
            return;
          }
          onChange(Math.max(1, value - 1));
        }}
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-[9px] transition-colors',
          canDecrease
            ? 'text-[var(--foreground)] hover:bg-[var(--surface)]'
            : 'cursor-not-allowed text-[var(--muted-foreground)]/40',
        )}
      >
        <motion.span whileTap={reduceMotion ? undefined : { scale: 0.92 }} className="inline-flex">
          <Minus className="size-4" strokeWidth={2.2} aria-hidden />
        </motion.span>
      </button>
      <AnimatedCounter
        value={value}
        reduceMotion={reduceMotion}
        className="min-w-[1.75rem] px-2 text-center text-[15px] font-semibold text-[var(--foreground)]"
      />
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={!canIncrease}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-[9px] transition-colors',
          canIncrease
            ? 'text-[var(--foreground)] hover:bg-[var(--surface)]'
            : 'cursor-not-allowed text-[var(--muted-foreground)]/40',
        )}
      >
        <motion.span whileTap={reduceMotion ? undefined : { scale: 0.92 }} className="inline-flex">
          <Plus className="size-4" strokeWidth={2.2} aria-hidden />
        </motion.span>
      </button>
    </div>
  );
}

function ProductCartSummary({
  quantity,
  totalPrice,
  currencyCode,
  checkoutUrl,
  reduceMotion,
  labels,
}: {
  quantity: number;
  totalPrice: number;
  currencyCode: string;
  checkoutUrl: string;
  reduceMotion: boolean | null;
  labels: {
    total: string;
    proceed: string;
    proceedAria: string;
  };
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      transition={{ duration: 0.26, ease: EASE_OUT }}
      className="shrink-0"
    >
      <motion.a
        href={checkoutUrl}
        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
        aria-label={labels.proceedAria}
        className={cn(
          'group flex h-20 w-full items-center justify-between gap-3 overflow-hidden rounded-2xl bg-black',
          'ps-3.5 pe-5 text-white no-underline',
          'transition-transform duration-200',
        )}
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/12 text-[17px] font-semibold tabular-nums">
          <AnimatedCounter value={quantity} reduceMotion={reduceMotion} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-center">
          <span className="text-[11px] font-medium leading-none text-white/65">
            {labels.total}
          </span>
          <AnimatedPriceValue
            amount={totalPrice}
            currencyCode={currencyCode}
            reduceMotion={reduceMotion}
            className="text-[17px] font-semibold leading-none text-white"
          />
        </div>

        <span className="shrink-0 text-[13px] font-semibold text-white/90 transition-colors duration-200 group-hover:text-white">
          {labels.proceed}
        </span>
      </motion.a>
    </motion.div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-[var(--muted-foreground)]">{label}</dt>
      <dd dir="auto" className="mt-0.5 truncate text-[13px] font-medium text-[var(--foreground)]">
        {value}
      </dd>
    </div>
  );
}

function StoreProfileBadge({
  label,
  avatarUrl,
}: {
  label: string;
  avatarUrl: string | null;
}) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showAvatar = Boolean(avatarUrl) && !avatarFailed;
  const initial = label.trim().charAt(0).toUpperCase() || '?';

  return (
    <span className="inline-flex h-10 max-w-full items-center gap-2 rounded-full bg-[var(--foreground)] py-1 ps-1.5 pe-4">
      <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface)]">
        {showAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl!}
            alt=""
            className="size-full object-cover"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <span className="text-[11px] font-semibold text-[var(--foreground)]">{initial}</span>
        )}
      </span>
      <span className="truncate text-[15px] font-semibold text-[var(--background)]">{label}</span>
    </span>
  );
}

function ProductDialogPrice({
  price,
  salePrice,
  currencyCode,
}: {
  price: number;
  salePrice?: number | null;
  currencyCode: string;
}) {
  const parsedSale = salePrice != null ? Number(salePrice) : null;
  const hasDiscount =
    parsedSale != null && Number.isFinite(parsedSale) && parsedSale < price;

  if (!Number.isFinite(price)) {
    return (
      <span dir="ltr" className="text-[20px] tabular-nums text-[var(--muted-foreground)]">
        —
      </span>
    );
  }

  if (hasDiscount) {
    return (
      <span dir="ltr" className="flex min-w-0 flex-wrap items-baseline gap-2">
        <span className="text-[28px] font-medium tabular-nums leading-none text-[var(--foreground)]">
          {formatProfileDialogPriceIqd(parsedSale!, currencyCode)}
        </span>
        <span className="text-[17px] font-normal tabular-nums leading-none text-[var(--muted-foreground)] line-through">
          {formatProfileDialogPriceIqd(price, currencyCode)}
        </span>
      </span>
    );
  }

  return (
    <span
      dir="ltr"
      className="text-[28px] font-medium tabular-nums leading-none text-[var(--foreground)]"
    >
      {formatProfileDialogPriceIqd(price, currencyCode)}
    </span>
  );
}

export function PublicProductDetailDialog({
  product,
  storeSlug,
  storeName,
  storeAvatar,
  isOpen,
  onOpenChange,
}: PublicProductDetailDialogProps) {
  const t = useTranslations('publicProfile');
  const locale = useLocale() as AppLocale;
  const direction = getDirection(locale);
  const reduceMotion = useReducedMotion();
  const resolveMedia = useMediaUrl();
  const displayedProductRef = useRef<PublicProfileProduct | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [inCart, setInCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const currencyCode = t('product.currencyCode');

  if (product) {
    displayedProductRef.current = product;
  }

  const displayedProduct = product ?? displayedProductRef.current;

  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedVariantId(null);
    setInCart(false);
    setQuantity(1);
    setCopyState('idle');
  }, [displayedProduct?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onOpenChange]);

  const images = useMemo(
    () =>
      (displayedProduct?.images ?? [])
        .map((url) => resolveMedia(url))
        .filter(Boolean) as string[],
    [displayedProduct?.images, resolveMedia],
  );

  const variants = displayedProduct?.variants ?? [];
  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ?? null;

  const galleryImages = useMemo(() => {
    if (!selectedVariant?.imageUrl) return images;
    const variantImage = resolveMedia(selectedVariant.imageUrl);
    if (!variantImage) return images;
    return [variantImage, ...images.filter((url) => url !== variantImage)];
  }, [images, resolveMedia, selectedVariant?.imageUrl]);

  useEffect(() => {
    setActiveImageIndex(0);
    setInCart(false);
    setQuantity(1);
  }, [selectedVariantId]);

  useEffect(() => {
    if (isOpen) return;
    setInCart(false);
    setQuantity(1);
  }, [isOpen]);

  const maxQuantity = displayedProduct
    ? getMaxPurchaseQuantity(displayedProduct, selectedVariant)
    : 1;

  useEffect(() => {
    if (!displayedProduct) return;
    if (quantity <= maxQuantity) return;
    setQuantity(Math.max(1, maxQuantity));
  }, [displayedProduct, maxQuantity, quantity]);

  const handleCopyLink = useCallback(async () => {
    if (!displayedProduct) return;
    const url = `${window.location.origin}/${storeSlug}?product=${displayedProduct.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('idle');
    }
  }, [displayedProduct, storeSlug]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleAddToCart = useCallback(() => {
    setInCart(true);
    setQuantity(1);
  }, []);

  const handleRemoveFromCart = useCallback(() => {
    setInCart(false);
    setQuantity(1);
  }, []);

  const storeLabel = storeName?.trim() || storeSlug;
  const storeAvatarUrl = useMemo(
    () => resolveMedia(storeAvatar ?? null),
    [resolveMedia, storeAvatar],
  );

  if (!displayedProduct) return null;

  const variantOutOfStock =
    selectedVariant != null && !displayedProduct.isDigital && selectedVariant.stock <= 0;
  const outOfStock =
    (!displayedProduct.isDigital && displayedProduct.stock <= 0) || variantOutOfStock;
  const needsVariant =
    Boolean(displayedProduct.hasVariants && variants.length > 0) && !selectedVariant;
  const checkoutUrl = buildProductCheckoutUrl(
    storeSlug,
    displayedProduct,
    selectedVariant,
    quantity,
  );
  const heroImage = galleryImages[activeImageIndex] ?? galleryImages[0] ?? null;
  const displayPrice = selectedVariant
    ? Number(selectedVariant.price)
    : Number(displayedProduct.salePrice ?? displayedProduct.price);
  const cartTotalPrice = displayPrice * quantity;
  const comparePrice =
    !selectedVariant && displayedProduct.salePrice != null
      ? Number(displayedProduct.price)
      : null;
  const selectedVariantLabel = selectedVariant
    ? getVariantLabelLocalized(selectedVariant, t)
    : null;
  const variantAttributeKey = getPrimaryVariantAttributeKey(selectedVariant);
  const productPageUrl = `/${storeSlug}?product=${displayedProduct.id}`;
  const stock = getPublicProductStockDisplayLocalized(displayedProduct, t);
  const discount = getProductDiscountPercent(displayedProduct);
  const attributeRows = getProductAttributeRowsLocalized(displayedProduct.attributes, t);
  const kindLabel = getProductKindLabelLocalized(displayedProduct, t);
  const categoryLabel = displayedProduct.category?.trim() || null;

  const infoRows = [
    ...(displayedProduct.sku
      ? [{ label: t('product.dialog.sku'), value: displayedProduct.sku }]
      : []),
    ...attributeRows,
  ];

  const backdropTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: EASE_OUT };
  const dialogTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, damping: 34, stiffness: 380, mass: 0.9 };
  const imageTransition = reduceMotion ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div
          className={cn(
            'profile-product-dialog-layer profile-store-chrome',
            'fixed inset-0 z-[10000]',
          )}
        >
          <motion.button
            type="button"
            aria-label={t('product.dialog.close')}
            className="fixed inset-0 bg-black/20"
            {...backdropMotion}
            transition={backdropTransition}
            onClick={handleClose}
          />

          <motion.div
            className={cn(
              'fixed inset-0 box-border flex items-center justify-center',
              'px-4 pt-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-12',
            )}
            {...dialogShellMotion}
            transition={dialogTransition}
            onClick={handleClose}
          >
            <motion.div
              dir={direction}
              lang={locale}
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-detail-title"
              className={cn(
                'profile-store-chrome pointer-events-auto flex w-full max-w-[748px] shrink-0 flex-col overflow-hidden rounded-2xl',
                'max-h-[min(608px,90dvh)] h-[min(608px,calc(100dvh-7rem))]',
                'bg-[var(--surface)] p-0',
                'shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_8px_24px_5px_rgba(0,0,0,0.08)]',
                '[-webkit-font-smoothing:antialiased] outline-none',
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-0">
                <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-0 md:grid-cols-2 md:grid-rows-none md:items-stretch">
                  <section className="flex min-h-0 min-w-0 flex-col self-stretch p-4 md:sticky md:top-0 md:h-full md:p-5">
                    <div className="flex w-full min-h-0 flex-1 flex-col gap-2.5">
                      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[var(--surface-secondary)]">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={heroImage ?? 'empty'}
                            className="absolute inset-0"
                            initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.03 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }}
                            transition={imageTransition}
                          >
                            <ProductThumbnail
                              imageUrl={heroImage}
                              alt={displayedProduct.name}
                              className="size-full"
                              imageClassName="object-cover"
                              priority
                            />
                          </motion.div>
                        </AnimatePresence>

                        <div className="absolute start-2 top-2 z-[1] flex flex-col items-start gap-1">
                          {discount && !selectedVariant ? (
                            <span
                              className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-[var(--primary-foreground)]"
                              dir="ltr"
                            >
                              -{discount}%
                            </span>
                          ) : null}
                          {outOfStock ? (
                            <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                              {t('product.stock.outOfStock')}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {galleryImages.length > 1 ? (
                        <div className="flex items-center gap-1.5 overflow-x-auto ps-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {galleryImages.map((url, index) => (
                            <button
                              key={`${url}-${index}`}
                              type="button"
                              onClick={() => setActiveImageIndex(index)}
                              className={cn(
                                'shrink-0 overflow-hidden rounded-xl ring-2 ring-transparent transition-[opacity,transform] duration-150',
                                'hover:opacity-90 active:scale-[0.98]',
                                index === activeImageIndex
                                  ? 'opacity-100 ring-[var(--foreground)]'
                                  : 'opacity-55 hover:opacity-75',
                              )}
                              aria-label={t('product.dialog.imageAlt', { index: index + 1 })}
                              aria-current={index === activeImageIndex ? 'true' : undefined}
                            >
                              <ProductThumbnail imageUrl={url} alt="" className="size-11" />
                            </button>
                          ))}
                        </div>
                      ) : null}

                      <AnimatePresence initial={false}>
                        {inCart && !outOfStock && !needsVariant ? (
                          <div className="mt-auto -mb-2 md:-mb-3">
                            <ProductCartSummary
                              quantity={quantity}
                              totalPrice={cartTotalPrice}
                              currencyCode={currencyCode}
                              checkoutUrl={checkoutUrl}
                              reduceMotion={reduceMotion}
                              labels={{
                                total: t('product.dialog.cartTotal'),
                                proceed: t('product.dialog.proceedToCheckout'),
                                proceedAria: t('product.dialog.proceedToCheckoutAria', {
                                  count: quantity,
                                }),
                              }}
                            />
                          </div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </section>

                  <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:min-h-full">
                    <motion.div
                      className="product-detail-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain px-4 py-4 pb-[5.25rem] md:px-5 md:py-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      variants={reduceMotion ? undefined : contentContainerMotion}
                      initial={reduceMotion ? false : 'hidden'}
                      animate={reduceMotion ? undefined : 'show'}
                    >
                      <motion.div className="flex flex-col gap-1.5" variants={contentItemMotion}>
                        <div className="flex flex-wrap items-center gap-2">
                          <StoreProfileBadge label={storeLabel} avatarUrl={storeAvatarUrl} />
                          <span className="rounded-full bg-[var(--surface-secondary)] px-2 py-0.5 text-[11px] font-medium text-[var(--foreground)]">
                            {kindLabel}
                          </span>
                          {stock.variant !== 'muted' ? (
                            <span
                              className={cn(
                                'text-[11px] font-medium',
                                stock.variant === 'low'
                                  ? 'text-[var(--danger)]'
                                  : 'text-[var(--muted-foreground)]',
                              )}
                            >
                              {stock.label}
                            </span>
                          ) : null}
                        </div>

                        <h2
                          id="product-detail-title"
                          dir="auto"
                          className="text-[24px] font-normal leading-snug tracking-tight text-[var(--foreground)]"
                        >
                          {displayedProduct.name}
                        </h2>

                        <div className="mt-1.5 flex items-center gap-2 text-[13px]">
                          <span className="text-[var(--muted-foreground)]">
                            {t('product.dialog.category')}
                          </span>
                          <span
                            dir="auto"
                            className={cn(
                              categoryLabel
                                ? 'text-[var(--foreground)]'
                                : 'text-[var(--muted-foreground)]',
                            )}
                          >
                            {categoryLabel ?? t('product.dialog.noCategory')}
                          </span>
                        </div>

                        <div className="mt-1">
                          {selectedVariant ? (
                            <ProductDialogPrice
                              price={displayPrice}
                              currencyCode={currencyCode}
                            />
                          ) : (
                            <ProductDialogPrice
                              price={displayedProduct.price}
                              salePrice={displayedProduct.salePrice}
                              currencyCode={currencyCode}
                            />
                          )}
                          {comparePrice != null &&
                          Number.isFinite(comparePrice) &&
                          comparePrice > displayPrice ? (
                            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                              {t('product.dialog.saved')}{' '}
                              <span dir="ltr" className="tabular-nums">
                                {formatProfileDialogPriceIqd(
                                  comparePrice - displayPrice,
                                  currencyCode,
                                )}
                              </span>
                            </p>
                          ) : null}
                        </div>

                        {!displayedProduct.isDigital ? (
                          <p className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
                            <Truck className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                            {t('product.dialog.shippingNote')}
                          </p>
                        ) : null}
                      </motion.div>

                      {variants.length > 0 ? (
                        <motion.div className="flex flex-col gap-2" variants={contentItemMotion}>
                          <p className="text-[12px] font-medium text-[var(--foreground)]">
                            {getVariantAttributeLabelLocalized(variantAttributeKey, t)}:{' '}
                            <span className="font-normal text-[var(--muted-foreground)]">
                              {selectedVariantLabel ?? t('product.variants.chooseOption')}
                            </span>
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {variants.map((variant) => {
                              const label = getVariantLabelLocalized(variant, t);
                              const isSelected = selectedVariantId === variant.id;
                              const variantUnavailable =
                                !displayedProduct.isDigital && variant.stock <= 0;
                              return (
                                <motion.button
                                  key={variant.id}
                                  type="button"
                                  disabled={variantUnavailable}
                                  onClick={() => setSelectedVariantId(variant.id)}
                                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                                  className={cn(
                                    'rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors',
                                    'ring-1 ring-[var(--border)]',
                                    isSelected
                                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] ring-[var(--primary)]'
                                      : 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]',
                                    variantUnavailable && 'cursor-not-allowed opacity-40 line-through',
                                  )}
                                >
                                  {label}
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      ) : null}

                      {infoRows.length > 0 ? (
                        <motion.dl
                          className="grid grid-cols-2 gap-x-5 gap-y-2.5"
                          variants={contentItemMotion}
                        >
                          {infoRows.map((row) => (
                            <MetaItem key={row.label} label={row.label} value={row.value} />
                          ))}
                        </motion.dl>
                      ) : null}

                      <motion.div
                        className="relative flex w-full flex-wrap items-center gap-2.5"
                        variants={contentItemMotion}
                      >
                        <a
                          href={productPageUrl}
                          className={cn(
                            'inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[12px]',
                            'border border-[var(--border)] bg-[var(--surface)] ps-4 pe-3',
                            'text-[14px] font-medium text-[var(--foreground)] no-underline',
                            'transition-colors hover:bg-[var(--surface-secondary)]',
                          )}
                        >
                          <ExternalLink className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                          {t('product.dialog.productPage')}
                        </a>
                        <button
                          type="button"
                          aria-label={
                            copyState === 'copied'
                              ? t('product.dialog.copyLinkAriaCopied')
                              : t('product.dialog.copyLinkAria')
                          }
                          onClick={handleCopyLink}
                          className={cn(
                            'inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[12px]',
                            'border border-[var(--border)] bg-[var(--surface)] ps-3 pe-4',
                            'text-[14px] font-medium text-[var(--foreground)]',
                            'transition-colors hover:bg-[var(--surface-secondary)]',
                          )}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            {copyState === 'copied' ? (
                              <motion.span
                                key="copied"
                                className="inline-flex items-center gap-2"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.16, ease: EASE_OUT }}
                              >
                                <Check
                                  className="size-4 shrink-0 text-[var(--success)]"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                                {t('product.dialog.copied')}
                              </motion.span>
                            ) : (
                              <motion.span
                                key="copy"
                                className="inline-flex items-center gap-2"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.16, ease: EASE_OUT }}
                              >
                                <Copy className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                                {t('product.dialog.copyLink')}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </button>
                      </motion.div>

                      {displayedProduct.description ? (
                        <motion.div
                          className="mt-4 border-t border-[var(--border)] pt-5"
                          variants={contentItemMotion}
                        >
                          <p className="mb-2 text-[12px] font-medium text-[var(--foreground)]">
                            {t('product.dialog.description')}
                          </p>
                          <p
                            dir="auto"
                            className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--muted-foreground)]"
                          >
                            {displayedProduct.description}
                          </p>
                        </motion.div>
                      ) : null}
                    </motion.div>

                    <motion.div
                      className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
                      {...(reduceMotion ? {} : buyBarMotion)}
                      initial={reduceMotion ? false : buyBarMotion.initial}
                      animate={reduceMotion ? undefined : buyBarMotion.animate}
                    >
                      <div
                        className="pointer-events-none h-8 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/90 to-transparent"
                        aria-hidden
                      />
                      <div className="pointer-events-auto bg-[var(--surface)] px-4 pb-4 md:px-5">
                        {outOfStock ? (
                          <div className="flex h-12 w-full items-center justify-center !rounded-xl bg-[var(--surface-secondary)] text-[14px] font-medium text-[var(--muted-foreground)]">
                            {t('product.dialog.outOfStock')}
                          </div>
                        ) : needsVariant ? (
                          <div className="flex h-12 w-full items-center justify-center !rounded-xl bg-[var(--surface-secondary)] text-[14px] font-semibold text-[var(--muted-foreground)]">
                            {t('product.variants.chooseToContinue')}
                          </div>
                        ) : (
                          <div className="relative flex h-12 w-full items-center justify-center">
                            <AnimatePresence mode="wait" initial={false}>
                              {!inCart ? (
                                <motion.button
                                  key="add-to-cart"
                                  type="button"
                                  initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                                  animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                                  transition={{ duration: 0.22, ease: EASE_OUT }}
                                  onClick={handleAddToCart}
                                  aria-label={t('product.dialog.addToCartAria', {
                                    name: displayedProduct.name,
                                  })}
                                  className={cn(
                                    'absolute inset-0 inline-flex h-12 w-full items-center justify-center gap-2.5 !rounded-xl',
                                    'bg-[var(--primary)] text-[15px] font-semibold text-[var(--primary-foreground)]',
                                    'transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.99]',
                                  )}
                                >
                                  <ShoppingBag className="size-[18px] shrink-0" strokeWidth={2.2} aria-hidden />
                                  {t('product.dialog.addToCart')}
                                </motion.button>
                              ) : (
                                <motion.div
                                  key="cart-stepper"
                                  initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                                  animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                                  transition={{ duration: 0.22, ease: EASE_OUT }}
                                >
                                  <ProductQuantityStepper
                                    value={quantity}
                                    max={maxQuantity}
                                    onChange={setQuantity}
                                    onRemoveAtMin={handleRemoveFromCart}
                                    decreaseLabel={t('product.dialog.decreaseQuantity')}
                                    increaseLabel={t('product.dialog.increaseQuantity')}
                                    removeLabel={t('product.dialog.removeFromCart')}
                                    reduceMotion={reduceMotion}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </section>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
