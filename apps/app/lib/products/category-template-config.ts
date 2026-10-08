import type { ProductKind } from '@/lib/products/types';
import type { CategoryKindRules } from '@/lib/products/template-types';
import type { AppLocale } from '@/lib/i18n/config';
import { pickLocaleValue } from '@/lib/i18n/get-message';

export interface CategoryFormUiConfig {
  sectionTitle: string;
  sectionDescription: string;
  namePlaceholder: string;
  descriptionPlaceholder: string;
}

type CategoryFormUiSource = {
  ar: CategoryFormUiConfig;
  en: CategoryFormUiConfig;
};

const DEFAULT_UI: CategoryFormUiSource = {
  ar: {
    sectionTitle: 'تفاصيل التصنيف',
    sectionDescription: 'حقول مخصصة حسب نشاط متجرك',
    namePlaceholder: 'مثال: منتج جديد',
    descriptionPlaceholder: 'وصف اختياري يظهر في المتجر',
  },
  en: {
    sectionTitle: 'Category details',
    sectionDescription: 'Custom fields for your store category',
    namePlaceholder: 'e.g. New product',
    descriptionPlaceholder: 'Optional description shown in your store',
  },
};

/** عناوين ونصوص مساعدة حسب تصنيف المتجر */
export const CATEGORY_FORM_UI: Record<string, CategoryFormUiSource> = {
  fashion: {
    ar: {
      sectionTitle: 'تفاصيل الأزياء',
      sectionDescription: 'الخامة، الفئة، الموسم، والعلامة التجارية',
      namePlaceholder: 'مثال: قميص قطني كلاسيك',
      descriptionPlaceholder: 'الخامة، المقاسات، تعليمات الغسيل…',
    },
    en: {
      sectionTitle: 'Fashion details',
      sectionDescription: 'Material, audience, season, and brand',
      namePlaceholder: 'e.g. Classic cotton shirt',
      descriptionPlaceholder: 'Material, sizes, care instructions…',
    },
  },
  electronics: {
    ar: {
      sectionTitle: 'تفاصيل الجهاز',
      sectionDescription: 'العلامة، الحالة، الضمان، والموديل',
      namePlaceholder: 'مثال: iPhone 15 Pro',
      descriptionPlaceholder: 'المواصفات، الحالة، ما يشمله العرض…',
    },
    en: {
      sectionTitle: 'Device details',
      sectionDescription: 'Brand, condition, warranty, and model',
      namePlaceholder: 'e.g. iPhone 15 Pro',
      descriptionPlaceholder: 'Specs, condition, what’s included…',
    },
  },
  'food-beverages': {
    ar: {
      sectionTitle: 'تفاصيل المنتج الغذائي',
      sectionDescription: 'المكونات، التخزين، وتاريخ الانتهاء',
      namePlaceholder: 'مثال: عسل طبيعي 500غ',
      descriptionPlaceholder: 'المكونات، طريقة التخزين، مدة الصلاحية…',
    },
    en: {
      sectionTitle: 'Food details',
      sectionDescription: 'Ingredients, storage, and expiry',
      namePlaceholder: 'e.g. Natural honey 500g',
      descriptionPlaceholder: 'Ingredients, storage, shelf life…',
    },
  },
  'beauty-care': {
    ar: {
      sectionTitle: 'تفاصيل العناية',
      sectionDescription: 'نوع البشرة، المكونات، والاستخدام',
      namePlaceholder: 'مثال: كريم مرطب للوجه',
      descriptionPlaceholder: 'نوع البشرة المناسبة، طريقة الاستخدام…',
    },
    en: {
      sectionTitle: 'Beauty details',
      sectionDescription: 'Skin type, ingredients, and usage',
      namePlaceholder: 'e.g. Face moisturizer',
      descriptionPlaceholder: 'Suitable skin types, how to use…',
    },
  },
  'home-furniture': {
    ar: {
      sectionTitle: 'تفاصيل المنزل',
      sectionDescription: 'الأبعاد، الخامة، واللون',
      namePlaceholder: 'مثال: طاولة قهوة خشبية',
      descriptionPlaceholder: 'الأبعاد، خامة التصنيع، تعليمات التركيب…',
    },
    en: {
      sectionTitle: 'Home details',
      sectionDescription: 'Dimensions, material, and color',
      namePlaceholder: 'e.g. Wooden coffee table',
      descriptionPlaceholder: 'Dimensions, materials, assembly notes…',
    },
  },
  'books-digital': {
    ar: {
      sectionTitle: 'تفاصيل المحتوى',
      sectionDescription: 'النوع، اللغة، الصيغة، والمؤلف',
      namePlaceholder: 'مثال: دورة تصميم UI',
      descriptionPlaceholder: 'محتوى الدورة، اللغة، مدة الوصول…',
    },
    en: {
      sectionTitle: 'Content details',
      sectionDescription: 'Type, language, format, and author',
      namePlaceholder: 'e.g. UI design course',
      descriptionPlaceholder: 'Course content, language, access period…',
    },
  },
  handmade: {
    ar: {
      sectionTitle: 'تفاصيل الحرفة',
      sectionDescription: 'نوع الحرفة، الخامة، ومدة التجهيز',
      namePlaceholder: 'مثال: سجادة يدوية مطرزة',
      descriptionPlaceholder: 'طريقة الصنع، الخامات، مدة التجهيز…',
    },
    en: {
      sectionTitle: 'Craft details',
      sectionDescription: 'Craft type, material, and prep time',
      namePlaceholder: 'e.g. Handmade embroidered rug',
      descriptionPlaceholder: 'How it’s made, materials, lead time…',
    },
  },
  'kids-baby': {
    ar: {
      sectionTitle: 'تفاصيل منتج الأطفال',
      sectionDescription: 'الفئة العمرية، الخامة، ومعايير الأمان',
      namePlaceholder: 'مثال: لعبة تعليمية خشبية',
      descriptionPlaceholder: 'الفئة العمرية، معايير الأمان، طريقة الاستخدام…',
    },
    en: {
      sectionTitle: 'Kids details',
      sectionDescription: 'Age range, material, and safety',
      namePlaceholder: 'e.g. Wooden learning toy',
      descriptionPlaceholder: 'Age range, safety standards, how to use…',
    },
  },
  'jewelry-watches': {
    ar: {
      sectionTitle: 'تفاصيل المجوهرات',
      sectionDescription: 'نوع المعدن، الوزن، والأحجار',
      namePlaceholder: 'مثال: خاتم ذهب عيار 21',
      descriptionPlaceholder: 'العيار، الوزن، شهادة الأصالة…',
    },
    en: {
      sectionTitle: 'Jewelry details',
      sectionDescription: 'Metal type, weight, and gemstones',
      namePlaceholder: 'e.g. 21K gold ring',
      descriptionPlaceholder: 'Karat, weight, authenticity certificate…',
    },
  },
  services: {
    ar: {
      sectionTitle: 'تفاصيل الخدمة',
      sectionDescription: 'نوع الخدمة، المدة، وطريقة التقديم',
      namePlaceholder: 'مثال: استشارة تسويق رقمي',
      descriptionPlaceholder: 'ما تتضمنه الخدمة، المدة، طريقة التنفيذ…',
    },
    en: {
      sectionTitle: 'Service details',
      sectionDescription: 'Service type, duration, and delivery',
      namePlaceholder: 'e.g. Digital marketing consultation',
      descriptionPlaceholder: 'What’s included, duration, how it’s delivered…',
    },
  },
};

