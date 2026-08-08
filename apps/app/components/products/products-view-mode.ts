export type ProductsViewMode = 'grid' | 'full' | 'inline';

export type ProductsSortOption = 'newest' | 'name_asc' | 'price_asc';

export const PRODUCTS_VIEW_MODES: {
  value: ProductsViewMode;
  label: string;
}[] = [
  { value: 'grid', label: 'شبكة' },
  { value: 'full', label: 'كامل' },
  { value: 'inline', label: 'خطي' },
];

export const PRODUCTS_SORT_OPTIONS: {
  value: ProductsSortOption;
  label: string;
}[] = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'name_asc', label: 'الاسم (أ-ي)' },
  { value: 'price_asc', label: 'السعر' },
];
