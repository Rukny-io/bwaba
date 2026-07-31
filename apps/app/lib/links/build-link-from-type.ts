import type { CreateSocialLinkInput } from '@/lib/links/types';
import type { LinkCatalogTypeId } from '@/lib/links/link-type-catalog';

const PLACEHOLDER_URL = 'https://rukny.io';

function stripAt(value: string): string {
  return value.trim().replace(/^@+/, '');
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function ensureHttps(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export interface LinkFormValues {
  title: string;
  value: string;
}

export function getLinkFormFields(type: LinkCatalogTypeId): {
  valueLabel: string;
  valuePlaceholder: string;
  valueDir: 'ltr' | 'rtl';
  valueType: 'text' | 'url' | 'email' | 'tel';
  titleLabel: string;
  titlePlaceholder: string;
  showTitle: boolean;
  helpText?: string;
} {
  switch (type) {
    case 'instagram':
      return {
        titleLabel: 'العنوان',
        titlePlaceholder: 'حسابي على إنستغرام',
        showTitle: true,
        valueLabel: 'اسم المستخدم',
        valuePlaceholder: 'username',
        valueDir: 'ltr',
        valueType: 'text',
        helpText: 'أدخل اسم المستخدم بدون @',
      };
    case 'tiktok':
      return {
        titleLabel: 'العنوان',
        titlePlaceholder: 'حسابي على TikTok',
        showTitle: true,
        valueLabel: 'اسم المستخدم',
        valuePlaceholder: '@username',
        valueDir: 'ltr',
        valueType: 'text',
      };
    case 'x':
      return {
        titleLabel: 'العنوان',
        titlePlaceholder: 'حسابي على X',
        showTitle: true,
        valueLabel: 'اسم المستخدم',
        valuePlaceholder: 'username',
        valueDir: 'ltr',
        valueType: 'text',
      };
    case 'linkedin':
    case 'facebook':
    case 'youtube':
      return {
        titleLabel: 'العنوان',
        titlePlaceholder: `رابط ${type}`,
        showTitle: true,
        valueLabel: 'الرابط',
        valuePlaceholder: 'https://',
        valueDir: 'ltr',
        valueType: 'url',
      };
    case 'whatsapp':
      return {
        titleLabel: 'العنوان',
        titlePlaceholder: 'تواصل عبر واتساب',
        showTitle: true,
        valueLabel: 'رقم الهاتف',
        valuePlaceholder: '9647XXXXXXXX',
        valueDir: 'ltr',
        valueType: 'tel',
        helpText: 'أدخل الرقم مع رمز الدولة بدون +',
      };
    case 'telegram':
      return {
        titleLabel: 'العنوان',
        titlePlaceholder: 'قناتي على تيليغرام',
        showTitle: true,
        valueLabel: 'اسم المستخدم',
        valuePlaceholder: 'username',
        valueDir: 'ltr',
        valueType: 'text',
      };
    case 'snapchat':
      return {
        titleLabel: 'العنوان',
        titlePlaceholder: 'سناب شات',
        showTitle: true,
        valueLabel: 'اسم المستخدم',
        valuePlaceholder: 'username',
        valueDir: 'ltr',
        valueType: 'text',
      };
    case 'email':
      return {
        titleLabel: 'العنوان',
        titlePlaceholder: 'راسلني',
        showTitle: true,
        valueLabel: 'البريد الإلكتروني',
        valuePlaceholder: 'you@example.com',
        valueDir: 'ltr',
        valueType: 'email',
      };
    case 'phone':
      return {
        titleLabel: 'العنوان',
        titlePlaceholder: 'اتصل بي',
        showTitle: true,
        valueLabel: 'رقم الهاتف',
        valuePlaceholder: '+964...',
        valueDir: 'ltr',
        valueType: 'tel',
      };
    case 'header':
      return {
        titleLabel: 'نص العنوان',
        titlePlaceholder: 'عنوان القسم',
        showTitle: true,
        valueLabel: '',
        valuePlaceholder: '',
        valueDir: 'rtl',
        valueType: 'text',
        helpText: 'يظهر كعنوان فقط بدون رابط',
      };
    case 'text':
      return {
        titleLabel: 'النص',
        titlePlaceholder: 'نص توضيحي يظهر على صفحتك',
        showTitle: true,
        valueLabel: '',
        valuePlaceholder: '',
        valueDir: 'rtl',
        valueType: 'text',
        helpText: 'نص عرضي بدون رابط خارجي',
      };
    case 'url':
    default:
      return {
        titleLabel: 'العنوان',
        titlePlaceholder: 'مثال: موقعي الشخصي',
        showTitle: true,
        valueLabel: 'الرابط',
        valuePlaceholder: 'https://example.com',
        valueDir: 'ltr',
        valueType: 'url',
      };
  }
}

export function buildLinkFromType(
  type: LinkCatalogTypeId,
  platform: string,
  { title, value }: LinkFormValues,
): CreateSocialLinkInput {
  const trimmedTitle = title.trim();
  const trimmedValue = value.trim();

  let url = PLACEHOLDER_URL;
  let username = trimmedTitle || platform;

  switch (type) {
    case 'instagram': {
      const user = stripAt(trimmedValue);
      url = `https://instagram.com/${user}`;
      username = user;
      break;
    }
    case 'tiktok': {
      const user = stripAt(trimmedValue);
      url = `https://www.tiktok.com/@${user}`;
      username = user;
      break;
    }
    case 'x': {
      const user = stripAt(trimmedValue);
      url = `https://x.com/${user}`;
      username = user;
      break;
    }
    case 'linkedin':
    case 'facebook':
    case 'youtube':
      url = ensureHttps(trimmedValue);
      username = trimmedTitle || new URL(url).hostname;
      break;
    case 'whatsapp': {
      const phone = digitsOnly(trimmedValue);
      url = `https://wa.me/${phone}`;
      username = phone;
      break;
    }
    case 'telegram': {
      const user = stripAt(trimmedValue);
      url = `https://t.me/${user}`;
      username = user;
      break;
    }
    case 'snapchat': {
      const user = stripAt(trimmedValue);
      url = `https://www.snapchat.com/add/${user}`;
      username = user;
      break;
    }
    case 'email':
      url = `mailto:${trimmedValue}`;
      username = trimmedValue;
      break;
    case 'phone':
      url = `tel:${trimmedValue.replace(/\s/g, '')}`;
      username = trimmedValue;
      break;
    case 'header':
    case 'text':
      url = PLACEHOLDER_URL;
      username = trimmedTitle || (type === 'header' ? 'header' : 'text');
      break;
    case 'url':
    default:
      url = ensureHttps(trimmedValue);
      username = trimmedTitle || new URL(url).hostname.replace(/^www\./, '');
      break;
  }

  return {
    platform,
    username,
    url,
    title: trimmedTitle || undefined,
    ...(type === 'instagram' ? { layout: 'classic' as const } : {}),
  };
}

export function validateLinkForm(type: LinkCatalogTypeId, values: LinkFormValues): string | null {
  const title = values.title.trim();
  const value = values.value.trim();

  if (type === 'header' || type === 'text') {
    if (!title) return 'أدخل النص';
    return null;
  }

  if (!value) {
    return type === 'url' ? 'أدخل رابطاً صالحاً' : 'هذا الحقل مطلوب';
  }

  switch (type) {
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'صيغة البريد غير صحيحة';
      return null;
    case 'phone':
    case 'whatsapp':
      if (digitsOnly(value).length < 8) return 'رقم الهاتف قصير جداً';
      return null;
    case 'url':
    case 'linkedin':
    case 'facebook':
    case 'youtube':
      try {
        new URL(ensureHttps(value));
        return null;
      } catch {
        return 'صيغة الرابط غير صحيحة';
      }
    case 'instagram':
    case 'tiktok':
    case 'x':
    case 'telegram':
    case 'snapchat':
      if (!stripAt(value)) return 'أدخل اسم مستخدم صالح';
      return null;
    default:
      return null;
  }
}
