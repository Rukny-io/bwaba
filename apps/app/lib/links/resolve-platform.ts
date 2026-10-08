import { getUrlHostLabel } from '@/lib/links/build-link-from-type';
import { resolvePlatformFromUrl } from '@/lib/links/domain-platform-map';
import { LINK_CATALOG_ITEMS, type LinkCatalogTypeId } from '@/lib/links/link-type-catalog';

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
  'kick',
  'discord',
  'spotify',
  'github',
  'reddit',
  'soundcloud',
  'vimeo',
  'notion',
  'shopify',
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

export function resolveCatalogTypeFromUrl(url: string): LinkCatalogTypeId {
  return resolvePlatformFromUrl(url) ?? 'url';
}

export function resolveCatalogTypeForLink(link: { platform: string; url: string }): LinkCatalogTypeId {
  const fromPlatform = resolveCatalogTypeFromPlatform(link.platform);
  if (fromPlatform !== 'url') return fromPlatform;
  return resolveCatalogTypeFromUrl(link.url);
}

export function getDefaultLinkTitleFromUrl(url: string): string {
  const type = resolveCatalogTypeFromUrl(url);
  if (type !== 'url') {
    return LINK_CATALOG_ITEMS.find((item) => item.id === type)?.label ?? getUrlHostLabel(url);
  }

  const host = getUrlHostLabel(url);
  const segment = host.split('.')[0] ?? host;
  if (!segment) return host;
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}
