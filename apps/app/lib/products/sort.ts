import type { ProductsSortOption } from '@/components/products/products-view-mode';
import { getProductDisplayName } from '@/lib/products/api';
import { resolveProductKind } from '@/lib/products/product-display';
import type { StoreProduct } from '@/lib/products/types';

function parseProductPrice(
  price: StoreProduct['price'] | StoreProduct['salePrice'] | null | undefined,
): number {
  if (price == null) return 0;

  if (typeof price === 'number') {
    return Number.isFinite(price) ? price : 0;
  }

  if (typeof price === 'string') {
    const normalized = price.replace(/,/g, '').trim();
    const value = Number(normalized);
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof price === 'object') {
    const decimalLike = price as {
      toString?: () => string;
      toNumber?: () => number;
    };

    if (typeof decimalLike.toNumber === 'function') {
      const value = decimalLike.toNumber();
      if (Number.isFinite(value)) return value;
    }

    if (typeof decimalLike.toString === 'function') {
      const value = Number(decimalLike.toString().replace(/,/g, ''));
      if (Number.isFinite(value)) return value;
    }
  }

  return 0;
}

export function getProductSortPrice(product: StoreProduct): number {
  const base = parseProductPrice(product.price);
  const sale = parseProductPrice(product.salePrice);

  if (sale > 0 && sale < base) {
    return sale;
  }

  return base;
}

function getProductTimestamp(product: StoreProduct): number {
  const record = product as StoreProduct & {
    created_at?: string;
    updated_at?: string;
  };
  const raw =
    product.createdAt ??
    product.updatedAt ??
    record.created_at ??
    record.updated_at;

  if (!raw) return 0;

  const time = Date.parse(String(raw));
  return Number.isFinite(time) ? time : 0;
}

function compareByName(a: StoreProduct, b: StoreProduct): number {
  return getProductDisplayName(a).localeCompare(getProductDisplayName(b), 'ar', {
    sensitivity: 'base',
    numeric: true,
  });
}

function compareByPrice(
  a: StoreProduct,
  b: StoreProduct,
  direction: 'asc' | 'desc',
): number {
  const byPrice =
    direction === 'asc'
      ? getProductSortPrice(a) - getProductSortPrice(b)
      : getProductSortPrice(b) - getProductSortPrice(a);

  return byPrice !== 0 ? byPrice : compareByName(a, b);
}

function getProductSortQuantity(product: StoreProduct): number | null {
  const kind = resolveProductKind(product);

  if (kind === 'DIGITAL' || kind === 'SERVICE') {
    return null;
  }

  if (product.hasVariants) {
    return null;
  }

  if (product.trackInventory === false) {
    return null;
  }

  const quantity = product.quantity ?? 0;
  return Number.isFinite(quantity) ? quantity : 0;
}

function compareByStock(
  a: StoreProduct,
  b: StoreProduct,
  direction: 'asc' | 'desc',
): number {
  const aQuantity = getProductSortQuantity(a);
  const bQuantity = getProductSortQuantity(b);

  if (aQuantity == null && bQuantity == null) {
    return compareByName(a, b);
  }

  if (aQuantity == null) return 1;
  if (bQuantity == null) return -1;

  const byStock =
    direction === 'asc'
      ? aQuantity - bQuantity
      : bQuantity - aQuantity;

  return byStock !== 0 ? byStock : compareByName(a, b);
}

export function sortProducts(
  products: StoreProduct[],
  sortBy: ProductsSortOption,
  sourceProducts: StoreProduct[] = products,
): StoreProduct[] {
  const sourceOrder = new Map(
    sourceProducts.map((product, index) => [product.id, index]),
  );
  const rows = [...products];

  switch (sortBy) {
    case 'name_asc':
      return rows.sort((a, b) => {
        const byName = compareByName(a, b);
        return byName !== 0 ? byName : a.id.localeCompare(b.id);
      });
    case 'price_asc':
      return rows.sort((a, b) => compareByPrice(a, b, 'asc'));
    case 'price_desc':
      return rows.sort((a, b) => compareByPrice(a, b, 'desc'));
    case 'stock_asc':
      return rows.sort((a, b) => compareByStock(a, b, 'asc'));
    case 'stock_desc':
      return rows.sort((a, b) => compareByStock(a, b, 'desc'));
    case 'newest':
    default:
      return rows.sort((a, b) => {
        const byTime = getProductTimestamp(b) - getProductTimestamp(a);
        if (byTime !== 0) return byTime;
        return (sourceOrder.get(a.id) ?? 0) - (sourceOrder.get(b.id) ?? 0);
      });
  }
}
