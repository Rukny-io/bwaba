'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BodyPortal } from './use-body-portal';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Copy, ExternalLink, Minus, Plus, ShoppingBag } from 'lucide-react';
import { getMaxPurchaseQuantity } from '@/lib/store-cart';
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
  ProductKindBadge,
  ProductPriceDisplay,
  ProductStockBadge,
  ProductThumbnail,
} from './product-card-primitives';
import { useStoreCart } from './store-cart-context';
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
          className="col-start-1 row-start-1 justify-self-center whitespace-nowrap"
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
      dir="ltr"
      className={cn(
        'inline-flex h-9 items-center rounded-lg bg-[var(--surface-secondary)] p-0.5',
        fullWidth ? 'w-full justify-between px-1' : 'min-w-[7.5rem] shrink-0 justify-between px-1 self-start',
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
          'inline-flex size-7 items-center justify-center rounded-md transition-colors',
          canDecrease
            ? 'text-[var(--foreground)] hover:bg-[var(--surface)]'
            : 'cursor-not-allowed text-[var(--muted-foreground)]/40',
        )}
      >
        <motion.span whileTap={reduceMotion ? undefined : { scale: 0.92 }} className="inline-flex">
          <Minus className="size-3.5" strokeWidth={2.2} aria-hidden />
        </motion.span>
      </button>
      <AnimatedCounter
        value={value}
        reduceMotion={reduceMotion}
        className="min-w-[2rem] px-2 text-center text-sm font-semibold text-[var(--foreground)]"
      />
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={!canIncrease}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(
          'inline-flex size-7 items-center justify-center rounded-md transition-colors',
          canIncrease
            ? 'text-[var(--foreground)] hover:bg-[var(--surface)]'
            : 'cursor-not-allowed text-[var(--muted-foreground)]/40',
        )}
      >
        <motion.span whileTap={reduceMotion ? undefined : { scale: 0.92 }} className="inline-flex">
          <Plus className="size-3.5" strokeWidth={2.2} aria-hidden />
        </motion.span>
      </button>
    </div>
  );
}

function ProductCartSummary({
  quantity,
  totalPrice,
  currencyCode,
  onOpenCart,
  reduceMotion,
  narrow = false,
  labels,
}: {
  quantity: number;
  totalPrice: number;
  currencyCode: string;
  onOpenCart: () => void;
  reduceMotion: boolean | null;
  narrow?: boolean;
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
      <motion.button
        type="button"
        onClick={onOpenCart}
        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
        aria-label={labels.proceedAria}
        className={cn(
          'group flex w-full items-center justify-between overflow-hidden rounded-full bg-[var(--foreground)] text-[var(--background)]',
          'transition-transform duration-200',
          narrow ? 'h-12 gap-1.5 py-1 ps-1.5 pe-3' : 'h-16 gap-3 py-1.5 ps-2 pe-5',
        )}
      >
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-[var(--surface)] font-semibold tabular-nums text-[var(--foreground)]',
            narrow ? 'size-8 text-[13px]' : 'size-10 text-[15px]',
          )}
        >
          <AnimatedCounter value={quantity} reduceMotion={reduceMotion} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-center">
          <span
            className={cn(
              'font-medium leading-none text-[var(--background)]/65',
              narrow ? 'text-[9px]' : 'text-[11px]',
            )}
          >
            {labels.total}
          </span>
          <AnimatedPriceValue
            amount={totalPrice}
            currencyCode={currencyCode}
            reduceMotion={reduceMotion}
            className={cn(
              'max-w-full truncate font-semibold leading-none text-[var(--background)]',
              narrow ? 'text-[12px]' : 'text-[17px]',
            )}
          />
        </div>

        {narrow ? (
          <ShoppingBag
            className="size-3.5 shrink-0 text-[var(--background)]/90"
            strokeWidth={2.2}
            aria-hidden
          />
        ) : (
          <span className="shrink-0 text-[13px] font-semibold text-[var(--background)]/90 transition-colors duration-200 group-hover:text-[var(--background)]">
            {labels.proceed}
          </span>
        )}
      </motion.button>
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

function InlineMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-[11px] text-[var(--muted-foreground)]">{label}</span>
      <span dir="auto" className="text-[12px] font-medium text-[var(--foreground)]">{value}</span>
    </span>
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
    <span className="inline-flex h-8 w-fit max-w-full items-center gap-1.5 rounded-full bg-[var(--foreground)] py-0.5 ps-1 pe-3">
      <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface)]">
        {showAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl!}
            alt=""
            className="size-full object-cover"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <span className="text-[9px] font-semibold text-[var(--foreground)]">{initial}</span>
        )}
      </span>
      <span className="truncate text-[12px] font-semibold text-[var(--background)]">{label}</span>
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
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const currencyCode = t('product.currencyCode');
  const currencyShort = t('product.currencyShort');
  const {
    itemCount,
    subtotal,
    addItem,
    updateQuantity,
    removeItem,
    isInCart,
    getItemQuantity,
    openCart,
    setProductDialogOpen,
    disabled: cartDisabled,
  } = useStoreCart();

  if (product) {
    displayedProductRef.current = product;
  }

  const displayedProduct = product ?? displayedProductRef.current;

  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedVariantId(null);
    setCopyState('idle');
  }, [displayedProduct?.id]);

  useEffect(() => {
    setProductDialogOpen(isOpen);
    return () => setProductDialogOpen(false);
  }, [isOpen, setProductDialogOpen]);

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
  }, [selectedVariantId]);

  const maxQuantity = displayedProduct
    ? getMaxPurchaseQuantity(displayedProduct, selectedVariant)
    : 1;

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
    if (!displayedProduct || cartDisabled) return;
    const imageUrl = galleryImages[activeImageIndex] ?? galleryImages[0] ?? null;
    addItem(displayedProduct, selectedVariant, 1, imageUrl);
  }, [
    activeImageIndex,
    addItem,
    cartDisabled,
    displayedProduct,
    galleryImages,
    selectedVariant,
  ]);

  const handleRemoveFromCart = useCallback(() => {
    if (!displayedProduct) return;
    removeItem(displayedProduct.id, selectedVariant?.id);
  }, [displayedProduct, removeItem, selectedVariant?.id]);

  const handleQuantityChange = useCallback(
    (next: number) => {
      if (!displayedProduct) return;
      updateQuantity(displayedProduct.id, selectedVariant?.id, next);
    },
    [displayedProduct, selectedVariant?.id, updateQuantity],
  );

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
  const heroImage = galleryImages[activeImageIndex] ?? galleryImages[0] ?? null;
  const displayPrice = selectedVariant
    ? Number(selectedVariant.price)
    : Number(displayedProduct.salePrice ?? displayedProduct.price);
  const inCart = isInCart(displayedProduct.id, selectedVariant?.id);
  const quantity = inCart ? getItemQuantity(displayedProduct.id, selectedVariant?.id) : 1;
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

  const infoRows = attributeRows;

  const backdropTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: EASE_OUT };
  const dialogTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, damping: 34, stiffness: 380, mass: 0.9 };
  return (
    <BodyPortal>
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            {...backdropMotion}
            transition={backdropTransition}
            onClick={handleClose}
          />

          <motion.div
            className={cn(
              'pointer-events-none fixed inset-0 box-border flex items-center justify-center',
              'px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 sm:px-3 sm:pt-8',
            )}
            {...dialogShellMotion}
            transition={dialogTransition}
          >
            <motion.div
              dir={direction}
              lang={locale}
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-detail-title"
              className={cn(
                'profile-store-chrome pointer-events-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-4xl',
                'max-h-[min(90dvh,calc(100dvh-3rem))]',
                'bg-[var(--surface)] p-0 outline-none',
                'shadow-[0_8px_24px_5px_rgba(0,0,0,0.08)]',
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className={cn(
                  'min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 sm:p-5',
                  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                )}
              >
                <div
                  className={cn(
                    'grid min-w-0 gap-4',
                    'sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-stretch sm:gap-5',
                  )}
                >
                <div className="flex min-w-0 flex-col gap-2 sm:h-full">
                  <div className="relative overflow-hidden rounded-2xl bg-[var(--surface-secondary)]">
                    <ProductThumbnail
                      imageUrl={heroImage}
                      alt={displayedProduct.name}
                      className="aspect-square w-full"
                      imageClassName="object-cover"
                      priority
                    />
                    {discount && !selectedVariant ? (
                      <span
                        className="absolute start-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm"
                        dir="ltr"
                      >
                        -{discount}%
                      </span>
                    ) : null}
                    {outOfStock ? (
                      <span className="absolute start-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                        {t('product.stock.outOfStock')}
                      </span>
                    ) : null}
                  </div>

                  {galleryImages.length > 1 ? (
                    <div className="flex items-center gap-1.5 overflow-hidden ps-1">
                      {galleryImages.map((url, index) => (
                        <button
                          key={`${url}-${index}`}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={cn(
                            'shrink-0 overflow-hidden rounded-lg transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98]',
                            index === activeImageIndex
                              ? 'opacity-100'
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
                    {itemCount > 0 ? (
                      <>
                        <div className="sm:hidden">
                          <ProductCartSummary
                            quantity={itemCount}
                            totalPrice={subtotal}
                            currencyCode={currencyCode}
                            onOpenCart={openCart}
                            reduceMotion={reduceMotion}
                            labels={{
                              total: t('product.dialog.cartTotal'),
                              proceed: t('product.dialog.proceedToCheckout'),
                              proceedAria: t('product.dialog.proceedToCheckoutAria', {
                                count: itemCount,
                              }),
                            }}
                          />
                        </div>
                        <div className="mt-auto hidden w-full pt-2 sm:block">
                          <ProductCartSummary
                            quantity={itemCount}
                            totalPrice={subtotal}
                            currencyCode={currencyCode}
                            onOpenCart={openCart}
                            reduceMotion={reduceMotion}
                            narrow
                            labels={{
                              total: t('product.dialog.cartTotal'),
                              proceed: t('product.dialog.proceedToCheckout'),
                              proceedAria: t('product.dialog.proceedToCheckoutAria', {
                                count: itemCount,
                              }),
                            }}
                          />
                        </div>
                      </>
                    ) : null}
                  </AnimatePresence>
                </div>

                <div className="flex min-w-0 flex-col gap-3.5">
                  <StoreProfileBadge label={storeLabel} avatarUrl={storeAvatarUrl} />

                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                      <ProductKindBadge label={kindLabel} />
                      {stock.variant !== 'muted' ? (
                        <>
                          <span className="text-[var(--border)]" aria-hidden>·</span>
                          <ProductStockBadge label={stock.label} variant={stock.variant} />
                        </>
                      ) : null}
                    </div>

                    <h2
                      id="product-detail-title"
                      dir="auto"
                      className="text-[18px] font-semibold leading-snug tracking-tight text-[var(--foreground)]"
                    >
                      {displayedProduct.name}
                    </h2>

                    <ProductPriceDisplay
                      price={selectedVariant ? displayPrice : displayedProduct.price}
                      salePrice={selectedVariant ? null : displayedProduct.salePrice}
                      layout="inline"
                      size="md"
                      currencyShort={currencyShort}
                      className="mt-0.5"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-0.5">
                    <InlineMetaItem
                      label={t('product.dialog.stock')}
                      value={stock.variant !== 'muted' ? stock.label : '—'}
                    />
                    <InlineMetaItem
                      label={t('product.dialog.category')}
                      value={categoryLabel ?? t('product.dialog.noCategory')}
                    />
                    {displayedProduct.sku ? (
                      <InlineMetaItem
                        label={t('product.dialog.sku')}
                        value={displayedProduct.sku}
                      />
                    ) : null}
                  </div>

                  {displayedProduct.description ? (
                    <p
                      dir="auto"
                      className="line-clamp-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]"
                    >
                      {displayedProduct.description}
                    </p>
                  ) : null}

                  {infoRows.length > 0 ? (
                    <dl className="grid grid-cols-2 gap-x-5 gap-y-2">
                      {infoRows.map((row) => (
                        <MetaItem key={row.label} label={row.label} value={row.value} />
                      ))}
                    </dl>
                  ) : null}

                  {variants.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[11px] font-medium text-[var(--muted-foreground)]">
                        {getVariantAttributeLabelLocalized(variantAttributeKey, t)}:{' '}
                        <span className="font-normal text-[var(--foreground)]">
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
                            <button
                              key={variant.id}
                              type="button"
                              disabled={variantUnavailable}
                              onClick={() => setSelectedVariantId(variant.id)}
                              className={cn(
                                'rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
                                'ring-1 ring-[var(--border)]',
                                isSelected
                                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] ring-[var(--primary)]'
                                  : 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]',
                                variantUnavailable && 'cursor-not-allowed opacity-40 line-through',
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-stretch gap-2">
                    <a
                      href={productPageUrl}
                      className={cn(
                        'inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl',
                        'border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--foreground)] no-underline',
                        'transition-colors hover:bg-[var(--surface-secondary)]',
                      )}
                    >
                      <ExternalLink className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
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
                        'inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl',
                        'border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--foreground)]',
                        'transition-colors hover:bg-[var(--surface-secondary)]',
                      )}
                    >
                      {copyState === 'copied' ? (
                        <>
                          <Check
                            className="size-3.5 shrink-0 text-[var(--success)]"
                            strokeWidth={2}
                            aria-hidden
                          />
                          {t('product.dialog.copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                          {t('product.dialog.copyLink')}
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    {outOfStock ? (
                      <div className="flex h-10 w-full items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[13px] font-medium text-[var(--muted-foreground)]">
                        {t('product.dialog.outOfStock')}
                      </div>
                    ) : needsVariant ? (
                      <div className="flex h-10 w-full items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[13px] font-semibold text-[var(--muted-foreground)]">
                        {t('product.variants.chooseToContinue')}
                      </div>
                    ) : !inCart ? (
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        aria-label={t('product.dialog.addToCartAria', {
                          name: displayedProduct.name,
                        })}
                        className={cn(
                          'inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl',
                          'bg-[var(--primary)] text-[13px] font-semibold text-[var(--primary-foreground)]',
                          'transition-opacity hover:opacity-90 active:scale-[0.99]',
                        )}
                      >
                        <ShoppingBag className="size-4 shrink-0" strokeWidth={2.2} aria-hidden />
                        {t('product.dialog.addToCart')}
                      </button>
                    ) : (
                      <ProductQuantityStepper
                        value={quantity}
                        max={maxQuantity}
                        onChange={handleQuantityChange}
                        onRemoveAtMin={handleRemoveFromCart}
                        decreaseLabel={t('product.dialog.decreaseQuantity')}
                        increaseLabel={t('product.dialog.increaseQuantity')}
                        removeLabel={t('product.dialog.removeFromCart')}
                        reduceMotion={reduceMotion}
                      />
                    )}
                  </div>
                </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
    </BodyPortal>
  );
}
