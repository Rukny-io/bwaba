import type { PublicProfileProduct, PublicProfileProductAttribute } from './types';

const ATTRIBUTE_LABELS: Record<string, string> = {
  serviceType: 'نوع الخدمة',
  duration: 'المدة',
  deliveryMethod: 'طريقة التقديم',
  brand: 'العلامة التجارية',
  condition: 'الحالة',
  warranty: 'الضمان',
  model: 'الموديل',
  material: 'الخامة',
  gender: 'الفئة',
  season: 'الموسم',
  ingredients: 'المكونات',
  weight: 'الوزن',
  calories: 'السعرات',
  allergens: 'مسببات الحساسية',
};

export function getProductAttributeRows(
  attributes: PublicProfileProductAttribute[] | undefined,
): Array<{ label: string; value: string }> {
  return (attributes ?? [])
    .map((attr) => {
      const value = attr.value?.trim();
      if (!value) return null;
      return {
        label: ATTRIBUTE_LABELS[attr.key] ?? attr.key,
        value,
      };
    })
    .filter((row): row is { label: string; value: string } => row != null);
}

export function getProductKindLabel(product: PublicProfileProduct): string {
  if (product.isDigital) return 'رقمي';
  return 'مادي';
}
