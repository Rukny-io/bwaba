import type { LinkCatalogTypeId } from '@/lib/links/link-type-catalog';

export interface PlatformIconAsset {
  src: string;
  /** أيقونة ملوّنة من public — لا تُلوَّن عبر currentColor */
  brand?: boolean;
  /** قصّ شعار wordmark لإظهار الرمز فقط */
  crop?: {
    scale: number;
    align?: 'left' | 'center';
  };
  /** ملء الإطار (مثل أيقونة تطبيق مربّعة) — يُتجاهل داخل الدوائر */
  fill?: boolean;
  /** تصحيح بصري لحجم الشعار داخل الدائرة (1 = افتراضي) */
  opticalScale?: number;
}

/**
 * أيقونات من apps/app/public/icons
 */
const ICONS = {
  instagram: '/icons/instagram.svg',
  youtube: '/icons/youtube.svg',
  x: '/icons/x.svg',
  linkedin: '/icons/linkedin.svg',
  telegram: '/icons/telegram.svg',
  snapchat: '/icons/snapchat.svg',
  tiktok: '/icons/TikTok.jpeg',
  gmail: '/icons/gmail.svg',
  notion: '/icons/notion.svg',
  shopify: '/icons/shopify.svg',
  kick: '/logos/kick.png',
  whatsapp: '/icons/whatsapp.png',
  reddit: '/logos/Reddit.jpeg',
} as const;

/** مسارات من apps/app/public */
export const PLATFORM_ICON_ASSETS: Partial<Record<LinkCatalogTypeId, PlatformIconAsset>> = {
  instagram: { src: ICONS.instagram, brand: true, opticalScale: 0.96 },
  youtube: { src: ICONS.youtube, brand: true, opticalScale: 0.94 },
  x: { src: ICONS.x, brand: true, opticalScale: 0.9 },
  linkedin: { src: ICONS.linkedin, brand: true, opticalScale: 0.94 },
  telegram: { src: ICONS.telegram, brand: true, opticalScale: 0.94 },
  snapchat: { src: ICONS.snapchat, brand: true, opticalScale: 0.92 },
  tiktok: { src: ICONS.tiktok, brand: true, fill: true, opticalScale: 0.96 },
  email: { src: ICONS.gmail, brand: true, opticalScale: 0.92 },
  notion: { src: ICONS.notion, brand: true, opticalScale: 0.94 },
  shopify: { src: ICONS.shopify, brand: true, opticalScale: 0.94 },
  kick: { src: ICONS.kick, brand: true, opticalScale: 0.98 },
  whatsapp: { src: ICONS.whatsapp, brand: true, fill: true, opticalScale: 1.55 },
  reddit: { src: ICONS.reddit, brand: true, fill: true, opticalScale: 1 },
};

export function getPlatformIconAsset(type: LinkCatalogTypeId): PlatformIconAsset | undefined {
  return PLATFORM_ICON_ASSETS[type];
}
