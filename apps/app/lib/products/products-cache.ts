import type { StoreProduct } from '@/lib/products/types';

const STORE_PRODUCTS_CACHE_KEY = 'rukny:store-products:v2';

export function readCachedStoreProducts(): StoreProduct[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = sessionStorage.getItem(STORE_PRODUCTS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoreProduct[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCachedStoreProducts(products: StoreProduct[]): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(STORE_PRODUCTS_CACHE_KEY, JSON.stringify(products));
  } catch {
    // Ignore quota errors.
  }
}
