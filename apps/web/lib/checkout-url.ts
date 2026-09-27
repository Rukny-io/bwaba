import type {
  PublicProfileProduct,
  PublicProfileProductVariant,
} from '@/components/public-profile/types';

const CHECKOUT_URL = (
  process.env.NEXT_PUBLIC_CHECKOUT_URL || 'http://localhost:3010'
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

  const items = JSON.stringify([
    {
      productId: product.id,
      ...(variant ? { variantId: variant.id } : {}),
      quantity: safeQuantity,
      name,
      price,
    },
  ]);

  const params = new URLSearchParams({
    store: storeSlug,
    items,
  });

  return `${CHECKOUT_URL}/?${params.toString()}`;
}
