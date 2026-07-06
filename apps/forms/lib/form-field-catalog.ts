import type { LucideIcon } from 'lucide-react';
import {
  AlignLeft,
  Calendar,
  CalendarClock,
  CheckSquare,
  CircleDot,
  Clock,
  Grid3x3,
  Hash,
  Heading,
  Lightbulb,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Mail,
  Minus,
  Paperclip,
  PenLine,
  Phone,
  Globe,
  Image,
  MapPin,
  FileCheck,
  ThumbsUp,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Text,
  ToggleLeft,
  Type,
} from 'lucide-react';
import type { FormType } from '@/lib/forms-api';
import {
  WIZARD_ADDABLE_FIELD_TYPES,
  WIZARD_FIELD_TYPE_LABELS,
  type WizardFieldType,
} from '@/lib/form-field-types';

export type FieldCatalogCategoryId =
  | 'suggested'
  | 'input'
  | 'choice'
  | 'rating'
  | 'layout'
  | 'all';

export interface FieldCatalogCategory {
  id: FieldCatalogCategoryId;
  label: string;
  icon: LucideIcon;
}

export interface FieldCatalogItem {
  type: WizardFieldType;
  label: string;
  description: string;
  helpText: string;
  helpWhen: string;
  helpExample: string;
  category: FieldCatalogCategoryId;
  icon: LucideIcon;
}

export const FIELD_CATALOG_CATEGORIES: FieldCatalogCategory[] = [
  { id: 'suggested', label: 'مقترح', icon: Lightbulb },
  { id: 'input', label: 'إدخال', icon: Type },
  { id: 'choice', label: 'اختيار', icon: List },
  { id: 'rating', label: 'تقييم', icon: Star },
  { id: 'layout', label: 'تخطيط', icon: Heading },
  { id: 'all', label: 'الكل', icon: AlignLeft },
];

const FIELD_DESCRIPTIONS: Record<WizardFieldType, string> = {
  TEXT: 'سطر واحد للإجابات القصيرة',
  TEXTAREA: 'نص متعدد الأسطر للملاحظات الطويلة',
  EMAIL: 'بريد إلكتروني مع تحقق تلقائي',
  PHONE: 'رقم هاتف للتواصل',
  URL: 'رابط موقع أو صفحة',
  NUMBER: 'قيمة رقمية (كمية، عمر، …)',
  DATE: 'تاريخ (يوم / شهر / سنة)',
  TIME: 'وقت (ساعة ودقيقة)',
  DATETIME: 'تاريخ ووقت معاً',
  SELECT: 'قائمة منسدلة بخيارات محددة',
  MULTISELECT: 'اختيار أكثر من خيار من قائمة',
  RADIO: 'اختيار خيار واحد من عدة خيارات',
  CHECKBOX: 'موافقة أو تأكيد بسيط',
  TOGGLE: 'مفتاح تشغيل/إيقاف (نعم/لا)',
  YES_NO: 'اختيار سريع بين نعم ولا',
  LEGAL_CONSENT: 'موافقة على الشروط مع رابط',
  IRAQ_GOVERNORATE: 'قائمة محافظات العراق',
  FILE: 'رفع مستند أو صورة',
  SIGNATURE: 'توقيع رقمي على الشاشة',
  MATRIX: 'جدول أسئلة (صف × عمود)',
  RANKING: 'ترتيب الخيارات حسب الأولوية',
  RATING: 'تقييم بالنجوم أو النقاط',
  SCALE: 'مقياس من رقم إلى رقم',
  NPS: 'مقياس توصية 0–10 (NPS)',
  IMAGE: 'صورة توضيحية داخل النموذج',
  HEADING: 'عنوان قسم داخل النموذج',
  PARAGRAPH: 'نص توضيحي بدون إدخال',
  DIVIDER: 'خط فاصل بين الأقسام',
  RECAPTCHA: 'حماية من الإرسال الآلي (Turnstile)',
  RESPONDENT_COUNTRY: 'بلد المستجيب يُكتشف تلقائياً من IP',
};

const FIELD_HELP: Record<
  WizardFieldType,
  Pick<FieldCatalogItem, 'helpText' | 'helpWhen' | 'helpExample'>
