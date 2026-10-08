import type { ProductKind } from '@/lib/products/types';

export interface ProductKindCatalogItem {
  id: ProductKind;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  examples: string[];
  examplesEn: string[];
  keywords: string[];
}

export const PRODUCT_KIND_CATALOG: ProductKindCatalogItem[] = [
  {
    id: 'PHYSICAL',
    label: 'منتج مادي',
    labelEn: 'Physical product',
    description: 'منتجات ملموسة مع صور، وصف، مخزون، وخيارات شحن.',
    descriptionEn: 'Tangible items with images, stock, and delivery options.',
    examples: ['ملابس وإكسسوارات', 'كتب مطبوعة', 'أجهزة ومنتجات منزلية'],
    examplesEn: ['Clothing & accessories', 'Printed books', 'Devices & home goods'],
    keywords: ['مادي', 'شحن', 'مخزون', 'physical'],
  },
  {
    id: 'DIGITAL',
    label: 'منتج رقمي',
    labelEn: 'Digital product',
    description: 'ملفات، كتب إلكترونية، قوالب، دورات، أو محتوى يُسلّم بعد الشراء.',
    descriptionEn: 'Files, e-books, templates, courses, and instant content.',
    examples: ['كتب إلكترونية وPDF', 'قوالب وملفات تصميم', 'دورات ومحتوى تدريبي'],
    examplesEn: ['E-books & PDFs', 'Templates & design files', 'Courses & training'],
    keywords: ['رقمي', 'ملف', 'pdf', 'digital', 'دورة'],
  },
  {
    id: 'SERVICE',
    label: 'خدمة',
    labelEn: 'Service',
    description: 'خدمات احترافية بأسلوب منصات خمسات والعمل الحر، بدون مخزون.',
    descriptionEn: 'Freelance-style professional services with no inventory.',
    examples: ['تصميم وكتابة', 'برمجة وتسويق', 'استشارات وحجوزات'],
    examplesEn: ['Design & writing', 'Development & marketing', 'Consulting & bookings'],
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
