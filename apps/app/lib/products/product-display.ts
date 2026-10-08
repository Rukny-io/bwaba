import type { ProductKind, StoreProduct } from '@/lib/products/types';
import {
  DELIVERY_METHOD_OPTIONS,
  SERVICE_TYPE_OPTIONS,
} from '@/lib/products/types';
import { formatDate, formatNumber } from '@/lib/dashboard-format';

export type ProductTranslate = (
  path: string,
  vars?: Record<string, string | number>,
) => string;

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

export function getProductStockDisplay(
  product: StoreProduct,
  t: ProductTranslate,
): ProductStockDisplay {
  const kind = resolveProductKind(product);

  if (kind === 'DIGITAL') {
    return { label: '—', variant: 'muted' };
  }

  if (kind === 'SERVICE') {
    return { label: '—', variant: 'muted' };
  }

  if (product.hasVariants) {
    return { label: t('products.stockLabel.variants'), variant: 'default' };
  }

  if (product.trackInventory === false) {
    return { label: t('products.stockLabel.unlimited'), variant: 'unlimited' };
  }

  const quantity = product.quantity ?? 0;

  if (quantity <= 0) {
    return { label: t('products.stockLabel.outOfStock'), variant: 'low' };
  }

  if (quantity <= 10) {
    return {
      label: t('products.stockLabel.remaining', { n: formatNumber(quantity) }),
      variant: 'low',
    };
  }

  return { label: t('products.stockLabel.unlimited'), variant: 'unlimited' };
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

export function getProductKindLabelFor(
  product: StoreProduct,
  t: ProductTranslate,
): string {
  return t(`products.kind.${resolveProductKind(product)}`);
}

export type ProductStatusVariant = 'success' | 'warning' | 'danger' | 'default';

export interface ProductStatusDisplay {
  label: string;
  color: ProductStatusVariant;
}

export function getProductStatusDisplay(
  product: StoreProduct,
  t: ProductTranslate,
): ProductStatusDisplay {
  switch (product.status) {
    case 'ACTIVE':
      return { label: t('products.status.ACTIVE'), color: 'success' };
    case 'INACTIVE':
      return { label: t('products.status.INACTIVE'), color: 'default' };
    case 'OUT_OF_STOCK':
      return { label: t('products.status.OUT_OF_STOCK'), color: 'danger' };
    case 'DISCONTINUED':
      return { label: t('products.status.DISCONTINUED'), color: 'warning' };
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

export function getProductDescription(product: StoreProduct): string | null {
  return product.descriptionAr?.trim() || product.description?.trim() || null;
}

export function formatProductDate(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return formatDate(date);
}

const ATTRIBUTE_KEYS = [
  'serviceType',
  'duration',
  'deliveryMethod',
  'brand',
  'condition',
  'warranty',
  'model',
  'material',
  'gender',
  'season',
  'ingredients',
  'weight',
  'calories',
  'allergens',
] as const;

function optionLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function getProductAttributeRows(
  product: StoreProduct,
  t: ProductTranslate,
): Array<{ label: string; value: string }> {
  return (product.productAttributes ?? [])
    .map((attr) => {
      const raw = attr.valueAr?.trim() || attr.value.trim();
      if (!raw) return null;

      let value = raw;
      if (attr.key === 'serviceType') {
        value = optionLabel(SERVICE_TYPE_OPTIONS, raw);
      } else if (attr.key === 'deliveryMethod') {
        value = optionLabel(DELIVERY_METHOD_OPTIONS, raw);
      }

      const known = ATTRIBUTE_KEYS.includes(
        attr.key as (typeof ATTRIBUTE_KEYS)[number],
      );

      return {
        label: known ? t(`products.attr.${attr.key}`) : attr.key,
        value,
      };
    })
    .filter((row): row is { label: string; value: string } => row != null);
}

export function formatVariantAttributes(attributes?: unknown): string {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
    return '';
  }
  return Object.values(attributes as Record<string, unknown>)
    .map((value) => String(value).trim())
    .filter(Boolean)
    .join(' · ');
}
