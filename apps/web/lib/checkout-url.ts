import type {
  PublicProfileProduct,
  PublicProfileProductVariant,
} from '@/components/public-profile/types';
import type { StoreCartItem } from '@/lib/store-cart';

const CHECKOUT_URL = (
  process.env.NEXT_PUBLIC_CHECKOUT_URL || 'https://checkout.rukny.io'
).replace(/\/$/, '');

function variantLabel(variant: PublicProfileProductVariant): string {
  if (variant.attributes && typeof variant.attributes === 'object') {
    const values = Object.values(variant.attributes as Record<string, unknown>)
      .map((value) => String(value).trim())
      .filter(Boolean);
    if (values.length > 0) return values.join(' · ');
  }
  return variant.sku?.trim() || 'متغير';
}

export function buildStoreCheckoutUrl(storeSlug: string, items: StoreCartItem[]): string {
  const payload = items.map((item) => ({
    productId: item.productId,
    ...(item.variantId ? { variantId: item.variantId } : {}),
    quantity: Math.max(1, Math.min(99, Math.floor(item.quantity))),
    name: item.name,
    price: item.price,
  }));

  const params = new URLSearchParams({
    store: storeSlug,
    items: JSON.stringify(payload),
  });

  return `${CHECKOUT_URL}/?${params.toString()}`;
}

export function buildProductCheckoutUrl(
  storeSlug: string,
  product: PublicProfileProduct,
  variant?: PublicProfileProductVariant | null,
  quantity = 1,
): string {
  const price = variant
    ? Number(variant.price)
    : product.salePrice ?? product.price;
  const name = variant ? `${product.name} — ${variantLabel(variant)}` : product.name;
  const safeQuantity = Math.max(1, Math.min(99, Math.floor(quantity)));

  return buildStoreCheckoutUrl(storeSlug, [
    {
      productId: product.id,
      ...(variant ? { variantId: variant.id } : {}),
      quantity: safeQuantity,
      name,
      price,
    },
  ]);
}
