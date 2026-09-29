'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  addToCartItem,
  buildCartItemFromProduct,
  getCartItemCount,
  getCartItemKey,
  getCartSubtotal,
  getMaxPurchaseQuantity,
  getStoreCart,
  removeCartItem,
  replaceStoreCart,
  updateCartItemQuantity,
  type StoreCartItem,
  type StoreCartState,
} from '@/lib/store-cart';
import type {
  PublicProfileProduct,
  PublicProfileProductVariant,
} from './types';

type StoreCartContextValue = {
  items: StoreCartItem[];
  itemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  isProductDialogOpen: boolean;
  disabled: boolean;
  openCart: () => void;
  closeCart: () => void;
  setProductDialogOpen: (open: boolean) => void;
  addItem: (
    product: PublicProfileProduct,
    variant: PublicProfileProductVariant | null,
    quantity: number,
    imageUrl?: string | null,
  ) => void;
  updateQuantity: (
    productId: string,
    variantId: string | null | undefined,
    quantity: number,
  ) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  clearCart: () => void;
  isInCart: (productId: string, variantId?: string | null) => boolean;
  getItemQuantity: (productId: string, variantId?: string | null) => number;
  getMaxQuantity: (
    product: PublicProfileProduct,
    variant: PublicProfileProductVariant | null,
  ) => number;
};

const StoreCartContext = createContext<StoreCartContextValue | null>(null);

interface StoreCartProviderProps {
  storeSlug: string;
  storeName?: string | null;
  products: PublicProfileProduct[];
  preview?: boolean;
  children: ReactNode;
}

function findProduct(
  products: PublicProfileProduct[],
  productId: string,
): PublicProfileProduct | null {
  return products.find((product) => product.id === productId) ?? null;
}

function findVariant(
  product: PublicProfileProduct,
  variantId?: string | null,
): PublicProfileProductVariant | null {
  if (!variantId) return null;
  return product.variants?.find((variant) => variant.id === variantId) ?? null;
}

export function StoreCartProvider({
  storeSlug,
  storeName,
  products,
  preview = false,
  children,
}: StoreCartProviderProps) {
  const [cart, setCart] = useState<StoreCartState | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const syncCart = useCallback(() => {
    const stored = getStoreCart(storeSlug);
    if (stored && stored.storeSlug !== storeSlug) {
      const empty = replaceStoreCart(storeSlug, storeName);
      setCart(empty);
      return;
    }
    setCart(stored ?? null);
  }, [storeName, storeSlug]);

  useEffect(() => {
    syncCart();
    setHydrated(true);
  }, [syncCart]);

  useEffect(() => {
    if (!hydrated) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'rukny.store.cart') return;
      syncCart();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [hydrated, syncCart]);

  const getMaxQuantity = useCallback(
    (product: PublicProfileProduct, variant: PublicProfileProductVariant | null) =>
      getMaxPurchaseQuantity(product, variant),
    [],
  );

  const addItem = useCallback(
    (
      product: PublicProfileProduct,
      variant: PublicProfileProductVariant | null,
      quantity: number,
      imageUrl?: string | null,
    ) => {
      if (preview) return;
      const maxQuantity = getMaxPurchaseQuantity(product, variant);
      if (maxQuantity <= 0) return;
      const item = buildCartItemFromProduct(product, variant, quantity, imageUrl);
      const nextCart = addToCartItem(storeSlug, storeName, item, maxQuantity);
      setCart(nextCart);
    },
    [preview, storeName, storeSlug],
  );

  const updateQuantity = useCallback(
    (productId: string, variantId: string | null | undefined, quantity: number) => {
      if (preview) return;
      const product = findProduct(products, productId);
      if (!product) return;
      const variant = findVariant(product, variantId);
      const maxQuantity = getMaxPurchaseQuantity(product, variant);
      const nextCart = updateCartItemQuantity(
        storeSlug,
        productId,
        variantId,
        quantity,
        maxQuantity,
      );
      setCart(nextCart);
    },
    [preview, products, storeSlug],
  );

  const removeItem = useCallback(
    (productId: string, variantId?: string | null) => {
      if (preview) return;
      const nextCart = removeCartItem(storeSlug, productId, variantId);
      setCart(nextCart);
    },
    [preview, storeSlug],
  );

  const clearCart = useCallback(() => {
    if (preview) return;
    const nextCart = replaceStoreCart(storeSlug, storeName);
    setCart(nextCart);
  }, [preview, storeName, storeSlug]);

  const isInCart = useCallback(
    (productId: string, variantId?: string | null) => {
      if (!cart?.items.length) return false;
      const key = getCartItemKey(productId, variantId);
      return cart.items.some(
        (item) => getCartItemKey(item.productId, item.variantId) === key,
      );
    },
    [cart],
  );

  const getItemQuantity = useCallback(
    (productId: string, variantId?: string | null) => {
      if (!cart?.items.length) return 0;
      const key = getCartItemKey(productId, variantId);
      const item = cart.items.find(
        (entry) => getCartItemKey(entry.productId, entry.variantId) === key,
      );
      return item?.quantity ?? 0;
    },
    [cart],
  );

  const value = useMemo<StoreCartContextValue>(
    () => ({
      items: cart?.items ?? [],
      itemCount: getCartItemCount(cart),
      subtotal: getCartSubtotal(cart),
      isCartOpen,
      isProductDialogOpen,
      disabled: preview,
      openCart: () => {
        if (preview) return;
        setIsCartOpen(true);
      },
      closeCart: () => setIsCartOpen(false),
      setProductDialogOpen: setIsProductDialogOpen,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      isInCart,
      getItemQuantity,
      getMaxQuantity,
    }),
    [
      addItem,
      cart,
      clearCart,
      getItemQuantity,
      getMaxQuantity,
      isCartOpen,
      isProductDialogOpen,
      isInCart,
      preview,
      removeItem,
      updateQuantity,
    ],
  );

  return <StoreCartContext.Provider value={value}>{children}</StoreCartContext.Provider>;
}

export function useStoreCart(): StoreCartContextValue {
  const context = useContext(StoreCartContext);
  if (!context) {
    throw new Error('useStoreCart must be used within StoreCartProvider');
  }
  return context;
}