> = {
  TEXT: {
    helpText: 'حقل إدخال بسطر واحد للإجابات القصيرة مثل الاسم أو المدينة.',
    helpWhen: 'عندما تحتاج إجابة مختصرة بدون تفاصيل طويلة.',
    helpExample: '«ما اسم شركتك؟»',
  },
  TEXTAREA: {
    helpText: 'مساحة نصية بعدة أسطر للملاحظات والتعليقات المفصّلة.',
    helpWhen: 'عندما تتوقع إجابة طويلة أو شرحاً مفتوحاً.',
    helpExample: '«صف مشكلتك بالتفصيل»',
  },
  EMAIL: {
    helpText: 'حقل بريد مع تحقق تلقائي من صحة التنسيق.',
    helpWhen: 'للتواصل، إرسال تأكيد، أو متابعة الطلبات.',
    helpExample: '«بريدك للرد عليك»',
  },
  PHONE: {
    helpText: 'حقل لرقم الهاتف أو الجوال للتواصل المباشر.',
    helpWhen: 'عند الحاجة للاتصال أو إرسال رسائل قصيرة.',
    helpExample: '«رقم واتساب للتنسيق»',
  },
  URL: {
    helpText: 'حقل لرابط موقع أو صفحة مع تحقق من التنسيق.',
    helpWhen: 'لجمع portfolio، GitHub، أو رابط متجر.',
    helpExample: '«رابط موقعك الشخصي»',
  },
  NUMBER: {
    helpText: 'حقل يقبل أرقاماً فقط (كميات، أعمار، أسعار…).',
    helpWhen: 'عندما تكون الإجابة رقماً وليس نصاً.',
    helpExample: '«كم عدد المشاركين؟»',
  },
  DATE: {
    helpText: 'منتقي تاريخ (يوم، شهر، سنة).',
    helpWhen: 'للمواعيد، تاريخ الميلاد، أو موعد الحضور.',
    helpExample: '«تاريخ الفعالية»',
  },
  TIME: {
    helpText: 'منتقي وقت (ساعة ودقيقة).',
    helpWhen: 'لتحديد ساعة محددة دون تاريخ.',
    helpExample: '«وقت بدء الجلسة»',
  },
  DATETIME: {
    helpText: 'تاريخ ووقت معاً في حقل واحد.',
    helpWhen: 'للحجوزات أو المواعيد الدقيقة.',
    helpExample: '«موعد المقابلة»',
  },
  SELECT: {
    helpText: 'قائمة منسدلة يختار منها الزائر خياراً واحداً من قائمة محددة.',
    helpWhen: 'عند وجود خيارات كثيرة ولا تريد عرضها كلها دفعة واحدة.',
    helpExample: '«اختر مدينتك»',
  },
  MULTISELECT: {
    helpText: 'قائمة يسمح باختيار أكثر من خيار في آن واحد.',
    helpWhen: 'عندما يمكن للزائر اختيار عدة اهتمامات أو خدمات.',
    helpExample: '«ما المجالات التي تهمك؟»',
  },
  RADIO: {
    helpText: 'أزرار اختيار لخيار واحد فقط من بين عدة خيارات ظاهرة.',
    helpWhen: 'عند وجود 2–6 خيارات وتريد أن يراها الزائر كلها.',
    helpExample: '«طريقة التواصل المفضلة: بريد / هاتف / واتساب»',
  },
  CHECKBOX: {
    helpText: 'خانة واحدة للموافقة أو التأكيد (نعم/لا).',
    helpWhen: 'للموافقة على الشروط أو تأكيد معلومة.',
    helpExample: '«أوافق على سياسة الخصوصية»',
  },
  TOGGLE: {
    helpText: 'مفتاح تشغيل/إيقاف — أوضح من خانة الموافقة للإعدادات.',
    helpWhen: 'لتفعيل خيار أو الموافقة على إعداد.',
    helpExample: '«أرغب بتلقي التحديثات»',
  },
  YES_NO: {
    helpText: 'زرّان واضحان: نعم أو لا.',
    helpWhen: 'للأسئلة الثنائية البسيطة.',
    helpExample: '«هل أنت موظف حالي؟»',
  },
  LEGAL_CONSENT: {
    helpText: 'خانة موافقة مع نص قانوني ورابط للشروط.',
    helpWhen: 'للتسجيل وجمع البيانات الشخصية.',
    helpExample: '«أوافق على سياسة الخصوصية»',
  },
  IRAQ_GOVERNORATE: {
    helpText: 'قائمة بمحافظات العراق الـ 18.',
    helpWhen: 'للتوصيل، الفعاليات، أو التحليل الجغرافي.',
    helpExample: '«محافظة إقامتك»',
  },
  FILE: {
    helpText: 'رفع ملف (PDF، صورة، مستند…) من جهاز الزائر.',
    helpWhen: 'للسيرة الذاتية، المرفقات، أو إثبات الدفع.',
    helpExample: '«ارفع السيرة الذاتية»',
  },
  SIGNATURE: {
    helpText: 'لوحة توقيع يرسم عليها الزائر توقيعه.',
    helpWhen: 'للموافقات الرسمية أو العقود.',
    helpExample: '«وقّع هنا»',
  },
  MATRIX: {
    helpText: 'جدول يقيّم عدة عناصر على نفس المقياس.',
    helpWhen: 'لاستبيانات تفصيلية بعدة معايير.',
    helpExample: '«قيّم كل خدمة من 1 إلى 5»',
  },
  RANKING: {
    helpText: 'ترتيب قائمة خيارات من الأهم للأقل.',
    helpWhen: 'لمعرفة الأولويات.',
    helpExample: '«رتّب الميزات حسب أهميتها»',
  },
  RECAPTCHA: {
    helpText: 'حماية من الإرسال الآلي (spam).',
    helpWhen: 'للنماذج العامة المعرّضة للبوتات.',
    helpExample: '—',
  },
  RESPONDENT_COUNTRY: {
    helpText:
      'يُسجّل بلد المستجيب تلقائياً عند الإرسال بناءً على IP — بدون حقل ظاهر.',
    helpWhen: 'لمعرفة من أي دولة تأتي الإجابات في التحليلات والتصدير.',
    helpExample: '«العراق» يظهر في بيانات الإرسال',
  },
  RATING: {
    helpText: 'تقييم بالنجوم أو النقاط لقياس الرضا أو الجودة.',
    helpWhen: 'لاستطلاعات الرأي وتقييم الخدمة أو المنتج.',
    helpExample: '«قيّم تجربتك من 1 إلى 5»',
  },
  SCALE: {
    helpText: 'مقياس رقمي متدرج بين حدّين (مثل 1–10).',
    helpWhen: 'لقياس درجة الموافقة أو الأولوية بدقة أكبر من التقييم البسيط.',
    helpExample: '«إلى أي مدى رضيت عن الخدمة؟»',
  },
  NPS: {
    helpText: 'مقياس توصية ثابت من 0 إلى 10 مع تحليلات NPS.',
    helpWhen: 'لقياس رضا العملاء والتوصية.',
    helpExample: '«ما مدى احتمال أن توصي بنا؟»',
  },
  IMAGE: {
    helpText: 'عرض صورة من رابط داخل النموذج.',
    helpWhen: 'للشعارات، التعليمات البصرية، أو العروض.',
    helpExample: 'شعار الفعالية أو مخطط توضيحي',
  },
  HEADING: {
    helpText: 'عنوان قسم لتنظيم النموذج ولا يطلب إدخالاً من الزائر.',
    helpWhen: 'لفصل أقسام النموذج (معلومات شخصية، تفاصيل الطلب…).',
    helpExample: '«معلومات التواصل»',
  },
  PARAGRAPH: {
    helpText: 'نص توضيحي أو تعليمات بدون حقل إدخال.',
    helpWhen: 'لشرح ما يُطلب في القسم التالي أو إضافة ملاحظات.',
    helpExample: '«يرجى تعبئة البيانات بدقة لتسريع المعالجة»',
  },
  DIVIDER: {
    helpText: 'خط فاصل بصري بين أقسام النموذج.',
    helpWhen: 'لفصل مجموعات الحقول بصرياً دون نص.',
    helpExample: '— بين «البيانات الشخصية» و«تفاصيل الطلب»',
  },
};

