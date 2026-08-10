const BUSINESS_APP_URL =
  process.env.NEXT_PUBLIC_BUSINESS_URL?.replace(/\/$/, '') ?? 'http://localhost:3003';

/** Public storefront URL for a store slug. */
export function getStorePublicUrl(slug: string): string {
  return `${BUSINESS_APP_URL}/${encodeURIComponent(slug)}`;
}
