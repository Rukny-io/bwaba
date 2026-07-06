/**
 * Shared pricing data for Rukny marketing surfaces (forms + public).
 * Single source of truth — mirrors apps/api PLAN_LIMITS / PLAN_PRICES.
 *
 * Presentation-ready: values are pre-formatted Arabic strings or booleans so
 * each app only renders, never computes plan logic here.
 */

export type PlanId = 'free' | 'pro' | 'whale' | 'business';
export type BillingPeriod = 'monthly' | 'yearly';

export const CURRENCY = 'د.ع';
export const YEARLY_DISCOUNT_PERCENT = 20;

export interface PricingPlan {
  id: PlanId;
  /** Arabic display name shown on the card */
  name: string;
  /** Short English label for accessibility / eyebrow */
  nameEn: string;
  /** Optional badge text (e.g. الأكثر شيوعاً) */
  badge?: string;
  popular?: boolean;
  description: string;
  /** Monthly price in IQD (0 = free) */
  priceMonthly: number;
  /** Full yearly price in IQD (0 = free) */
  priceYearly: number;
  ctaLabel: string;
  highlights: string[];
}

/** Prices in IQD — mirrors apps/api PLAN_PRICES. */
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'مجاني',
    nameEn: 'Free',
    description: 'البداية المثالية لمشروعك الشخصي أو لتجربة المنصة. مجاني للأبد.',
    priceMonthly: 0,
    priceYearly: 0,
    ctaLabel: 'ابدأ مجاناً',
    highlights: [
      'نماذج واستجابات غير محدودة',
      'تكامل Google Sheets و Drive',
      'Webhooks وربط خارجي',
      'تحليلات أساسية للنماذج',
      'متجر بحدود مناسبة للبداية',
      'مساحة تخزين 5 جيجابايت',
    ],
  },
  {
    id: 'pro',
    name: 'بلس',
    nameEn: 'Plus',
    badge: 'الأكثر شيوعاً',
    popular: true,
    description: 'كل ما تحتاجه لبناء نماذج احترافية وتنمية عملك.',
    priceMonthly: 15_000,
    priceYearly: 144_000,
    ctaLabel: 'اشترك في بلس',
    highlights: [
      'كل مزايا المجاني، بالإضافة إلى:',
      'نماذج متعددة الخطوات',
      'منطق شرطي أساسي',
      'التحقق من البريد والهاتف (OTP)',
      'إزالة العلامة المائية',
      'تكامل إنستغرام ويوتيوب',
      'مساحة 50 جيجابايت ودعم خلال 24 ساعة',
    ],
  },
  {
    id: 'whale',
    name: 'الحوت',
    nameEn: 'Whale',
    description: 'للفرق المتنامية التي تحتاج تحليلات وتكاملات أعمق.',
    priceMonthly: 20_000,
    priceYearly: 192_000,
    ctaLabel: 'اشترك في الحوت',
    highlights: [
      'كل مزايا بلس، بالإضافة إلى:',
      'منطق شرطي متقدّم',
      'تحليلات متقدمة وتصدير CSV',
      'منتجات رقمية ومتجر ثنائي اللغة',
      'تكامل Google Calendar و LinkedIn',
      'كشف النشاط المشبوه والأجهزة الموثوقة',
      'مساحة 100 جيجابايت ودعم خلال 12 ساعة',
    ],
  },
  {
    id: 'business',
    name: 'الأعمال',
    nameEn: 'Business',
    description: 'أقصى أداء وتحكم وأمان للمؤسسات والفرق الكبيرة.',
    priceMonthly: 30_000,
    priceYearly: 288_000,
    ctaLabel: 'اشترك في الأعمال',
    highlights: [
      'كل مزايا الحوت، بالإضافة إلى:',
      'منطق شرطي كامل',
      'تحليلات كاملة + تصدير PDF',
      'كل التكاملات (Telegram و Google Analytics)',
      'Custom domains',
      'مقارنة الفترات الزمنية',
      'مساحة 250 جيجابايت ودعم فوري',
    ],
  },
];

