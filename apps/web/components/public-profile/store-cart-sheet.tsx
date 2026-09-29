'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { BodyPortal } from './use-body-portal';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { buildStoreCheckoutUrl } from '@/lib/checkout-url';
import { formatProfilePriceAmount } from '@/lib/public-profile-copy';
import { getDirection, type AppLocale } from '@/lib/i18n';
import { getMaxPurchaseQuantity } from '@/lib/store-cart';
import { ProductThumbnail } from './product-card-primitives';
import { getProfileThemeClass } from './profile-themes';
import { storeCartBarGlassClass, storeCartPanelGlassClass } from './store-cart-glass';
import { useStoreCart } from './store-cart-context';
import type { PublicProfileProduct, PublicProfileProductVariant } from './types';
import { cn } from './utils';

const EASE_OUT = [0.32, 0.72, 0, 1] as const;
const SOFT_SPRING = { type: 'spring' as const, damping: 28, stiffness: 240, mass: 0.92 };
const LIGHT_TWEEN = { duration: 0.32, ease: EASE_OUT };

function findProduct(
  products: PublicProfileProduct[],
  productId: string,
): PublicProfileProduct | null {
  return products.find((product) => product.id === productId) ?? null;
}

function findVariant(
  product: PublicProfileProduct,
  variantId?: string,
): PublicProfileProductVariant | null {
  if (!variantId) return null;
  return product.variants?.find((variant) => variant.id === variantId) ?? null;
}

function CartPrice({
  amount,
  currencyShort,
  size = 'sm',
  className,
}: {
  amount: number;
  currencyShort: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      dir="ltr"
      className={cn('inline-flex items-baseline gap-0.5 whitespace-nowrap', className)}
    >
      <span
        className={cn(
          'font-semibold tabular-nums text-[var(--foreground)]',
          size === 'md' ? 'text-[16px]' : 'text-[12px]',
        )}
      >
        {formatProfilePriceAmount(amount)}
      </span>
      <span
        className={cn(
          'font-medium text-[var(--muted-foreground)]',
          size === 'md' ? 'text-[11px]' : 'text-[10px]',
        )}
      >
        {currencyShort}
      </span>
    </span>
  );
}

function splitCartItemName(name: string): { title: string; variant?: string } {
  const separator = ' — ';
  const index = name.indexOf(separator);
  if (index === -1) return { title: name };
  return {
    title: name.slice(0, index),
    variant: name.slice(index + separator.length),
  };
}

function CartQuantityStepper({
  value,
  max,
  onChange,
  onRemoveAtMin,
  decreaseLabel,
  increaseLabel,
  removeLabel,
  compact = false,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
  onRemoveAtMin?: () => void;
  decreaseLabel: string;
  increaseLabel: string;
  removeLabel?: string;
  compact?: boolean;
}) {
  const canDecrease = value > 1 || Boolean(onRemoveAtMin);
  const canIncrease = value < max;
  const buttonSize = compact ? 'size-7' : 'size-8';
  const iconSize = compact ? 'size-3' : 'size-3.5';

  return (
    <div
      dir="ltr"
      className={cn(
        'inline-flex items-center rounded-full bg-[var(--surface-secondary)] p-0.5',
        compact ? 'h-8' : 'h-9',
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
          'inline-flex items-center justify-center rounded-full transition-colors',
          buttonSize,
          canDecrease
            ? 'text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
            : 'cursor-not-allowed text-[var(--muted-foreground)]/40',
        )}
      >
        <Minus className={iconSize} strokeWidth={2.2} aria-hidden />
      </button>
      <span
        dir="ltr"
        className={cn(
          'min-w-[1.25rem] px-1 text-center font-semibold tabular-nums text-[var(--foreground)]',
          compact ? 'text-[12px]' : 'text-[13px]',
        )}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={!canIncrease}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-colors',
          buttonSize,
          canIncrease
            ? 'text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
            : 'cursor-not-allowed text-[var(--muted-foreground)]/40',
        )}
      >
        <Plus className={iconSize} strokeWidth={2.2} aria-hidden />
      </button>
    </div>
  );
}

interface StoreCartFloatingProps {
  storeSlug: string;
  products: PublicProfileProduct[];
  themeKey?: string | null;
}

