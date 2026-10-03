import type en from '@/dictionaries/en.json';
import {
  DOCUMENTATION_PRODUCTS,
  type DocumentationNavGroup,
  type DocumentationNavItem,
  type DocumentationProduct,
  type DocumentationProductId,
} from '@/lib/documentation-nav';

export type DocsCopy = (typeof en)['docs'];

function itemLabelKey(slug: string): string {
  if (!slug) return 'overview';
  return slug;
}

export function localizeNavGroups(
  groups: DocumentationNavGroup[] | undefined,
  docs: DocsCopy,
): DocumentationNavGroup[] {
  if (!groups?.length) return [];
  const groupLabels = docs.groups as Record<string, string>;
  const itemLabels = docs.items as Record<string, string>;
  return groups.map((group) => ({
    ...group,
    label: groupLabels[group.label] ?? group.label,
    items: group.items.map((item) => {
      const key = itemLabelKey(item.slug);
      return {
        ...item,
        label: itemLabels[key] ?? item.label,
      };
    }),
  }));
}

export function localizeDocumentationProducts(
  docs: DocsCopy,
): DocumentationProduct[] {
  return DOCUMENTATION_PRODUCTS.map((product) => {
    const copy = docs.products[product.id as DocumentationProductId];
    const navGroups = localizeNavGroups(product.navGroups, docs);
    const nav = navGroups.flatMap((group) => group.items);
    return {
      ...product,
      title: copy?.title ?? product.title,
      description: copy?.description ?? product.description,
      nav,
      navGroups,
    };
  });
}

export function getLocalizedDocumentationProduct(
  id: DocumentationProductId,
  docs: DocsCopy,
): DocumentationProduct | undefined {
  return localizeDocumentationProducts(docs).find((product) => product.id === id);
}

export function localizeNavItemLabel(
  item: DocumentationNavItem,
  docs: DocsCopy,
): string {
  const itemLabels = docs.items as Record<string, string>;
  return itemLabels[itemLabelKey(item.slug)] ?? item.label;
}
