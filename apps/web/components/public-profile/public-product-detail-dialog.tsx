'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
import { ProfileEntityPill } from '@/components/public-profile/profile-entity-pill';
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

function AddToCartControl({
  inCart,
  quantity,
  maxQuantity,
  disabled,
  outOfStock,
  needsVariant,
  reduceMotion,
  expand = false,
  labels,
  onAdd,
  onChange,
  onRemoveAtMin,
}: {
  inCart: boolean;
  quantity: number;
  maxQuantity: number;
  disabled?: boolean;
  outOfStock: boolean;
  needsVariant: boolean;
  reduceMotion: boolean | null;
  /** Stretch to fill available width (merged footer). */
  expand?: boolean;
  labels: {
    add: string;
    addAria: string;
    outOfStock: string;
    chooseVariant: string;
    decrease: string;
    increase: string;
    remove: string;
  };
  onAdd: () => void;
  onChange: (next: number) => void;
  onRemoveAtMin: () => void;
}) {
  if (outOfStock) {
    return (
      <div
        className={cn(
          'flex h-12 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[13px] font-semibold text-[var(--muted-foreground)]',
          expand ? 'w-full' : 'w-full max-w-[220px]',
        )}
      >
        {labels.outOfStock}
      </div>
    );
  }

  if (needsVariant) {
    return (
      <div
        className={cn(
          'flex h-12 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] px-3 text-center text-[12px] font-semibold text-[var(--muted-foreground)]',
          expand ? 'w-full' : 'w-full max-w-[220px]',
        )}
      >
        {labels.chooseVariant}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative h-12 overflow-hidden rounded-2xl bg-[var(--foreground)] text-[var(--surface)]',
        expand ? 'min-w-0 flex-1' : 'w-[158px] shrink-0',
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {!inCart ? (
          <motion.button
            key="add"
            type="button"
            disabled={disabled}
            onClick={onAdd}
            aria-label={labels.addAria}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-0 flex items-center justify-center gap-1.5 disabled:pointer-events-none disabled:opacity-50"
          >
            <ShoppingBag className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
            <span className="whitespace-nowrap text-[13px] font-semibold">{labels.add}</span>
          </motion.button>
        ) : (
          <motion.div
            key="qty"
            dir="ltr"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-0 flex items-center"
          >
            <button
              type="button"
              aria-label={quantity <= 1 ? labels.remove : labels.decrease}
              onClick={() => {
                if (quantity <= 1) {
                  onRemoveAtMin();
                  return;
                }
                onChange(quantity - 1);
              }}
              className="flex h-12 w-11 shrink-0 items-center justify-center text-[var(--surface)] transition-opacity hover:opacity-80"
            >
              <Minus className="size-3.5" strokeWidth={2.4} aria-hidden />
            </button>
            <span className="flex flex-1 items-center justify-center">
              <AnimatedCounter
                value={quantity}
                reduceMotion={reduceMotion}
                className="text-[16px] font-semibold leading-none"
              />
            </span>
            <button
              type="button"
              aria-label={labels.increase}
              disabled={quantity >= maxQuantity}
              onClick={() => onChange(Math.min(maxQuantity, quantity + 1))}
              className={cn(
                'flex h-12 w-11 shrink-0 items-center justify-center text-[var(--surface)] transition-opacity',
                quantity >= maxQuantity ? 'opacity-35' : 'hover:opacity-80',
              )}
            >
              <Plus className="size-3.5" strokeWidth={2.4} aria-hidden />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
    <motion.button
      type="button"
      onClick={onOpenCart}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      aria-label={labels.proceedAria}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 4 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className={cn(
        'group flex min-w-0 items-center overflow-hidden rounded-2xl',
        'border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)]',
        narrow
          ? 'h-12 flex-1 gap-2 py-1 ps-2 pe-2'
          : 'h-12 w-full gap-2.5 py-1.5 ps-2 pe-2',
      )}
    >
      <span
        className="relative flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--foreground)]"
        aria-hidden
      >
        <ShoppingBag className="size-3.5" strokeWidth={2} />
        <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--foreground)] px-1 text-[9px] font-bold tabular-nums leading-none text-[var(--surface)]">
          <AnimatedCounter value={quantity} reduceMotion={reduceMotion} />
        </span>
      </span>

      <div className="min-w-0 flex-1 text-start">
        <AnimatedPriceValue
          amount={totalPrice}
          currencyCode={currencyCode}
          reduceMotion={reduceMotion}
          className="max-w-full truncate text-[13px] font-semibold leading-none text-[var(--foreground)]"
        />
      </div>

      <span className="shrink-0 text-[11px] font-semibold text-[var(--foreground)]">
        {labels.proceed}
      </span>
    </motion.button>
  );
}

function ProductDialogMobileFooter({
  purchase,
  cartCount,
  cartTotal,
  currencyCode,
  onOpenCart,
  reduceMotion,
  cartLabels,
}: {
  purchase: ReactNode;
  cartCount: number;
  cartTotal: number;
  currencyCode: string;
  onOpenCart: () => void;
  reduceMotion: boolean | null;
  cartLabels: {
    total: string;
    proceed: string;
    proceedAria: string;
  };
}) {
  const showCart = cartCount > 0;

  return (
    <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 sm:hidden">
      {/* LTR row so Add to cart stays on the physical right */}
      <div
        dir="ltr"
        className={cn('flex items-center gap-2', !showCart && 'justify-end')}
      >
        <AnimatePresence initial={false}>
          {showCart ? (
            <ProductCartSummary
              quantity={cartCount}
              totalPrice={cartTotal}
              currencyCode={currencyCode}
              onOpenCart={onOpenCart}
              reduceMotion={reduceMotion}
              narrow
              labels={cartLabels}
            />
          ) : null}
        </AnimatePresence>
        {purchase}
      </div>
    </div>
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
    <span className="inline-flex max-w-full items-center gap-1 whitespace-nowrap sm:gap-1.5">
      <span className="text-[10px] text-[var(--muted-foreground)] sm:text-[11px]">{label}</span>
      <span dir="auto" className="truncate text-[11px] font-medium text-[var(--foreground)] sm:text-[12px]">
        {value}
      </span>
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
  const maxQuantity = getMaxPurchaseQuantity(displayedProduct, selectedVariant);
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
  const cartSummaryLabels = {
    total: t('product.dialog.cartTotal'),
    proceed: t('product.dialog.proceedToCheckout'),
    proceedAria: t('product.dialog.proceedToCheckoutAria', {
      count: itemCount,
    }),
  };

  const addToCartLabels = {
    add: t('product.dialog.addToCart'),
    addAria: t('product.dialog.addToCartAria', { name: displayedProduct.name }),
    outOfStock: t('product.dialog.outOfStock'),
    chooseVariant: t('product.variants.chooseToContinue'),
    decrease: t('product.dialog.decreaseQuantity'),
    increase: t('product.dialog.increaseQuantity'),
    remove: t('product.dialog.removeFromCart'),
  };

  const purchaseAction = (expand: boolean) => (
    <AddToCartControl
      inCart={inCart}
      quantity={quantity}
      maxQuantity={maxQuantity}
      disabled={cartDisabled}
      outOfStock={outOfStock}
      needsVariant={needsVariant}
      reduceMotion={reduceMotion}
      expand={expand}
      labels={addToCartLabels}
      onAdd={handleAddToCart}
      onChange={handleQuantityChange}
      onRemoveAtMin={handleRemoveFromCart}
    />
  );

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
            className="fixed inset-0 min-h-dvh !h-dvh bg-black/35"
            {...backdropMotion}
            transition={backdropTransition}
            onClick={handleClose}
          />

          <motion.div
            className={cn(
              'pointer-events-none fixed inset-0 box-border flex',
              // Mobile: bottom sheet. Desktop: centered modal.
              'items-end justify-center sm:items-center',
              'px-0 pb-[env(safe-area-inset-bottom)] pt-[max(0.75rem,env(safe-area-inset-top))]',
              'sm:px-3 sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-8',
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
                'profile-store-chrome pointer-events-auto flex w-full flex-col overflow-hidden outline-none',
                'max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-0.5rem))]',
                'bg-[var(--surface)]',
                // Mobile sheet vs desktop card
                'rounded-t-3xl border border-[var(--border)] border-b-0 sm:rounded-3xl sm:border-b',
                'max-w-none sm:max-w-3xl',
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden>
                <span className="h-1 w-10 rounded-full bg-[var(--border)]" />
              </div>

              <div
                className={cn(
                  'min-h-0 flex-1 overflow-y-auto overscroll-y-contain',
                  'px-4 pb-3 pt-2 sm:p-5',
                  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                )}
              >
                <div
                  className={cn(
                    'grid min-w-0 gap-5',
                    'sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-start sm:gap-5',
                  )}
                >
                  <div className="flex min-w-0 flex-col gap-2.5 sm:h-full">
                    <div className="relative overflow-hidden rounded-2xl bg-[var(--surface-secondary)]">
                      <ProductThumbnail
                        imageUrl={heroImage}
                        alt={displayedProduct.name}
                        className="aspect-[4/3] w-full sm:aspect-square"
                        imageClassName="object-cover"
                        priority
                      />
                      {discount && !selectedVariant ? (
                        <span
                          className="absolute start-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white"
                          dir="ltr"
                        >
                          -{discount}%
                        </span>
                      ) : null}
                      {outOfStock ? (
                        <span className="absolute start-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {t('product.stock.outOfStock')}
                        </span>
                      ) : null}
                    </div>

                    {galleryImages.length > 1 ? (
                      <div className="-mx-0.5 flex items-center gap-2 overflow-x-auto px-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {galleryImages.map((url, index) => (
                          <button
                            key={`${url}-${index}`}
                            type="button"
                            onClick={() => setActiveImageIndex(index)}
                            className={cn(
                              'shrink-0 overflow-hidden rounded-xl transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98]',
                              index === activeImageIndex
                                ? 'opacity-100 ring-2 ring-[var(--foreground)] ring-offset-2 ring-offset-[var(--surface)]'
                                : 'opacity-50 hover:opacity-75',
                            )}
                            aria-label={t('product.dialog.imageAlt', { index: index + 1 })}
                            aria-current={index === activeImageIndex ? 'true' : undefined}
                          >
                            <ProductThumbnail imageUrl={url} alt="" className="size-12" />
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <AnimatePresence initial={false}>
                      {itemCount > 0 ? (
                        <div className="mt-auto hidden w-full pt-1 sm:block">
                          <ProductCartSummary
                            quantity={itemCount}
                            totalPrice={subtotal}
                            currencyCode={currencyCode}
                            onOpenCart={openCart}
                            reduceMotion={reduceMotion}
                            labels={cartSummaryLabels}
                          />
                        </div>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  <div className="flex min-w-0 flex-col gap-4">
                    <ProfileEntityPill
                      label={storeLabel}
                      imageUrl={storeAvatarUrl}
                      selected
                      className="h-8 w-fit ps-1.5 pe-3 sm:h-9 sm:ps-2 sm:pe-4 [&_span:first-child]:size-5 sm:[&_span:first-child]:size-6 [&_span:last-child]:text-xs sm:[&_span:last-child]:text-[13px]"
                    />

                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                        <ProductKindBadge label={kindLabel} />
                        {stock.variant !== 'muted' ? (
                          <>
                            <span className="text-[var(--border)]" aria-hidden>
                              ·
                            </span>
                            <ProductStockBadge label={stock.label} variant={stock.variant} />
                          </>
                        ) : null}
                      </div>

                      <h2
                        id="product-detail-title"
                        dir="auto"
                        className="text-[20px] font-semibold leading-snug tracking-tight text-[var(--foreground)] sm:text-[18px]"
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

                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[var(--surface-secondary)] px-3 py-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1.5 sm:bg-transparent sm:p-0">
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
                        className="text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:line-clamp-3"
                      >
                        {displayedProduct.description}
                      </p>
                    ) : null}

                    {infoRows.length > 0 ? (
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-[var(--border)] px-3 py-3">
                        {infoRows.map((row) => (
                          <MetaItem key={row.label} label={row.label} value={row.value} />
                        ))}
                      </dl>
                    ) : null}

                    {variants.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-[12px] font-medium text-[var(--muted-foreground)]">
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
                                  'rounded-2xl px-3.5 py-2 text-[12px] font-medium transition-colors',
                                  'border border-[var(--border)]',
                                  isSelected
                                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                                    : 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]',
                                  variantUnavailable &&
                                    'cursor-not-allowed opacity-40 line-through',
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
                          'inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl',
                          'border border-[var(--border)] bg-[var(--surface)] text-[12px] font-medium text-[var(--foreground)] no-underline sm:text-[13px]',
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
                          'inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl',
                          'border border-[var(--border)] bg-[var(--surface)] text-[12px] font-medium text-[var(--foreground)] sm:text-[13px]',
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

                    <div className="hidden items-center justify-center pt-1 sm:flex">
                      {purchaseAction(false)}
                    </div>
                  </div>
                </div>
              </div>

              <ProductDialogMobileFooter
                purchase={purchaseAction(itemCount === 0)}
                cartCount={itemCount}
                cartTotal={subtotal}
                currencyCode={currencyCode}
                onOpenCart={openCart}
                reduceMotion={reduceMotion}
                cartLabels={cartSummaryLabels}
              />
            </motion.div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
    </BodyPortal>
  );
}
