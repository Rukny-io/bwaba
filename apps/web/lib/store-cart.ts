import type {
  PublicProfileProduct,
  PublicProfileProductVariant,
} from '@/components/public-profile/types';

const CART_STORAGE_KEY = 'rukny.store.cart';

export type StoreCartItem = {
  productId: string;
  variantId?: string;
  quantity: number;
  name: string;
  price: number;
  imageUrl?: string;
};

export type StoreCartState = {
  storeSlug: string;
  storeName?: string;
  items: StoreCartItem[];
  updatedAt: number;
};

export function getCartItemKey(productId: string, variantId?: string | null): string {
  return `${productId}:${variantId ?? 'base'}`;
}

export function getMaxPurchaseQuantity(
  product: PublicProfileProduct,
  variant: PublicProfileProductVariant | null,
): number {
  if (product.isDigital) return 99;
  if (variant) return Math.max(0, variant.stock);
  return Math.max(0, product.stock);
}

function variantLabel(variant: PublicProfileProductVariant): string {
  if (variant.attributes && typeof variant.attributes === 'object') {
    const values = Object.values(variant.attributes as Record<string, unknown>)
      .map((value) => String(value).trim())
      .filter(Boolean);
    if (values.length > 0) return values.join(' · ');
  }
  return variant.sku?.trim() || 'Variant';
}

export function buildCartItemFromProduct(
  product: PublicProfileProduct,
  variant: PublicProfileProductVariant | null,
  quantity: number,
  imageUrl?: string | null,
): StoreCartItem {
  const price = variant ? Number(variant.price) : Number(product.salePrice ?? product.price);
  const name = variant ? `${product.name} — ${variantLabel(variant)}` : product.name;

  return {
    productId: product.id,
    ...(variant ? { variantId: variant.id } : {}),
    quantity: Math.max(1, Math.min(99, Math.floor(quantity))),
    name,
    price,
    ...(imageUrl ? { imageUrl } : {}),
  };
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined';
}

export function getStoreCart(storeSlug: string): StoreCartState | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoreCartState;
    if (!parsed || parsed.storeSlug !== storeSlug || !Array.isArray(parsed.items)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoreCart(cart: StoreCartState): void {
  if (!canUseStorage()) return;
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({
      ...cart,
      updatedAt: Date.now(),
    }),
  );
}

export function clearStoreCart(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(CART_STORAGE_KEY);
}

export function getCartItemCount(cart: StoreCartState | null): number {
  if (!cart?.items?.length) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotal(cart: StoreCartState | null): number {
  if (!cart?.items?.length) return 0;
  return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function addToCartItem(
  storeSlug: string,
  storeName: string | null | undefined,
  item: StoreCartItem,
  maxQuantity: number,
): StoreCartState {
  const existing = getStoreCart(storeSlug);
  const key = getCartItemKey(item.productId, item.variantId);
  const base: StoreCartState = existing ?? {
    storeSlug,
    storeName: storeName ?? undefined,
    items: [],
    updatedAt: Date.now(),
  };

  const nextItems = [...base.items];
  const index = nextItems.findIndex(
    (entry) => getCartItemKey(entry.productId, entry.variantId) === key,
  );

  if (index >= 0) {
    const current = nextItems[index];
    const nextQuantity = Math.min(maxQuantity, current.quantity + item.quantity);
    nextItems[index] = { ...current, quantity: nextQuantity };
  } else {
    nextItems.push({
      ...item,
      quantity: Math.min(maxQuantity, item.quantity),
    });
  }

  const nextCart: StoreCartState = {
    ...base,
    storeSlug,
    storeName: storeName ?? base.storeName,
    items: nextItems,
    updatedAt: Date.now(),
  };

  saveStoreCart(nextCart);
  return nextCart;
}

export function updateCartItemQuantity(
  storeSlug: string,
  productId: string,
  variantId: string | null | undefined,
  quantity: number,
  maxQuantity: number,
): StoreCartState | null {
  const cart = getStoreCart(storeSlug);
  if (!cart) return null;

  const key = getCartItemKey(productId, variantId);
  const safeQuantity = Math.max(0, Math.min(maxQuantity, Math.floor(quantity)));

  const nextItems =
    safeQuantity <= 0
      ? cart.items.filter((item) => getCartItemKey(item.productId, item.variantId) !== key)
      : cart.items.map((item) =>
          getCartItemKey(item.productId, item.variantId) === key
            ? { ...item, quantity: safeQuantity }
            : item,
        );

  const nextCart: StoreCartState = {
    ...cart,
    items: nextItems,
    updatedAt: Date.now(),
  };

  if (nextItems.length === 0) {
    clearStoreCart();
    return { ...nextCart, items: [] };
  }

  saveStoreCart(nextCart);
  return nextCart;
}

export function removeCartItem(
  storeSlug: string,
  productId: string,
  variantId?: string | null,
): StoreCartState | null {
  const cart = getStoreCart(storeSlug);
  if (!cart) return null;

  const key = getCartItemKey(productId, variantId);
  const nextItems = cart.items.filter(
    (item) => getCartItemKey(item.productId, item.variantId) !== key,
  );

  if (nextItems.length === 0) {
    clearStoreCart();
    return { ...cart, items: [] };
  }

  const nextCart: StoreCartState = {
    ...cart,
    items: nextItems,
    updatedAt: Date.now(),
  };

  saveStoreCart(nextCart);
  return nextCart;
}

export function replaceStoreCart(
  storeSlug: string,
  storeName: string | null | undefined,
): StoreCartState {
  const nextCart: StoreCartState = {
    storeSlug,
    storeName: storeName ?? undefined,
    items: [],
    updatedAt: Date.now(),
  };
  saveStoreCart(nextCart);
  return nextCart;
}
