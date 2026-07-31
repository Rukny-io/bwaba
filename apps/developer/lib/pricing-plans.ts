/**
 * بيانات الأسعار لبوابة المطوّرين — Free + Pro + فوترة الاستخدام
 * الأسعار متوافقة مع apps/api DEVELOPER_PRO_PRICING
 */

export type PlanId = 'free' | 'pro';
export type BillingPeriod = 'monthly' | 'yearly';

export const CURRENCY = 'د.ع';
export const CURRENCY_EN = 'IQD';
export const YEARLY_DISCOUNT_PERCENT = 17;

export interface PricingPlan {
  id: PlanId;
  name: string;
  nameEn: string;
  badge?: string;
  popular?: boolean;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  ctaLabel: string;
  highlights: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'مجاني',
    nameEn: 'Free',
    description:
      'ابدأ التكامل مع WhatsApp API بدون اشتراك شهري. تدفع فقط على الرسائل من محفظة التطبيق.',
    priceMonthly: 0,
    priceYearly: 0,
    ctaLabel: 'ابدأ مجاناً',
    highlights: [
      'حتى 10 تطبيقات',
      '5 مفاتيح API لكل حساب',
      'رسائل WhatsApp — فوترة حسب الاستخدام',
      'Webhook واحد لكل تطبيق (حتى 3)',
      'سجلات 14 يوماً',
      '60 طلب API / دقيقة',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    nameEn: 'Pro',
    badge: 'للإنتاج',
    popular: true,
    description:
      'سقوف مفتوحة للتطبيقات والمفاتيح والتكاملات. نفس نموذج الدفع حسب الاستخدام للرسائل.',
    priceMonthly: 43_500,
    priceYearly: 435_000,
    ctaLabel: 'اشترك في Pro',
    highlights: [
      'كل مزايا المجاني، بالإضافة إلى:',
      'تطبيقات غير محدودة',
      'مفاتيح API غير محدودة',
      'أرقام WhatsApp و Webhooks بلا حد عملي',
      'سجلات 365 يوماً',
      '300 طلب API / دقيقة',
      'دعم أولوية ومزامنة القوالب',
    ],
  },
];

export type CellValue = boolean | string;

export interface FeatureRow {
  label: string;
  hint?: string;
  values: Record<PlanId, CellValue>;
}

export interface FeatureSection {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  rows: FeatureRow[];
}

export const FEATURE_SECTIONS: FeatureSection[] = [
  {
    id: 'platform',
    eyebrow: 'Platform',
    title: 'التطبيقات ومفاتيح API',
    description: 'إدارة تطبيقاتك ومفاتيح الوصول من لوحة المطوّر.',
    rows: [
      {
        label: 'عدد التطبيقات',
        values: { free: '10', pro: 'غير محدود' },
      },
      {
        label: 'مفاتيح API',
        values: { free: '5', pro: 'غير محدود' },
      },
      {
        label: 'صلاحيات دقيقة (Scopes)',
        values: { free: true, pro: true },
      },
      {
        label: 'بيئة اختبار + إنتاج',
        values: { free: true, pro: true },
      },
    ],
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp والرسائل',
    description: 'الرسائل تُفوتر من محفظة التطبيق — بدون حد شهري على الاشتراك.',
    rows: [
      {
        label: 'إرسال رسائل API',
        values: { free: true, pro: true },
      },
      {
        label: 'نموذج الفوترة',
        hint: 'حسب فئة المحادثة (Meta + هامش المنصة)',
        values: { free: 'حسب الاستخدام', pro: 'حسب الاستخدام' },
      },
      {
        label: 'رسائل الخدمة (Service)',
        hint: 'أول 1000 محادثة/شهر مجاناً من Meta',
        values: { free: true, pro: true },
      },
      {
        label: 'أرقام WhatsApp Business',
        values: { free: '1', pro: 'غير محدود' },
      },
      {
        label: 'مزامنة القوالب',
        values: { free: false, pro: true },
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Webhooks والتكامل',
    rows: [
      {
        label: 'Webhooks',
        values: { free: '3', pro: 'غير محدود' },
      },
      {
        label: 'جهات اتصال',
        values: { free: '1,000', pro: 'غير محدود' },
      },
      {
        label: 'قائمة IP مسموحة',
        values: { free: true, pro: true },
      },
      {
        label: 'توثيق API تفاعلي',
        values: { free: true, pro: true },
      },
    ],
  },
  {
    id: 'ops',
    title: 'الأداء والدعم',
    rows: [
      {
        label: 'طلبات API / دقيقة',
        values: { free: '60', pro: '300' },
      },
      {
        label: 'احتفاظ بالسجلات',
        values: { free: '14 يوم', pro: '365 يوم' },
      },
      {
        label: 'أولوية الطوابير',
        values: { free: 'عادية', pro: 'عالية' },
      },
      {
        label: 'دعم مخصص',
        values: { free: false, pro: true },
      },
    ],
  },
];

export const USAGE_RATES = [
  {
    id: 'authentication',
    label: 'Authentication',
    description: 'OTP & verification',
    price: 12,
  },
  {
    id: 'utility',
    label: 'Utility',
    description: 'Transactional updates',
    price: 15,
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Promotions & campaigns',
    price: 60,
  },
  {
    id: 'service',
    label: 'Service',
    description: 'User-initiated support',
    price: 0,
    note: 'Per Meta policy · first 1k/mo free',
  },
] as const;

export const USAGE_SECTION_COPY = {
  eyebrow: 'Usage-based billing',
  title: 'Message pricing',
  subtitle:
    'Charged from your app wallet. Same rates on Free and Pro — no monthly message cap.',
  perMessage: 'per message',
  free: 'Free',
  footnote:
    'Prices include Meta conversation fees and Rukny platform margin. Billed per delivered message category.',
} as const;

export const PRICING_FAQS = [
  {
    question: 'هل الرسائل مشمولة في اشتراك Pro؟',
    answer:
      'لا. اشتراك Pro يفتح السقوف والميزات (تطبيقات، مفاتيح، webhooks…). تكلفة الرسائل تُخصم من محفظة كل تطبيق حسب الاستخدام الفعلي، في كلا الخطتين.',
  },
  {
    question: 'ما الفرق بين المجاني و Pro؟',
    answer:
      'المجاني مناسب للتجربة والمشاريع الصغيرة (حتى 10 تطبيقات و5 مفاتيح). Pro يزيل السقوف تقريباً ويرفع معدل الطلبات ومدة السجلات ويضيف دعماً أولوياً.',
  },
  {
    question: 'لدي باقة أعمال (BUSINESS) في منصة ركني — هل أحتاج Pro؟',
    answer:
      'باقات المنصة (Pro / Whale / Business) تمنحك مزايا Pro في بوابة المطوّرين تلقائياً دون اشتراك منفصل.',
  },
  {
    question: 'كيف أشحن المحفظة؟',
    answer:
      'من لوحة كل تطبيق → المحفظة. يمكنك شحن الرصيد بالدينار العراقي واستخدامه لرسائل WhatsApp.',
  },
  {
    question: 'هل يمكنني الترقية أو الإلغاء في أي وقت؟',
    answer:
      'نعم. الترقية إلى Pro فورية. عند الإلغاء تبقى على المجاني مع حدوده؛ الرصيد المتبقي في المحفظة يظل متاحاً.',
  },
];

export function formatPrice(amount: number): string {
  return amount.toLocaleString('en-US');
}

export function monthlyEquivalentFromYearly(yearly: number): number {
  return Math.round(yearly / 12);
}
