import type { CategoryTemplateFields } from './dto/product-attribute.dto';
import { normalizeStoreCategorySlug } from './store-category-slugs';

export interface StaticStoreCategory {
  name: string;
  nameAr: string;
  slug: string;
  templateFields: CategoryTemplateFields;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const catalog = require('./data/store-categories.json') as StaticStoreCategory[];

const bySlug = new Map<string, StaticStoreCategory>();

for (const entry of catalog) {
  bySlug.set(entry.slug, entry);
}

export function getStaticStoreCategory(
  slug: string | null | undefined,
): StaticStoreCategory | null {
  const normalized = normalizeStoreCategorySlug(slug);
  if (!normalized) return null;
  return bySlug.get(normalized) ?? null;
}
