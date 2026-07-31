import type { LinkCatalogTypeId } from '@/lib/links/link-type-catalog';

const CATALOG_TYPES = new Set<LinkCatalogTypeId>([
  'url',
  'instagram',
  'tiktok',
  'youtube',
  'x',
  'linkedin',
  'facebook',
  'whatsapp',
  'telegram',
  'snapchat',
  'email',
  'phone',
  'form',
  'header',
  'text',
]);

/** Map stored SocialLink.platform → catalog icon type */
export function resolveCatalogTypeFromPlatform(platform: string): LinkCatalogTypeId {
  const p = platform.toLowerCase().trim();
  if (p === 'twitter') return 'x';
  if (p === 'link' || p === 'website' || p === 'web') return 'url';
  if (CATALOG_TYPES.has(p as LinkCatalogTypeId)) return p as LinkCatalogTypeId;
  return 'url';
}

export function getLinkDisplayLabel(link: {
  title?: string | null;
  username?: string | null;
  platform: string;
}): string {
  return link.title?.trim() || link.username?.trim() || link.platform;
}
