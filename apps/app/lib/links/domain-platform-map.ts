import type { LinkCatalogTypeId } from '@/lib/links/link-type-catalog';

type DomainRule = {
  type: LinkCatalogTypeId;
  hosts: string[];
};

const DOMAIN_PLATFORM_RULES: DomainRule[] = [
  { type: 'youtube', hosts: ['youtube.com', 'youtu.be', 'music.youtube.com'] },
  { type: 'instagram', hosts: ['instagram.com'] },
  { type: 'tiktok', hosts: ['tiktok.com'] },
  { type: 'x', hosts: ['x.com', 'twitter.com'] },
  { type: 'linkedin', hosts: ['linkedin.com'] },
  { type: 'facebook', hosts: ['facebook.com', 'fb.com', 'fb.me', 'm.facebook.com'] },
  { type: 'whatsapp', hosts: ['whatsapp.com', 'wa.me', 'api.whatsapp.com'] },
  { type: 'telegram', hosts: ['telegram.org', 'telegram.me', 't.me'] },
  { type: 'snapchat', hosts: ['snapchat.com'] },
  { type: 'kick', hosts: ['kick.com'] },
  { type: 'discord', hosts: ['discord.com', 'discord.gg'] },
  { type: 'spotify', hosts: ['spotify.com', 'open.spotify.com'] },
  { type: 'github', hosts: ['github.com'] },
  { type: 'reddit', hosts: ['reddit.com', 'redd.it'] },
  { type: 'soundcloud', hosts: ['soundcloud.com'] },
  { type: 'vimeo', hosts: ['vimeo.com'] },
  { type: 'notion', hosts: ['notion.so', 'notion.site'] },
  { type: 'shopify', hosts: ['shopify.com', 'myshopify.com'] },
];

function normalizeHost(host: string): string {
  return host.replace(/^www\./, '').toLowerCase();
}

function hostMatches(host: string, ruleHost: string): boolean {
  return host === ruleHost || host.endsWith(`.${ruleHost}`);
}

export function resolvePlatformFromHost(host: string): LinkCatalogTypeId | null {
  const normalized = normalizeHost(host);
  for (const rule of DOMAIN_PLATFORM_RULES) {
    if (rule.hosts.some((ruleHost) => hostMatches(normalized, ruleHost))) {
      return rule.type;
    }
  }
  return null;
}

export function resolvePlatformFromUrl(url: string): LinkCatalogTypeId | null {
  try {
    const host = new URL(url).hostname;
    return resolvePlatformFromHost(host);
  } catch {
    return null;
  }
}
