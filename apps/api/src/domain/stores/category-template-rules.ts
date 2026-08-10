import { ProductKind } from './dto/create-product.dto';
import type { CategoryKindRules, CategoryTemplateFields, TemplateField } from './dto/product-attribute.dto';

const FALLBACK_KIND_RULES: Record<
  string,
  Partial<Record<ProductKind, CategoryKindRules>>
> = {
  fashion: {
    PHYSICAL: {
      attributeKeys: ['material', 'gender', 'season', 'brand'],
      enableVariants: true,
    },
    DIGITAL: {
      attributeKeys: ['gender', 'brand', 'season'],
      enableVariants: false,
    },
    SERVICE: {
      attributeKeys: ['brand'],
      enableVariants: false,
    },
  },
};

function getFallbackKindRules(
  categorySlug: string | null | undefined,
  kind: ProductKind,
): CategoryKindRules | undefined {
  if (!categorySlug) return undefined;
  return FALLBACK_KIND_RULES[categorySlug]?.[kind];
}

function fieldAppliesToKind(field: TemplateField, kind: ProductKind): boolean {
  if (!field.kinds?.length) return true;
  return field.kinds.includes(kind);
}

/** يُصفّي قالب التصنيف حسب نوع المنتج — نفس منطق الواجهة */
export function resolveTemplateForKind(
  template: CategoryTemplateFields | null,
  kind: ProductKind,
  categorySlug?: string | null,
): CategoryTemplateFields | null {
  if (!template) return null;

  const rules =
    template.kindRules?.[kind] ?? getFallbackKindRules(categorySlug, kind);
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
