export type ProductsSortOption =
  | 'newest'
  | 'name_asc'
  | 'price_asc'
  | 'price_desc'
  | 'stock_asc'
  | 'stock_desc';

export type ProductsSortTab =
  | {
      kind: 'single';
      value: ProductsSortOption;
      label: string;
    }
  | {
      kind: 'toggle';
      id: 'price' | 'stock';
      label: string;
      asc: ProductsSortOption;
      desc: ProductsSortOption;
      ascLabel: string;
      descLabel: string;
    };

export const PRODUCTS_SORT_TABS: ProductsSortTab[] = [
  { kind: 'single', value: 'newest', label: 'الأحدث' },
  { kind: 'single', value: 'name_asc', label: 'الاسم (أ-ي)' },
  {
    kind: 'toggle',
    id: 'price',
    label: 'السعر',
    asc: 'price_asc',
    desc: 'price_desc',
    ascLabel: 'الأقل',
    descLabel: 'الأعلى',
  },
  {
    kind: 'toggle',
    id: 'stock',
    label: 'المخزون',
    asc: 'stock_asc',
    desc: 'stock_desc',
    ascLabel: 'الأقل',
    descLabel: 'الأعلى',
  },
];

export function isToggleSortActive(
  sortBy: ProductsSortOption,
  tab: Extract<ProductsSortTab, { kind: 'toggle' }>,
): boolean {
  return sortBy === tab.asc || sortBy === tab.desc;
}

export function getToggleSortLabel(
  sortBy: ProductsSortOption,
  tab: Extract<ProductsSortTab, { kind: 'toggle' }>,
): string {
  if (sortBy === tab.asc) return `${tab.label} · ${tab.ascLabel}`;
  if (sortBy === tab.desc) return `${tab.label} · ${tab.descLabel}`;
  return tab.label;
}

export function getNextToggleSort(
  sortBy: ProductsSortOption,
  tab: Extract<ProductsSortTab, { kind: 'toggle' }>,
): ProductsSortOption {
  if (sortBy === tab.asc) return tab.desc;
  if (sortBy === tab.desc) return tab.asc;
  return tab.asc;
}
