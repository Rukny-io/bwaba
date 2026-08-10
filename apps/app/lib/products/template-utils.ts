import type { ProductKind } from '@/lib/products/types';
import { getCategoryKindRules } from '@/lib/products/category-template-config';
import type {
  CategoryTemplateFields,
  ProductVariantDraft,
  TemplateField,
  TemplateFieldValue,
} from '@/lib/products/template-types';

function fieldAppliesToKind(field: TemplateField, kind: ProductKind): boolean {
  if (!field.kinds?.length) return true;
  return field.kinds.includes(kind);
}

/**
 * يُرجع نسخة من القالب مُصفّاة حسب نوع المنتج (مادي / رقمي / خدمة).
 */
export function resolveTemplateForKind(
  template: CategoryTemplateFields | null,
  kind: ProductKind,
  categorySlug?: string | null,
): CategoryTemplateFields | null {
  if (!template) return null;

  const rules =
    template.kindRules?.[kind] ?? getCategoryKindRules(categorySlug, kind);
  const allowedKeys = rules?.attributeKeys?.length
    ? new Set(rules.attributeKeys)
    : null;

  const productAttributes = template.productAttributes.filter((field) => {
    if (!fieldAppliesToKind(field, kind)) return false;
    if (allowedKeys && !allowedKeys.has(field.key)) return false;
    return true;
  });

  const hasVariants =
    rules?.enableVariants ?? (kind === 'PHYSICAL' && template.hasVariants);

  return {
    ...template,
    hasVariants,
    productAttributes,
    variantAttributes: hasVariants ? template.variantAttributes : undefined,
  };
}

export function createEmptyTemplateValues(
  template: CategoryTemplateFields | null,
): Record<string, TemplateFieldValue> {
  if (!template) return {};

  const values: Record<string, TemplateFieldValue> = {};
  for (const field of template.productAttributes) {
    if (field.type === 'multiselect') {
      values[field.key] = [];
    } else if (field.type === 'boolean') {
      values[field.key] = false;
    } else {
      values[field.key] = '';
    }
  }
  return values;
}

function serializeTemplateValue(
  field: TemplateField,
  value: TemplateFieldValue,
): string | null {
  if (field.type === 'multiselect') {
    const list = Array.isArray(value) ? value : [];
    const trimmed = list.map((item) => item.trim()).filter(Boolean);
    if (!trimmed.length) return null;
    return trimmed.join(', ');
  }

  if (field.type === 'boolean') {
    if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
    const normalized = String(value).toLowerCase();
    if (['true', '1', 'نعم', 'yes'].includes(normalized)) return 'نعم';
    if (['false', '0', 'لا', 'no'].includes(normalized)) return 'لا';
    return null;
  }

  const text = typeof value === 'string' ? value.trim() : '';
  return text || null;
}

export function validateTemplateValues(
  template: CategoryTemplateFields | null,
  values: Record<string, TemplateFieldValue>,
): string | null {
  if (!template) return null;

  for (const field of template.productAttributes) {
    const serialized = serializeTemplateValue(field, values[field.key] ?? '');
    if (field.required && !serialized) {
      return `أكمل الحقل: ${field.labelAr}`;
    }
  }

  return null;
}

export function buildProductAttributesPayload(
  template: CategoryTemplateFields | null,
  values: Record<string, TemplateFieldValue>,
): Array<{ key: string; value: string; valueAr?: string }> | undefined {
  if (!template) return undefined;

  const attrs: Array<{ key: string; value: string; valueAr?: string }> = [];

  for (const field of template.productAttributes) {
    const serialized = serializeTemplateValue(field, values[field.key] ?? '');
    if (!serialized) continue;
    attrs.push({
      key: field.key,
      value: serialized,
      valueAr: serialized,
    });
  }

  return attrs.length ? attrs : undefined;
}

export function validateVariantDrafts(
  template: CategoryTemplateFields | null,
  variants: ProductVariantDraft[],
): string | null {
  if (!template?.hasVariants || !variants.length) return null;

  const variantKeys = template.variantAttributes?.map((attr) => attr.key) ?? [];

  for (const variant of variants) {
    for (const key of variantKeys) {
      if (!variant.attributes[key]?.trim()) {
        const label =
          template.variantAttributes?.find((attr) => attr.key === key)?.labelAr ??
          key;
        return `اختر ${label} لكل المتغيرات`;
      }
    }
    if (!Number.isFinite(variant.stock) || variant.stock < 0) {
      return 'أدخل كمية مخزون صالحة لكل متغير';
    }
  }

  return null;
}

export function buildVariantsPayload(
  variants: ProductVariantDraft[],
  basePrice: number,
): Array<{
  price: number;
  stock: number;
  attributes: Record<string, string>;
  isActive: boolean;
}> {
  return variants.map((variant) => ({
    price: basePrice,
    stock: variant.stock,
    attributes: variant.attributes,
    isActive: true,
  }));
}