const FIELD_ICONS: Record<WizardFieldType, LucideIcon> = {
  TEXT: Type,
  TEXTAREA: AlignLeft,
  EMAIL: Mail,
  PHONE: Phone,
  URL: Link2,
  NUMBER: Hash,
  DATE: Calendar,
  TIME: Clock,
  DATETIME: CalendarClock,
  SELECT: List,
  MULTISELECT: ListChecks,
  RADIO: CircleDot,
  CHECKBOX: CheckSquare,
  TOGGLE: ToggleLeft,
  YES_NO: ThumbsUp,
  LEGAL_CONSENT: FileCheck,
  IRAQ_GOVERNORATE: MapPin,
  FILE: Paperclip,
  SIGNATURE: PenLine,
  MATRIX: Grid3x3,
  RANKING: ListOrdered,
  RATING: Star,
  SCALE: SlidersHorizontal,
  NPS: SlidersHorizontal,
  RECAPTCHA: ShieldCheck,
  RESPONDENT_COUNTRY: Globe,
  HEADING: Heading,
  PARAGRAPH: Text,
  DIVIDER: Minus,
  IMAGE: Image,
};

const FIELD_CATEGORY_MAP: Record<WizardFieldType, FieldCatalogCategoryId> = {
  TEXT: 'input',
  TEXTAREA: 'input',
  EMAIL: 'input',
  PHONE: 'input',
  URL: 'input',
  NUMBER: 'input',
  DATE: 'input',
  TIME: 'input',
  DATETIME: 'input',
  FILE: 'input',
  SIGNATURE: 'input',
  MATRIX: 'rating',
  RANKING: 'choice',
  SELECT: 'choice',
  MULTISELECT: 'choice',
  RADIO: 'choice',
  CHECKBOX: 'choice',
  TOGGLE: 'choice',
  YES_NO: 'choice',
  LEGAL_CONSENT: 'choice',
  IRAQ_GOVERNORATE: 'input',
  RATING: 'rating',
  SCALE: 'rating',
  NPS: 'rating',
  RECAPTCHA: 'layout',
  RESPONDENT_COUNTRY: 'input',
  HEADING: 'layout',
  PARAGRAPH: 'layout',
  DIVIDER: 'layout',
  IMAGE: 'layout',
};

