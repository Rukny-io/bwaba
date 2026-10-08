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
      labelKey: string;
    }
  | {
      kind: 'toggle';
      id: 'price' | 'stock';
      labelKey: string;
      asc: ProductsSortOption;
      desc: ProductsSortOption;
      ascLabelKey: string;
      descLabelKey: string;
    };

export const PRODUCTS_SORT_TABS: ProductsSortTab[] = [
  { kind: 'single', value: 'newest', labelKey: 'products.sortNewest' },
  { kind: 'single', value: 'name_asc', labelKey: 'products.sortName' },
  {
    kind: 'toggle',
    id: 'price',
    labelKey: 'products.sortPrice',
    asc: 'price_asc',
    desc: 'price_desc',
    ascLabelKey: 'products.sortLow',
    descLabelKey: 'products.sortHigh',
  },
  {
    kind: 'toggle',
    id: 'stock',
    labelKey: 'products.sortStock',
    asc: 'stock_asc',
    desc: 'stock_desc',
    ascLabelKey: 'products.sortLow',
    descLabelKey: 'products.sortHigh',
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
  t: (path: string) => string,
): string {
  const label = t(tab.labelKey);
  if (sortBy === tab.asc) return `${label} · ${t(tab.ascLabelKey)}`;
  if (sortBy === tab.desc) return `${label} · ${t(tab.descLabelKey)}`;
  return label;
}

export function getNextToggleSort(
  sortBy: ProductsSortOption,
  tab: Extract<ProductsSortTab, { kind: 'toggle' }>,
): ProductsSortOption {
  if (sortBy === tab.asc) return tab.desc;
  if (sortBy === tab.desc) return tab.asc;
  return tab.asc;
}