export function StoreCartFloating({ storeSlug, products, themeKey }: StoreCartFloatingProps) {
  const t = useTranslations('publicProfile');
  const locale = useLocale() as AppLocale;
  const direction = getDirection(locale);
  const reduceMotion = useReducedMotion();
  const {
    items,
    itemCount,
    subtotal,
    isCartOpen,
    isProductDialogOpen,
    disabled,
    openCart,
    closeCart,
    updateQuantity,
    removeItem,
  } = useStoreCart();

  const themeClass = getProfileThemeClass(themeKey);
  const currencyShort = t('product.currencyShort');
  const checkoutUrl = useMemo(
    () => (items.length > 0 ? buildStoreCheckoutUrl(storeSlug, items) : '#'),
    [items, storeSlug],
  );

  useEffect(() => {
    if (!isCartOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeCart, isCartOpen]);

  const getItemMaxQuantity = useCallback(
    (productId: string, variantId?: string) => {
      const product = findProduct(products, productId);
      if (!product) return 99;
      const variant = findVariant(product, variantId);
      return getMaxPurchaseQuantity(product, variant);
    },
    [products],
  );

  const backdropTransition = reduceMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT };
  const panelTransition = reduceMotion ? { duration: 0 } : LIGHT_TWEEN;
  const buttonTransition = reduceMotion ? { duration: 0 } : SOFT_SPRING;

  if (disabled || itemCount <= 0 || isProductDialogOpen) return null;

  return (
    <BodyPortal>
    <>
      <AnimatePresence>
        {isCartOpen ? (
          <motion.button
            type="button"
            aria-label={t('cart.close')}
            className="fixed inset-0 z-[144] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            onClick={closeCart}
          />
        ) : null}
      </AnimatePresence>

      <div
        className={cn(
          'profile-store-cart-anchor profile-store-chrome fixed z-[150]',
          themeClass,
          'end-3 sm:end-4',
          'bottom-[max(0.75rem,env(safe-area-inset-bottom))] mb-2',
          'flex w-[min(320px,calc(100%-1.5rem))] flex-col items-stretch',
        )}
        dir="ltr"
      >
        <AnimatePresence mode="popLayout">
          {isCartOpen ? (
            <motion.div
              dir={direction}
              lang={locale}
              role="dialog"
              aria-modal="true"
              aria-labelledby="store-cart-title"
              layout
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.995 }}
              transition={panelTransition}
              style={{ transformOrigin: 'bottom center' }}
              className={cn(
                storeCartPanelGlassClass,
                'pointer-events-auto mb-2 flex max-h-[min(62dvh,540px)] flex-col overflow-hidden',
              )}
            >
              <div className="flex justify-center pt-2.5">
                <span className="h-1 w-9 rounded-full bg-[var(--border)]" aria-hidden />
              </div>

              <div className="flex items-center gap-3 px-4 pb-3 pt-1">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--foreground)]"
                  aria-hidden
                >
                  <ShoppingBag className="size-4" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2
                    id="store-cart-title"
                    className="text-[15px] font-bold leading-tight text-[var(--foreground)]"
                  >
                    {t('cart.title')}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                    {t('cart.itemCount', { count: itemCount })}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={t('cart.close')}
                  onClick={closeCart}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                >
                  <X className="size-4" strokeWidth={2} aria-hidden />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <ul className="space-y-1">
                  {items.map((item, index) => {
                    const maxQuantity = getItemMaxQuantity(item.productId, item.variantId);
                    const lineTotal = item.price * item.quantity;
                    const { title, variant } = splitCartItemName(item.name);

                    return (
                      <motion.li
                        key={`${item.productId}:${item.variantId ?? 'base'}`}
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.28,
                          ease: EASE_OUT,
                          delay: reduceMotion ? 0 : index * 0.03,
                        }}
                        className="flex gap-3 px-2 py-3"
                      >
                        <ProductThumbnail
                          imageUrl={item.imageUrl ?? null}
                          alt=""
                          className="size-[4.25rem] shrink-0 rounded-xl"
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p
                                dir="auto"
                                className="line-clamp-2 text-[13px] font-semibold leading-snug text-[var(--foreground)]"
                              >
                                {title}
                              </p>
                              {variant ? (
                                <p
                                  dir="auto"
                                  className="mt-0.5 line-clamp-1 text-[11px] text-[var(--muted-foreground)]"
                                >
                                  {variant}
                                </p>
                              ) : null}
                            </div>
                            <CartPrice
                              amount={lineTotal}
                              currencyShort={currencyShort}
                              className="shrink-0 pt-0.5"
                            />
                          </div>

                          {item.quantity > 1 ? (
                            <p className="text-[10px] text-[var(--muted-foreground)]">
                              <CartPrice amount={item.price} currencyShort={currencyShort} />
                              <span className="mx-1">×</span>
                              <span dir="ltr" className="tabular-nums">{item.quantity}</span>
                            </p>
                          ) : null}

                          <div className="flex items-center justify-between gap-2">
                            <CartQuantityStepper
                              compact
                              value={item.quantity}
                              max={maxQuantity}
                              onChange={(next) =>
                                updateQuantity(item.productId, item.variantId, next)
                              }
                              onRemoveAtMin={() => removeItem(item.productId, item.variantId)}
                              decreaseLabel={t('product.dialog.decreaseQuantity')}
                              increaseLabel={t('product.dialog.increaseQuantity')}
                              removeLabel={t('cart.removeItem')}
                            />
                            <button
                              type="button"
                              aria-label={t('cart.removeItem')}
                              onClick={() => removeItem(item.productId, item.variantId)}
                              className="inline-flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--danger)]"
                            >
                              <Trash2 className="size-3.5" strokeWidth={2} aria-hidden />
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>

              <div className="p-3 pt-1">
                <div className="rounded-2xl bg-[var(--surface-secondary)]/75 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[12px] font-medium text-[var(--muted-foreground)]">
                      {t('cart.subtotal')}
                    </span>
                    <CartPrice amount={subtotal} currencyShort={currencyShort} size="md" />
                  </div>
                  <a
                    href={checkoutUrl}
                    aria-label={t('cart.checkoutAria', { count: itemCount })}
                    className={cn(
                      'inline-flex h-12 w-full items-center justify-center rounded-full',
                      'bg-[var(--foreground)] text-[14px] font-semibold text-[var(--background)] no-underline',
                      'transition-opacity hover:opacity-90 active:scale-[0.99]',
                    )}
                  >
                    {t('cart.checkout')}
                  </a>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          dir="ltr"
          onClick={() => (isCartOpen ? closeCart() : openCart())}
          aria-label={t('cart.openAria', { count: itemCount })}
          aria-expanded={isCartOpen}
          whileTap={reduceMotion ? undefined : { scale: 0.99 }}
          transition={buttonTransition}
          className={cn(
            storeCartBarGlassClass,
            'pointer-events-auto flex h-16 w-full touch-manipulation items-center justify-between gap-2 py-2 ps-2 pe-4',
          )}
        >
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/95 text-[14px] font-semibold tabular-nums text-[#161823]"
            aria-hidden
          >
            {itemCount}
          </span>

          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1">
            <span className="text-[10px] font-medium leading-none text-white/65">
              {t('product.dialog.cartTotal')}
            </span>
            <span
              dir="ltr"
              className="inline-flex max-w-full items-baseline justify-center gap-1 whitespace-nowrap"
            >
              <span className="text-[16px] font-bold leading-none tabular-nums tracking-tight text-white">
                {formatProfilePriceAmount(subtotal)}
              </span>
              <span className="text-[11px] font-semibold leading-none text-white/70">
                {currencyShort}
              </span>
            </span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isCartOpen ? 'close' : 'open'}
              initial={reduceMotion ? false : { opacity: 0, y: 3 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: EASE_OUT }}
              className="shrink-0 text-[12px] font-semibold text-white/90"
            >
              {isCartOpen ? t('cart.close') : t('cart.open')}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </>
    </BodyPortal>
  );
}

/** @deprecated Use StoreCartFloating */
export const StoreCartSheet = StoreCartFloating;

/** @deprecated Merged into StoreCartFloating */
export function StoreCartBarButton() {
  return null;
}
