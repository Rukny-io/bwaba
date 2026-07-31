import type { LucideIcon } from 'lucide-react';
import {
  AlignLeft,
  FileText,
  Heading,
  Lightbulb,
  MessageCircle,
  ShoppingBag,
  Users,
  Video,
} from 'lucide-react';

export type LinkCatalogCategoryId =
  | 'suggested'
  | 'social'
  | 'contact'
  | 'forms'
  | 'media'
  | 'text'
  | 'commerce'
  | 'all';

export type LinkCatalogTypeId =
  | 'url'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'x'
  | 'linkedin'
  | 'facebook'
  | 'whatsapp'
  | 'telegram'
  | 'snapchat'
  | 'email'
  | 'phone'
  | 'form'
  | 'header'
  | 'text';

export interface LinkCatalogCategory {
  id: LinkCatalogCategoryId;
  label: string;
  icon: LucideIcon;
}

export interface LinkCatalogItem {
  id: LinkCatalogTypeId;
  label: string;
  description: string;
  categories: LinkCatalogCategoryId[];
  platform: string;
  comingSoon?: boolean;
}

export const LINK_CATALOG_CATEGORIES: LinkCatalogCategory[] = [
  { id: 'suggested', label: 'مقترح', icon: Lightbulb },
  { id: 'social', label: 'اجتماعي', icon: Users },
  { id: 'contact', label: 'تواصل', icon: MessageCircle },
  { id: 'forms', label: 'النماذج', icon: FileText },
  { id: 'media', label: 'وسائط', icon: Video },
  { id: 'text', label: 'نص', icon: Heading },
  { id: 'commerce', label: 'تجارة', icon: ShoppingBag },
  { id: 'all', label: 'الكل', icon: AlignLeft },
];

export const LINK_CATALOG_ITEMS: LinkCatalogItem[] = [
  {
    id: 'url',
    label: 'رابط',
    description: 'أي رابط خارجي أو صفحة ويب',
    categories: ['suggested', 'all'],
    platform: 'link',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    description: 'رابط، بطاقة تعريفية، أو شبكة منشورات',
    categories: ['suggested', 'social'],
    platform: 'instagram',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    description: 'تواصل مباشر عبر الواتساب',
    categories: ['suggested', 'contact'],
    platform: 'whatsapp',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    description: 'شارك فيديوهاتك على صفحتك',
    categories: ['suggested', 'media'],
    platform: 'youtube',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    description: 'شارك تيك توك على صفحتك',
    categories: ['social'],
    platform: 'tiktok',
  },
  {
    id: 'x',
    label: 'X',
    description: 'حسابك على X',
    categories: ['social'],
    platform: 'x',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    description: 'ملفك المهني على لينكدإن',
    categories: ['social'],
    platform: 'linkedin',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    description: 'صفحتك على فيسبوك',
    categories: ['social'],
    platform: 'facebook',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    description: 'قناة أو حساب تيليغرام',
    categories: ['social'],
    platform: 'telegram',
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    description: 'أضف حساب سناب شات',
    categories: ['social'],
    platform: 'snapchat',
  },
  {
    id: 'email',
    label: 'بريد إلكتروني',
    description: 'فتح تطبيق البريد مباشرة',
    categories: ['contact'],
    platform: 'email',
  },
  {
    id: 'phone',
    label: 'هاتف',
    description: 'اتصال مباشر برقمك',
    categories: ['contact'],
    platform: 'phone',
  },
  {
    id: 'header',
    label: 'عنوان',
    description: 'عنوان قسم بدون رابط',
    categories: ['text'],
    platform: 'header',
  },
  {
    id: 'text',
    label: 'نص',
    description: 'نص توضيحي على صفحتك',
    categories: ['text'],
    platform: 'text',
  },
];

const ITEM_MAP = new Map(LINK_CATALOG_ITEMS.map((item) => [item.id, item]));

export function getLinkCatalogItem(id: LinkCatalogTypeId): LinkCatalogItem {
  const item = ITEM_MAP.get(id);
  if (!item) throw new Error(`Unknown link type: ${id}`);
  return item;
}

export function filterLinkCatalogItems(options: {
  category: LinkCatalogCategoryId;
  search: string;
}): LinkCatalogItem[] {
  const q = options.search.trim().toLowerCase();

  return LINK_CATALOG_ITEMS.filter((item) => {
    if (options.category !== 'all' && !item.categories.includes(options.category)) {
      return false;
    }
    if (!q) return true;
    const haystack = `${item.label} ${item.description} ${item.platform}`.toLowerCase();
    return haystack.includes(q);
  });
}
