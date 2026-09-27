import type { MyStoreProduct } from '@/lib/collections/types';
import { resolveMediaUrl } from '@/lib/media-url';

function withImageVersion(
  url: string | null,
  createdAt?: string | null,
): string | null {
  if (!url) return null;
  if (!createdAt) return url;

  const version = new Date(createdAt).getTime();
  if (!Number.isFinite(version)) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${version}`;
}

export function getProductImageUrl(
  image?: { imagePath: string; createdAt?: string | null } | null,
): string | null {
  return withImageVersion(resolveMediaUrl(image?.imagePath), image?.createdAt);
}

export function getProductImage(product: MyStoreProduct): string | null {
  const images = product.product_images ?? [];
  const primary = images.find((img) => img.isPrimary) ?? images[0];
  return getProductImageUrl(primary);
}

export function formatProductPrice(price: number | string): string {
  const value = typeof price === 'string' ? Number(price) : price;
  if (!Number.isFinite(value)) return '—';
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)} د.ع`;
}
