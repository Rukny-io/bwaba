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
  /** ملء الإطار (مثل أيقونة تطبيق مربّعة) */
  fill?: boolean;
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
  whatsapp: '/icons/whatsapp.png',
  gmail: '/icons/gmail.svg',
  notion: '/icons/notion.svg',
} as const;

/** مسارات من apps/app/public */
export const PLATFORM_ICON_ASSETS: Partial<Record<LinkCatalogTypeId, PlatformIconAsset>> = {
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

export function getPlatformIconAsset(type: LinkCatalogTypeId): PlatformIconAsset | undefined {
  return PLATFORM_ICON_ASSETS[type];
}
