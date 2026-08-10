/** يوحّد slugs القديمة/المختصرة مع slugs قاعدة البيانات */
const STORE_CATEGORY_SLUG_ALIASES: Record<string, string> = {
  food: 'food-beverages',
  kids: 'kids-baby',
  clothing: 'fashion',
  apparel: 'fashion',
  beauty: 'beauty-care',
  home: 'home-furniture',
  books: 'books-digital',
  jewelry: 'jewelry-watches',
  digital: 'books-digital',
};

export function normalizeStoreCategorySlug(
  slug: string | null | undefined,
): string | null {
  if (!slug?.trim()) return null;
  const trimmed = slug.trim().toLowerCase();
  return STORE_CATEGORY_SLUG_ALIASES[trimmed] ?? trimmed;
}