/**
 * Comparison cell:
 * - `true`  → included (check mark)
 * - `false` → not available (dash)
 * - string  → custom value (e.g. "30 يوم", "متقدّم")
 */
export type CellValue = boolean | string;

export interface FeatureRow {
  label: string;
  hint?: string;
  values: Record<PlanId, CellValue>;
}

export interface FeatureSection {
  id: string;
  /** Short uppercase category tag shown above the section title (Vercel-style eyebrow) */
  eyebrow?: string;
  title: string;
  description?: string;
  rows: FeatureRow[];
}

const UNLIMITED = 'غير محدود';

/** Detailed feature matrix — mirrors apps/api PLAN_LIMITS. */
export const FEATURE_SECTIONS: FeatureSection[] = [
  {
    id: 'forms',
    eyebrow: 'الأساسيات',
    title: 'النماذج',
    description: 'إنشاء النماذج وجمع الاستجابات وتخصيصها.',
    rows: [
      {
        label: 'عدد النماذج',
        values: { free: UNLIMITED, pro: UNLIMITED, whale: UNLIMITED, business: UNLIMITED },
      },
      {
        label: 'الحقول لكل نموذج',
        values: { free: UNLIMITED, pro: UNLIMITED, whale: UNLIMITED, business: UNLIMITED },
      },
      {
        label: 'الاستجابات شهرياً',
        values: { free: UNLIMITED, pro: UNLIMITED, whale: UNLIMITED, business: UNLIMITED },
      },
      {
        label: 'صورة غلاف للنموذج',
        values: { free: true, pro: true, whale: true, business: true },
      },
      {
        label: 'نماذج متعددة الخطوات',
        values: { free: false, pro: true, whale: true, business: true },
      },
      {
        label: 'شريط تمرير متعدد',
        values: { free: false, pro: true, whale: true, business: true },
      },
      {
        label: 'المنطق الشرطي',
        hint: 'إظهار/إخفاء الحقول بناءً على إجابات سابقة',
        values: { free: false, pro: 'أساسي', whale: 'متقدّم', business: 'كامل' },
      },
      {
        label: 'التحقق من البريد (OTP)',
        values: { free: false, pro: true, whale: true, business: true },
      },
      {
        label: 'التحقق من الهاتف (WhatsApp)',
        values: { free: false, pro: true, whale: true, business: true },
      },
      {
        label: 'تكامل Google Sheets',
        values: { free: true, pro: true, whale: true, business: true },
      },
      {
        label: 'تكامل Google Drive',
        values: { free: true, pro: true, whale: true, business: true },
      },
      {
        label: 'Webhooks',
        values: { free: true, pro: true, whale: true, business: true },
      },
      {
        label: 'تحليلات النماذج',
        values: { free: 'أساسي', pro: 'أساسي', whale: 'متقدّم', business: 'كامل' },
      },
      {
        label: 'فريق العمل',
        hint: 'دعوة أعضاء وتحديد صلاحيات الوصول',
        values: { free: false, pro: '2 أعضاء', whale: '5 أعضاء', business: '15 عضو' },
      },
    ],
  },
  {
    id: 'store',
    eyebrow: 'المبيعات',
    title: 'المتجر',
    description: 'بيع المنتجات وإدارة الطلبات.',
    rows: [
      {
        label: 'المتجر الإلكتروني',
        values: { free: true, pro: true, whale: true, business: true },
      },
      {
        label: 'المنتجات والطلبات',
        values: { free: UNLIMITED, pro: UNLIMITED, whale: UNLIMITED, business: UNLIMITED },
      },
      {
        label: 'صور لكل منتج',
        values: { free: '3', pro: '8', whale: UNLIMITED, business: UNLIMITED },
      },
      {
        label: 'الفئات',
        values: { free: '5', pro: '15', whale: UNLIMITED, business: UNLIMITED },
      },
      {
        label: 'كوبونات الخصم',
        values: { free: false, pro: '5', whale: UNLIMITED, business: UNLIMITED },
      },
      {
        label: 'قائمة الأمنيات',
        values: { free: false, pro: true, whale: true, business: true },
      },
      {
        label: 'تقييمات المنتجات',
        values: { free: false, pro: true, whale: true, business: true },
      },
      {
        label: 'المنتجات المميزة',
        values: { free: false, pro: true, whale: true, business: true },
      },
      {
        label: 'المنتجات الرقمية',
        values: { free: false, pro: false, whale: true, business: true },
      },
      {
        label: 'منتجات ثنائية اللغة',
        values: { free: false, pro: false, whale: true, business: true },
      },
      {
        label: 'تحليلات المتجر',
        values: { free: false, pro: 'أساسي', whale: 'متقدّم', business: 'كامل' },
      },
    ],
  },
  {
    id: 'analytics',
    eyebrow: 'القياس',
    title: 'التحليلات',
    description: 'تتبّع الأداء وفهم جمهورك.',
    rows: [
      {
        label: 'مدة حفظ البيانات',
        values: { free: '7 أيام', pro: '30 يوم', whale: '90 يوم', business: UNLIMITED },
      },
      {
        label: 'تحليلات الأجهزة',
        values: { free: false, pro: true, whale: true, business: true },
      },
      {
        label: 'تحليلات الدول',
        values: { free: false, pro: '5 دول', whale: '8 دول', business: 'كل الدول' },
      },
      {
        label: 'مصادر الزيارات',
        values: { free: false, pro: false, whale: true, business: true },
      },
      {
        label: 'مقارنة الفترات الزمنية',
        values: { free: false, pro: false, whale: false, business: true },
      },
      {
        label: 'تصدير التقارير',
        values: { free: false, pro: false, whale: 'CSV', business: 'CSV + PDF' },
      },
    ],
  },
  {
    id: 'integrations',
    eyebrow: 'الربط',
    title: 'التكاملات',
    description: 'اربط ركني بأدواتك المفضلة.',
    rows: [
      {
        label: 'إنستغرام',
        values: { free: false, pro: true, whale: true, business: true },
      },
      {
        label: 'يوتيوب',
        values: { free: false, pro: 'قناة واحدة', whale: 'كل القنوات', business: 'كل القنوات' },
      },
      {
        label: 'LinkedIn',
        values: { free: false, pro: false, whale: 'بطاقة', business: 'بطاقة + منشور' },
      },
      {
        label: 'Google Calendar',
        values: { free: false, pro: false, whale: true, business: true },
      },
      {
        label: 'Google Analytics',
        values: { free: false, pro: false, whale: false, business: true },
      },
      {
        label: 'Telegram',
        values: { free: false, pro: false, whale: false, business: true },
      },
    ],
  },
  {
    id: 'storage-links',
    eyebrow: 'الأدوات',
    title: 'التخزين والروابط',
    description: 'مساحة الملفات وأدوات الروابط.',
    rows: [
      {
        label: 'مساحة التخزين',
        values: { free: '1 جيجابايت', pro: '3 جيجابايت', whale: '7 جيجابايت', business: '15 جيجابايت' },
      },
      {
        label: 'مجموعات الروابط',
        values: { free: false, pro: '10', whale: UNLIMITED, business: UNLIMITED },
      },
      {
        label: 'روابط قصيرة مخصصة',
        values: { free: false, pro: false, whale: true, business: true },
      },
      {
        label: 'رمز QR مخصص',
        values: { free: false, pro: true, whale: true, business: true },
      },
      {
        label: 'إزالة العلامة المائية',
        values: { free: false, pro: true, whale: true, business: true },
      },
    ],
  },
  {
    id: 'security',
    eyebrow: 'الحماية',
    title: 'الأمان',
    description: 'حماية حسابك وبياناتك.',
    rows: [
      {
        label: 'الجلسات المتزامنة',
        values: { free: '3', pro: '5', whale: '10', business: UNLIMITED },
      },
      {
        label: 'المصادقة الثنائية',
        values: { free: true, pro: true, whale: true, business: true },
      },
      {
        label: 'سجل الأمان',
        values: { free: false, pro: '30 يوم', whale: 'كامل', business: 'كامل' },
      },
      {
        label: 'كشف النشاط المشبوه',
        values: { free: false, pro: false, whale: true, business: true },
      },
      {
        label: 'الأجهزة الموثوقة',
        values: { free: false, pro: false, whale: true, business: true },
      },
      {
        label: 'حظر عناوين IP',
        values: { free: false, pro: false, whale: false, business: true },
      },
    ],
  },
  {
    id: 'notifications',
    eyebrow: 'التنبيهات',
    title: 'الإشعارات',
    description: 'تنبيهات فورية لك ولعملائك.',
    rows: [
      {
        label: 'إشعارات المتصفح (Push)',
        values: { free: true, pro: true, whale: true, business: true },
      },
      {
        label: 'إشعارات WhatsApp للعملاء',
        values: { free: true, pro: true, whale: true, business: true },
      },
      {
        label: 'إشعارات Telegram',
        values: { free: false, pro: false, whale: false, business: true },
      },
    ],
  },
  {
    id: 'support',
    eyebrow: 'المساعدة',
    title: 'الدعم',
    description: 'سرعة الاستجابة لطلبات الدعم.',
    rows: [
      {
        label: 'زمن الاستجابة',
        values: {
          free: 'خلال 48 ساعة',
          pro: 'خلال 24 ساعة',
          whale: 'خلال 12 ساعة',
          business: 'خلال 4 ساعات',
        },
      },
    ],
  },
];

