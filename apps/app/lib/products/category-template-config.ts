import type { ProductKind } from '@/lib/products/types';
import type { CategoryKindRules } from '@/lib/products/template-types';

export interface CategoryFormUiConfig {
  sectionTitle: string;
  sectionDescription: string;
  namePlaceholder: string;
  descriptionPlaceholder: string;
}

const DEFAULT_UI: CategoryFormUiConfig = {
  sectionTitle: 'تفاصيل التصنيف',
  sectionDescription: 'حقول مخصصة حسب نشاط متجرك',
  namePlaceholder: 'مثال: منتج جديد',
  descriptionPlaceholder: 'وصف اختياري يظهر في المتجر',
};

/** عناوين ونصوص مساعدة حسب تصنيف المتجر */
export const CATEGORY_FORM_UI: Record<string, CategoryFormUiConfig> = {
  fashion: {
    sectionTitle: 'تفاصيل الأزياء',
    sectionDescription: 'الخامة، الفئة، الموسم، والعلامة التجارية',
    namePlaceholder: 'مثال: قميص قطني كلاسيك',
    descriptionPlaceholder: 'الخامة، المقاسات، تعليمات الغسيل…',
  },
  electronics: {
    sectionTitle: 'تفاصيل الجهاز',
    sectionDescription: 'العلامة، الحالة، الضمان، والموديل',
    namePlaceholder: 'مثال: iPhone 15 Pro',
    descriptionPlaceholder: 'المواصفات، الحالة، ما يشمله العرض…',
  },
  'food-beverages': {
    sectionTitle: 'تفاصيل المنتج الغذائي',
    sectionDescription: 'المكونات، التخزين، وتاريخ الانتهاء',
    namePlaceholder: 'مثال: عسل طبيعي 500غ',
    descriptionPlaceholder: 'المكونات، طريقة التخزين، مدة الصلاحية…',
  },
  'beauty-care': {
    sectionTitle: 'تفاصيل العناية',
    sectionDescription: 'نوع البشرة، المكونات، والاستخدام',
    namePlaceholder: 'مثال: كريم مرطب للوجه',
    descriptionPlaceholder: 'نوع البشرة المناسبة، طريقة الاستخدام…',
  },
  'home-furniture': {
    sectionTitle: 'تفاصيل المنزل',
    sectionDescription: 'الأبعاد، الخامة، واللون',
    namePlaceholder: 'مثال: طاولة قهوة خشبية',
    descriptionPlaceholder: 'الأبعاد، خامة التصنيع، تعليمات التركيب…',
  },
  'books-digital': {
    sectionTitle: 'تفاصيل المحتوى',
    sectionDescription: 'النوع، اللغة، الصيغة، والمؤلف',
    namePlaceholder: 'مثال: دورة تصميم UI',
    descriptionPlaceholder: 'محتوى الدورة، اللغة، مدة الوصول…',
  },
  handmade: {
    sectionTitle: 'تفاصيل الحرفة',
    sectionDescription: 'نوع الحرفة، الخامة، ومدة التجهيز',
    namePlaceholder: 'مثال: سجادة يدوية مطرزة',
    descriptionPlaceholder: 'طريقة الصنع، الخامات، مدة التجهيز…',
  },
  'kids-baby': {
    sectionTitle: 'تفاصيل منتج الأطفال',
    sectionDescription: 'الفئة العمرية، الخامة، ومعايير الأمان',
    namePlaceholder: 'مثال: لعبة تعليمية خشبية',
    descriptionPlaceholder: 'الفئة العمرية، معايير الأمان، طريقة الاستخدام…',
  },
  'jewelry-watches': {
    sectionTitle: 'تفاصيل المجوهرات',
    sectionDescription: 'نوع المعدن، الوزن، والأحجار',
    namePlaceholder: 'مثال: خاتم ذهب عيار 21',
    descriptionPlaceholder: 'العيار، الوزن، شهادة الأصالة…',
  },
  services: {
    sectionTitle: 'تفاصيل الخدمة',
    sectionDescription: 'نوع الخدمة، المدة، وطريقة التقديم',
    namePlaceholder: 'مثال: استشارة تسويق رقمي',
    descriptionPlaceholder: 'ما تتضمنه الخدمة، المدة، طريقة التنفيذ…',
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
): CategoryFormUiConfig {
  if (!categorySlug) return DEFAULT_UI;
  return CATEGORY_FORM_UI[categorySlug] ?? DEFAULT_UI;
}

/** تسمية نوع المنتج مع سياق التصنيف */
export function getCategoryKindHint(
  categorySlug: string | null | undefined,
  kind: ProductKind,
): string | null {
  if (categorySlug === 'fashion' && kind === 'PHYSICAL') {
    return 'أضف المقاسات والألوان كمتغيرات لإدارة المخزون بدقة';
  }
  if (categorySlug === 'electronics' && kind === 'PHYSICAL') {
    return 'يمكنك إضافة متغيرات للسعة واللون والذاكرة';
  }
  if (categorySlug === 'books-digital' && kind === 'DIGITAL') {
    return 'ارفع الملف الرقمي بعد إنشاء المنتج';
  }
  return null;
}
