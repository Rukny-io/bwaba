import type { MyStoreProduct } from '@/lib/collections/types';
import { resolveMediaUrl } from '@/lib/media-url';

export function getProductImage(product: MyStoreProduct): string | null {
  const images = product.product_images ?? [];
  const primary = images.find((img) => img.isPrimary) ?? images[0];
  return resolveMediaUrl(primary?.imagePath);
}

export function formatProductPrice(price: number | string): string {
  const value = typeof price === 'string' ? Number(price) : price;
  if (!Number.isFinite(value)) return '—';
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)} د.ع`;
}
