import type { ProductKind, StoreProduct } from '@/lib/products/types';
import { getProductKindLabel } from '@/lib/products/api';

export interface ProductCategoryRef {
  id: string;
  name: string;
  nameAr?: string | null;
}

export type ProductStockVariant = 'muted' | 'default' | 'low' | 'unlimited';

export interface ProductStockDisplay {
  label: string;
  variant: ProductStockVariant;
}

export function resolveProductKind(product: StoreProduct): ProductKind {
  return product.productKind ?? (product.isDigital ? 'DIGITAL' : 'PHYSICAL');
}

export function getProductCategoryLabel(product: StoreProduct): string | null {
  const category = product.product_categories;
  if (!category) return null;
  return category.nameAr?.trim() || category.name;
}

export function getProductStockDisplay(product: StoreProduct): ProductStockDisplay {
  const kind = resolveProductKind(product);

  if (kind === 'DIGITAL') {
    return { label: '—', variant: 'muted' };
  }

  if (kind === 'SERVICE') {
    return { label: '—', variant: 'muted' };
  }

  if (product.hasVariants) {
    return { label: 'متغيرات', variant: 'default' };
  }

  if (product.trackInventory === false) {
    return { label: 'غير محدود', variant: 'unlimited' };
  }

  const quantity = product.quantity ?? 0;

  if (quantity <= 0) {
    return { label: 'نفد المخزون', variant: 'low' };
  }

  if (quantity <= 10) {
    return { label: `${quantity} متبقي`, variant: 'low' };
  }

  return { label: 'غير محدود', variant: 'unlimited' };
}

export function getProductKindBadgeClass(kind: ProductKind): string {
  const classes: Record<ProductKind, string> = {
    PHYSICAL:
      'border-[color-mix(in_srgb,var(--success)_28%,var(--border))] bg-[color-mix(in_srgb,var(--success)_12%,var(--surface))] text-[color-mix(in_srgb,var(--success)_78%,var(--foreground))]',
    DIGITAL:
      'border-[color-mix(in_srgb,var(--primary)_28%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface))] text-[color-mix(in_srgb,var(--primary)_82%,var(--foreground))]',
    SERVICE:
      'border-[color-mix(in_srgb,var(--warning)_30%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_12%,var(--surface))] text-[color-mix(in_srgb,var(--warning)_78%,var(--foreground))]',
  };
  return classes[kind];
}

export function getProductKindLabelFor(product: StoreProduct): string {
  return getProductKindLabel(resolveProductKind(product));
}

export type ProductStatusVariant = 'success' | 'warning' | 'danger' | 'default';

export interface ProductStatusDisplay {
  label: string;
  color: ProductStatusVariant;
}

export function getProductStatusDisplay(product: StoreProduct): ProductStatusDisplay {
  switch (product.status) {
    case 'ACTIVE':
      return { label: 'نشط', color: 'success' };
    case 'INACTIVE':
      return { label: 'مخفي', color: 'default' };
    case 'OUT_OF_STOCK':
      return { label: 'نفد المخزون', color: 'danger' };
    case 'DISCONTINUED':
      return { label: 'متوقف', color: 'warning' };
    default:
      return { label: product.status, color: 'default' };
  }
}

export function getStockChipColor(
  variant: ProductStockVariant,
): ProductStatusVariant {
  if (variant === 'low') return 'danger';
  if (variant === 'unlimited') return 'success';
  return 'default';
}
