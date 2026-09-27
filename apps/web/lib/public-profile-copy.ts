import type { useTranslations } from 'next-intl';
import type { PublicProfileProduct, PublicProfileProductAttribute } from '@/components/public-profile/types';
import type { ProductStockDisplay } from '@/components/public-profile/product-card-primitives';

type ProfileTranslator = ReturnType<typeof useTranslations<'publicProfile'>>;

export function formatProfileProductPrice(
  price: number | string,
  currencyShort: string,
): string {
  const value = typeof price === 'string' ? Number(price) : price;
  if (!Number.isFinite(value)) return '—';
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  return `${formatted} ${currencyShort}`;
}

export function formatProfileDialogPriceIqd(amount: number, currencyCode: string): string {
  if (!Number.isFinite(amount)) return '—';
  return `${currencyCode} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)}`;
}

export function getPublicProductStockDisplayLocalized(
  product: PublicProfileProduct,
  t: ProfileTranslator,
): ProductStockDisplay {
  if (product.isDigital) {
    return { label: '—', variant: 'muted' };
  }

  const quantity = product.stock ?? 0;

  if (quantity <= 0) {
    return { label: t('product.stock.outOfStock'), variant: 'low' };
  }

  if (quantity <= 10) {
    return {
      label: t('product.stock.remaining', { count: quantity }),
      variant: 'low',
    };
  }

  return { label: t('product.stock.inStock'), variant: 'default' };
}

export function getProductKindLabelLocalized(
  product: PublicProfileProduct,
  t: ProfileTranslator,
): string {
  return product.isDigital ? t('product.kind.digital') : t('product.kind.physical');
}

export function getProductAttributeRowsLocalized(
  attributes: PublicProfileProductAttribute[] | undefined,
  t: ProfileTranslator,
): Array<{ label: string; value: string }> {
  return (attributes ?? [])
    .map((attr) => {
      const value = attr.value?.trim();
      if (!value) return null;
      const labelKey = `product.attributes.${attr.key}` as Parameters<ProfileTranslator>[0];
      const label = t.has(labelKey) ? t(labelKey) : attr.key;
      return { label, value };
    })
    .filter((row): row is { label: string; value: string } => row != null);
}

export function getVariantAttributeLabelLocalized(key: string, t: ProfileTranslator): string {
  const labelKey = `product.variants.${key.toLowerCase()}` as Parameters<ProfileTranslator>[0];
  return t.has(labelKey) ? t(labelKey) : key;
}

export function getVariantLabelLocalized(
  variant: { sku?: string | null; attributes?: unknown },
  t: ProfileTranslator,
): string {
  if (variant.attributes && typeof variant.attributes === 'object') {
    const values = Object.values(variant.attributes as Record<string, unknown>)
      .map((value) => String(value).trim())
      .filter(Boolean);
    if (values.length > 0) return values.join(' · ');
  }
  return variant.sku?.trim() || t('product.variants.fallback');
}
