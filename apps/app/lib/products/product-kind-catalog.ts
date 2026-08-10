import type { ProductKind } from '@/lib/products/types';

export interface ProductKindCatalogItem {
  id: ProductKind;
  label: string;
  description: string;
  keywords: string[];
}

export const PRODUCT_KIND_CATALOG: ProductKindCatalogItem[] = [
  {
    id: 'PHYSICAL',
    label: 'منتج مادي',
    description: 'منتجات ملموسة مع صور، وصف، ومخزون.',
    keywords: ['مادي', 'شحن', 'مخزون', 'physical'],
  },
  {
    id: 'DIGITAL',
    label: 'منتج رقمي',
    description: 'ملفات، دورات، أو محتوى يُسلّم بعد الشراء.',
    keywords: ['رقمي', 'ملف', 'pdf', 'digital', 'دورة'],
  },
  {
    id: 'SERVICE',
    label: 'خدمة',
    description: 'استشارات، مواعيد، أو خدمات بدون مخزون.',
    keywords: ['خدمة', 'استشارة', 'موعد', 'service'],
  },
];

export function filterProductKindCatalog(search: string): ProductKindCatalogItem[] {
  const query = search.trim().toLowerCase();
  if (!query) return PRODUCT_KIND_CATALOG;

  return PRODUCT_KIND_CATALOG.filter((item) => {
    if (item.label.toLowerCase().includes(query)) return true;
    if (item.description.toLowerCase().includes(query)) return true;
    return item.keywords.some((keyword) => keyword.toLowerCase().includes(query));
  });
}

export function getProductKindCatalogItem(
  kind: ProductKind,
): ProductKindCatalogItem | undefined {
  return PRODUCT_KIND_CATALOG.find((item) => item.id === kind);
}
