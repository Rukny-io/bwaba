import { Layers, Package, Percent, type LucideIcon } from 'lucide-react';

export type ProductCatalogKind = 'products' | 'collections' | 'discounts';

export type ProductCatalogConfig = {
  searchPlaceholder: string;
  addButtonLabel: string;
  showHiddenLabel: string;
  hiddenSwitchAriaLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  searchEmptyTitle: string;
  emptyIcon: LucideIcon;
};

export const PRODUCT_CATALOG_CONFIG: Record<ProductCatalogKind, ProductCatalogConfig> = {
  products: {
    searchPlaceholder: 'بحث في المنتجات…',
    addButtonLabel: 'إضافة منتج',
    showHiddenLabel: 'إظهار المخفي',
    hiddenSwitchAriaLabel: 'إظهار المنتجات المخفية',
    emptyTitle: 'لا توجد منتجات بعد',
    emptyDescription: 'اضغط «إضافة منتج» واختر النوع: مادي، رقمي، أو خدمة.',
    searchEmptyTitle: 'لا توجد نتائج',
    emptyIcon: Package,
  },
  collections: {
    searchPlaceholder: 'بحث في المجموعات…',
    addButtonLabel: 'إضافة مجموعة',
    showHiddenLabel: 'إظهار المخفية',
    hiddenSwitchAriaLabel: 'إظهار المجموعات المخفية',
    emptyTitle: 'لا توجد مجموعات بعد',
    emptyDescription: 'اضغط «إضافة مجموعة» لفتح نافذة الإنشاء.',
    searchEmptyTitle: 'لا توجد نتائج',
    emptyIcon: Layers,
  },
  discounts: {
    searchPlaceholder: 'بحث في الخصومات…',
    addButtonLabel: 'إضافة خصم',
    showHiddenLabel: 'إظهار المنتهية',
    hiddenSwitchAriaLabel: 'إظهار الخصومات المنتهية',
    emptyTitle: 'لا توجد خصومات بعد',
    emptyDescription: 'اضغط «إضافة خصم» وحدّد النسبة والمنتجات المشمولة.',
    searchEmptyTitle: 'لا توجد نتائج',
    emptyIcon: Percent,
  },
};
