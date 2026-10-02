export interface PlatformIconAsset {
  src: string;
  brand?: boolean;
  fill?: boolean;
  /** Visual scale inside the badge (YouTube SVG reads larger than peers) */
  opticalScale?: number;
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
  instagram: { src: ICONS.instagram, brand: true, opticalScale: 0.92 },
  youtube: { src: ICONS.youtube, brand: true, opticalScale: 0.95 },
  x: { src: ICONS.x, brand: true, opticalScale: 0.88 },
  linkedin: { src: ICONS.linkedin, brand: true, opticalScale: 0.9 },
  telegram: { src: ICONS.telegram, brand: true, opticalScale: 0.9 },
  snapchat: { src: ICONS.snapchat, brand: true, opticalScale: 0.88 },
  tiktok: { src: ICONS.tiktok, brand: true, fill: true, opticalScale: 0.9 },
  email: { src: ICONS.gmail, brand: true, opticalScale: 0.88 },
  form: { src: ICONS.notion, brand: true, opticalScale: 0.9 },
  whatsapp: { src: ICONS.whatsapp, brand: true, fill: true, opticalScale: 0.9 },
};

export function getPlatformIconAsset(platform: string): PlatformIconAsset | undefined {
  return PLATFORM_ICON_ASSETS[platform.toLowerCase()];
}