/** أنواع مقترحة حسب نوع النموذج */
const SUGGESTED_BY_FORM_TYPE: Record<FormType, WizardFieldType[]> = {
  CONTACT: ['TEXT', 'EMAIL', 'PHONE', 'TEXTAREA', 'URL'],
  SURVEY: ['NPS', 'SCALE', 'RADIO', 'MULTISELECT', 'TEXTAREA', 'RATING'],
  REGISTRATION: ['TEXT', 'EMAIL', 'PHONE', 'IRAQ_GOVERNORATE', 'LEGAL_CONSENT', 'DATE', 'SELECT'],
  ORDER: ['TEXT', 'NUMBER', 'TEXTAREA', 'FILE'],
  FEEDBACK: ['RATING', 'TEXTAREA', 'SCALE'],
  QUIZ: ['HEADING', 'TEXT', 'RADIO'],
  APPLICATION: ['TEXT', 'EMAIL', 'TEXTAREA', 'FILE', 'DATE'],
  OTHER: ['TEXT', 'TEXTAREA', 'EMAIL'],
};

export const FIELD_CATALOG_ITEMS: FieldCatalogItem[] = WIZARD_ADDABLE_FIELD_TYPES.map(
  (type) => ({
    type,
    label: WIZARD_FIELD_TYPE_LABELS[type],
    description: FIELD_DESCRIPTIONS[type],
    ...FIELD_HELP[type],
    category: FIELD_CATEGORY_MAP[type],
    icon: FIELD_ICONS[type],
  }),
);

export function getSuggestedFieldTypes(formType: FormType): WizardFieldType[] {
  return SUGGESTED_BY_FORM_TYPE[formType] ?? SUGGESTED_BY_FORM_TYPE.OTHER;
}

export function getFieldCatalogItem(
  type: WizardFieldType,
): FieldCatalogItem | undefined {
  return FIELD_CATALOG_ITEMS.find((item) => item.type === type);
}

export function filterCatalogItems(
  items: FieldCatalogItem[],
  options: {
    category: FieldCatalogCategoryId;
    search: string;
    formType: FormType;
  },
): FieldCatalogItem[] {
  const q = options.search.trim().toLowerCase();
  let list = items;

  if (options.category === 'suggested') {
    const suggested = new Set(getSuggestedFieldTypes(options.formType));
    list = list.filter((item) => suggested.has(item.type));
  } else if (options.category !== 'all') {
    list = list.filter((item) => item.category === options.category);
  }

  if (!q) return list;

  return list.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.helpText.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q),
  );
}