export interface PricingFaq {
  question: string;
  answer: string;
}

export const PRICING_FAQS: PricingFaq[] = [
  {
    question: 'أي باقة تناسبني؟',
    answer:
      'الباقة المجانية مثالية للأفراد والمشاريع الشخصية. باقة بلس للمحترفين وأصحاب الأعمال الصغيرة، والحوت للفرق المتنامية، والأعمال للمؤسسات التي تحتاج أقصى أداء وأماناً.',
  },
  {
    question: 'هل يمكنني تغيير باقتي لاحقاً؟',
    answer:
      'نعم، يمكنك الترقية أو التخفيض في أي وقت من إعدادات حسابك، وسيتم احتساب الفرق تلقائياً.',
  },
  {
    question: 'ما الفرق بين الدفع الشهري والسنوي؟',
    answer:
      `الدفع السنوي يوفّر لك نحو ${YEARLY_DISCOUNT_PERCENT}% مقارنة بالدفع الشهري، ويُحتسب دفعة واحدة عن السنة كاملة.`,
  },
  {
    question: 'هل أحتاج بطاقة ائتمان للبدء؟',
    answer:
      'لا، يمكنك البدء بالباقة المجانية فوراً دون أي بطاقة. تحتاج وسيلة دفع فقط عند الترقية لباقة مدفوعة.',
  },
  {
    question: 'هل الأسعار شاملة لكل المنتجات؟',
    answer:
      'نعم، تشمل كل باقة النماذج والمتجر والروابط والتحليلات والتكاملات ضمن الحدود الموضّحة في جدول المقارنة.',
  },
  {
    question: 'بأي عملة تُحتسب الأسعار؟',
    answer: 'جميع الأسعار بالدينار العراقي (د.ع).',
  },
];

/** Format an IQD amount with thousands separators, e.g. 15000 → "15,000". */
export function formatPrice(amount: number): string {
  return amount.toLocaleString('en-US');
}

/** Per-month price when billed yearly (yearly total ÷ 12), rounded. */
export function monthlyEquivalentFromYearly(yearly: number): number {
  return Math.round(yearly / 12);
}

/** Price shown for a plan given the selected billing period. */
export function planPrice(plan: PricingPlan, period: BillingPeriod): number {
  return period === 'yearly' ? plan.priceYearly : plan.priceMonthly;
}
