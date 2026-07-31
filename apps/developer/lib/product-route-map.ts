import type { DeveloperProductId } from '@/lib/developer-products';

/** Maps URL path segments under /apps/{appId}/ to product IDs */
export const PRODUCT_ROUTE_MAP: Record<string, DeveloperProductId> = {
  forms: 'forms',
  whatsapp: 'whatsapp',
  'whatsapp-api': 'whatsappApi',
};

export function productIdFromPathSegment(
  segment: string,
): DeveloperProductId | null {
  return PRODUCT_ROUTE_MAP[segment] ?? null;
}

export function firstProductSegmentFromPathname(
  pathname: string,
): { segment: string; productId: DeveloperProductId } | null {
  const match = pathname.match(/^\/apps\/\d{16}\/([^/]+)/);
  if (!match?.[1]) return null;
  const productId = productIdFromPathSegment(match[1]);
  if (!productId) return null;
  return { segment: match[1], productId };
}
