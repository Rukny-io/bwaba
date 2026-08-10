import type { ProductKind } from '@/lib/products/types';

export const PRODUCTS_BASE_PATH = '/app/products';
export const PRODUCTS_CREATE_PATH = `${PRODUCTS_BASE_PATH}/new`;

const KIND_SLUGS: Record<string, ProductKind> = {
  physical: 'PHYSICAL',
  digital: 'DIGITAL',
  service: 'SERVICE',
};

export function getProductCreateKindPath(kind: ProductKind): string {
  return `${PRODUCTS_CREATE_PATH}/${kind.toLowerCase()}`;
}

export function parseProductKindParam(slug: string): ProductKind | null {
  return KIND_SLUGS[slug.toLowerCase()] ?? null;
}