/** قواعد احتياطية إذا لم تُحدَّث قاعدة البيانات بعد */
export const CATEGORY_KIND_RULES: Record<
  string,
  Partial<Record<ProductKind, CategoryKindRules>>
> = {
  fashion: {
    PHYSICAL: {
      attributeKeys: ['material', 'gender', 'season', 'brand'],
      enableVariants: true,
    },
    DIGITAL: {
      attributeKeys: ['gender', 'brand', 'season'],
      enableVariants: false,
    },
    SERVICE: {
      attributeKeys: ['brand'],
      enableVariants: false,
    },
  },
  electronics: {
    DIGITAL: {
      attributeKeys: ['brand', 'model', 'condition', 'warranty'],
      enableVariants: false,
    },
    SERVICE: {
      attributeKeys: ['brand', 'warranty'],
      enableVariants: false,
    },
  },
  'food-beverages': {
    DIGITAL: {
      attributeKeys: ['ingredients', 'weight', 'calories', 'allergens'],
      enableVariants: false,
    },
    SERVICE: { attributeKeys: [], enableVariants: false },
  },
};

export function getCategoryKindRules(
  categorySlug: string | null | undefined,
  kind: ProductKind,
): CategoryKindRules | undefined {
  if (!categorySlug) return undefined;
  return CATEGORY_KIND_RULES[categorySlug]?.[kind];
}

export function getCategoryFormUi(
  categorySlug: string | null | undefined,
  locale: AppLocale = 'ar',
): CategoryFormUiConfig {
  const source =
    (categorySlug ? CATEGORY_FORM_UI[categorySlug] : undefined) ?? DEFAULT_UI;
  return pickLocaleValue(locale, source);
}

/** تسمية نوع المنتج مع سياق التصنيف */
export function getCategoryKindHint(
  categorySlug: string | null | undefined,
  kind: ProductKind,
  locale: AppLocale = 'ar',
): string | null {
  if (categorySlug === 'fashion' && kind === 'PHYSICAL') {
    return pickLocaleValue(locale, {
      ar: 'أضف المقاسات والألوان كمتغيرات لإدارة المخزون بدقة',
      en: 'Add sizes and colors as variants to track stock accurately',
    });
  }
  if (categorySlug === 'electronics' && kind === 'PHYSICAL') {
    return pickLocaleValue(locale, {
      ar: 'يمكنك إضافة متغيرات للسعة واللون والذاكرة',
      en: 'You can add variants for storage, color, and RAM',
    });
  }
  if (categorySlug === 'books-digital' && kind === 'DIGITAL') {
    return pickLocaleValue(locale, {
      ar: 'ارفع الملف الرقمي بعد إنشاء المنتج',
      en: 'Upload the digital file after creating the product',
    });
  }
  return null;
}
