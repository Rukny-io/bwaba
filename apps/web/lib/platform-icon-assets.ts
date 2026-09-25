export type ProfileLinkPlatform =
  | 'instagram'
  | 'youtube'
  | 'x'
  | 'linkedin'
  | 'telegram'
  | 'snapchat'
  | 'tiktok'
  | 'whatsapp'
  | 'email'
  | 'phone'
  | 'form'
  | 'url'
  | 'facebook'
  | 'header'
  | 'text'
  | string;

export interface PlatformIconAsset {
  src: string;
  brand?: boolean;
  fill?: boolean;
}

const ICONS = {
  instagram: '/icons/instagram.svg',
  youtube: '/icons/youtube.svg',
  x: '/icons/x.svg',
  linkedin: '/icons/linkedin.svg',
  telegram: '/icons/telegram.svg',
  snapchat: '/icons/snapchat.svg',
  tiktok: '/icons/TikTok.jpeg',
  whatsapp: '/icons/whatsapp.png',
  gmail: '/icons/gmail.svg',
  notion: '/icons/notion.svg',
} as const;

export const PLATFORM_ICON_ASSETS: Partial<Record<string, PlatformIconAsset>> = {
  instagram: { src: ICONS.instagram, brand: true },
  youtube: { src: ICONS.youtube, brand: true },
  x: { src: ICONS.x, brand: true },
  linkedin: { src: ICONS.linkedin, brand: true },
  telegram: { src: ICONS.telegram, brand: true },
  snapchat: { src: ICONS.snapchat, brand: true },
  tiktok: { src: ICONS.tiktok, brand: true, fill: true },
  email: { src: ICONS.gmail, brand: true },
  form: { src: ICONS.notion, brand: true },
  whatsapp: { src: ICONS.whatsapp, brand: true, fill: true },
};

export function getPlatformIconAsset(platform: string): PlatformIconAsset | undefined {
  return PLATFORM_ICON_ASSETS[platform.toLowerCase()];
}
