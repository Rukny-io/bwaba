import { APP_BASE } from '@/components/app/nav-config';
import { FORMS_CREATE_ENTRY_PATH } from '@/lib/forms-paths';

export type HelpCategoryId =
  | 'getting-started'
  | 'design'
  | 'publish'
  | 'submissions';

export interface HelpCategory {
  id: HelpCategoryId;
  label: string;
  description: string;
}

export interface HelpFaqLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface HelpFaqItem {
  id: string;
  category: HelpCategoryId;
  question: string;
  answer: string;
  keywords?: string[];
  links?: HelpFaqLink[];
}

export interface HelpQuickLink {
  id: string;
  href: string;
  title: string;
  description: string;
  anchor?: string;
}

export interface HelpResourceLink {
  id: string;
  href: string;
  label: string;
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'getting-started',
    label: 'البداية',
    description: 'إنشاء النموذج والمعالج',
  },
  {
    id: 'design',
    label: 'التصميم',
    description: 'قوالب، ألوان، وتخطيط',
  },
  {
    id: 'publish',
    label: 'النشر',
    description: 'المعاينة والرابط العام',
  },
  {
    id: 'submissions',
    label: 'الاستجابات',
    description: 'البيانات والتحليلات',
  },
];

export const HELP_QUICK_LINKS: HelpQuickLink[] = [
  {
    id: 'create',
    href: FORMS_CREATE_ENTRY_PATH,
    title: 'إنشاء نموذج',
    description: 'مسودة جديدة أو من قالب جاهز.',
  },
  {
    id: 'templates',
    href: `${APP_BASE}/templates`,
    title: 'قوالب جاهزة',
    description: 'استبيان، تواصل، تسجيل…',
  },
  {
    id: 'design',
    href: `${APP_BASE}/help#faq-design`,
    title: 'تخصيص التصميم',
    description: 'خط، لون، زوايا، وعرض البطاقة.',
  },
  {
    id: 'submissions',
    href: `${APP_BASE}/forms`,
    title: 'نماذجي',
    description: 'إدارة النماذج والاستجابات.',
  },
  {
    id: 'analytics',
    href: `${APP_BASE}/analytics`,
    title: 'تحليلات',
    description: 'مشاهدات وأداء النماذج.',
  },
  {
    id: 'settings',
    href: `${APP_BASE}/settings`,
    title: 'الإعدادات',
    description: 'المظهر، الإشعارات، والاختصارات.',
  },
];

export const HELP_RESOURCE_LINKS: HelpResourceLink[] = [
  { id: 'create', href: FORMS_CREATE_ENTRY_PATH, label: 'إنشاء نموذج' },
  { id: 'forms', href: `${APP_BASE}/forms`, label: 'نماذجي' },
  { id: 'templates', href: `${APP_BASE}/templates`, label: 'القوالب' },
  { id: 'analytics', href: `${APP_BASE}/analytics`, label: 'التحليلات' },
  { id: 'settings', href: `${APP_BASE}/settings`, label: 'الإعدادات' },
  { id: 'design', href: `${APP_BASE}/help#faq-design`, label: 'دليل التصميم' },
];

export const HELP_FAQ: HelpFaqItem[] = [
  {
    id: 'what-is-draft',
    category: 'getting-started',
    question: 'ما الفرق بين المسودة والنموذج المنشور؟',
    answer:
      'المسودة للتحرير والمعاينة فقط. الرابط العام لا يقبل إرسالات حتى تضغط «نشر النموذج». بعد النشر يصبح النموذج متاحاً للجميع.',
    keywords: ['مسودة', 'نشر', 'draft', 'published'],
    links: [
      { label: 'نماذجي', href: `${APP_BASE}/forms` },
      { label: 'أسئلة النشر', href: `${APP_BASE}/help#faq-publish` },
    ],
  },
  {
    id: 'wizard-steps',
    category: 'getting-started',
    question: 'ما خطوات إنشاء النموذج؟',
    answer:
      'المعالج من 4 خطوات: الأساسيات ← الحقول ← التصميم ← المعاينة والنشر. يُحفظ تلقائياً أثناء التحرير.',
    keywords: ['معالج', 'خطوات', 'wizard'],
    links: [{ label: 'إنشاء نموذج', href: FORMS_CREATE_ENTRY_PATH }],
  },
  {
    id: 'form-types',
    category: 'getting-started',
    question: 'هل نوع النموذج يؤثر على شيء؟',
    answer:
      'نوع النموذج (تواصل، استبيان، تسجيل…) يقترح حقولاً جاهزة في الخطوة الثانية. يمكنك تعديلها أو حذفها لاحقاً.',
    keywords: ['نوع', 'قالب', 'حقول'],
  },
  {
    id: 'templates',
    category: 'getting-started',
    question: 'كيف أستخدم القوالب الجاهزة؟',
    answer:
      'من قسم القوالب اختر نموذجاً — تُنشأ مسودة بحقول مسبقة. يمكنك المعاينة الكاملة ثم متابعة التحرير.',
    keywords: ['قوالب', 'templates'],
    links: [{ label: 'تصفح القوالب', href: `${APP_BASE}/templates` }],
  },
  {
    id: 'design-templates',
    category: 'design',
    question: 'ما هي قوالب التصميم؟',
    answer:
      'أربعة أنماط: بسيط، احترافي، إبداعي، داكن. كل قالب يغيّر الخلفية والبطاقة والألوان. يمكنك تخصيص الخط واللون بعد الاختيار.',
    keywords: ['تصميم', 'قالب', 'theme', 'داكن'],
    links: [{ label: 'دليل التصميم', href: `${APP_BASE}/help#faq-design` }],
  },
  {
    id: 'design-colors',
    category: 'design',
    question: 'كيف أغيّر اللون الأساسي؟',
    answer:
      'في خطوة التصميم اختر لوناً جاهزاً أو افتح منتقي الألوان. يُطبَّق على الأزرار وتركيز الحقول في النموذج المنشور.',
    keywords: ['لون', 'primary', 'color'],
  },
  {
    id: 'design-font',
    category: 'design',
    question: 'كيف أغيّر خط النموذج؟',
    answer:
      'من خطوة التصميم اختر خطاً عربياً (Cairo، Tajawal، Almarai…). يُحمَّل الخط تلقائياً ويظهر للزوار في الرابط العام.',
    keywords: ['خط', 'font', 'cairo'],
  },
  {
    id: 'design-radius',
    category: 'design',
    question: 'ما هي استدارة الزوايا؟',
    answer:
      'تتحكم في انحناء البطاقة والحقول وخيارات الاختيار — من حاد إلى كبير. جرّب «ناعم» أو «كبير» للمظهر العصري.',
    keywords: ['border', 'radius', 'زوايا', 'استدارة'],
  },
  {
    id: 'design-layout',
    category: 'design',
    question: 'ما الفرق بين ظل البطاقة ومسطح وإطار؟',
    answer:
      'ظل: بطاقة بارزة بظل خفيف. إطار: حدود واضحة. مسطح: بدون ظل — مناسب للتصاميم البسيطة.',
    keywords: ['ظل', 'بطاقة', 'card'],
  },
  {
    id: 'design-spacing',
    category: 'design',
    question: 'ما معنى المسافات (مضغوط / متوازن / فسيح)؟',
    answer:
      'يتحكم في المسافة بين الحقول داخل النموذج. «مضغوط» للنماذج الطويلة، «فسيح» لقراءة أوضح على الجوال.',
    keywords: ['مسافات', 'spacing', 'gap'],
  },
  {
    id: 'design-width',
    category: 'design',
    question: 'كيف أتحكم بعرض النموذج؟',
    answer:
      'من «عرض النموذج» اختر ضيقاً للتركيز، أو عريضاً للاستبيانات. يُطبَّق على صفحة /f/{slug} للزوار.',
    keywords: ['عرض', 'width', 'max'],
  },
  {
    id: 'preview-vs-public',
    category: 'publish',
    question: 'ما الفرق بين المعاينة الكاملة والرابط العام؟',
    answer:
      'المعاينة الكاملة للمالك — الإرسال معطّل وتطابق التصميم. الرابط العام للزوار بعد النشر ويقبل الإرسال.',
    keywords: ['معاينة', 'preview', 'رابط'],
  },
  {
    id: 'publish-how',
    category: 'publish',
    question: 'كيف أنشر النموذج؟',
    answer:
      'أكمل المعالج حتى «المعاينة والنشر» ثم اضغط «نشر النموذج». يُرسل إشعار بالبريد عند أول نشر فقط.',
    keywords: ['نشر', 'publish'],
    links: [{ label: 'إنشاء ونشر', href: FORMS_CREATE_ENTRY_PATH }],
  },
  {
    id: 'public-url',
    category: 'publish',
    question: 'أين أجد رابط النموذج للمشاركة؟',
    answer:
      'يظهر شريط «رابط النموذج» أثناء التحرير. بعد النشر شارك الرابط بصيغة /f/{slug} من نطاق Rukny العام.',
    keywords: ['رابط', 'مشاركة', 'slug'],
    links: [{ label: 'نماذجي', href: `${APP_BASE}/forms` }],
  },
  {
    id: 'close-form',
    category: 'publish',
    question: 'هل يمكن إغلاق النموذج لاحقاً؟',
    answer:
      'نعم — من صفحة تفاصيل النموذج غيّر الحالة إلى «مغلق» لوقف الإرسالات الجديدة مع الإبقاء على البيانات.',
    keywords: ['إغلاق', 'closed'],
    links: [{ label: 'نماذجي', href: `${APP_BASE}/forms` }],
  },
  {
    id: 'view-submissions',
    category: 'submissions',
    question: 'أين أرى الاستجابات؟',
    answer:
      'افتح النموذج من «نماذجي» ثم تبويب «الاستجابات». ستجد كل الإرسالات مع التاريخ والبيانات.',
    keywords: ['استجابات', 'submissions'],
    links: [{ label: 'نماذجي', href: `${APP_BASE}/forms` }],
  },
  {
    id: 'export',
    category: 'submissions',
    question: 'هل يمكن تصدير الاستجابات؟',
    answer:
      'نعم — من صفحة الاستجابات يمكنك تصدير CSV أو ربط Google Sheets حسب إعدادات النموذج.',
    keywords: ['تصدير', 'export', 'csv', 'sheets'],
  },
  {
    id: 'analytics',
    category: 'submissions',
    question: 'كيف أتابع أداء النموذج؟',
    answer:
      'من «تحليلات» أو تحليلات النموذج — مشاهدات، استجابات، والتوزيع الجغرافي عبر الزمن.',
    keywords: ['تحليلات', 'analytics', 'مشاهدات'],
    links: [{ label: 'التحليلات', href: `${APP_BASE}/analytics` }],
  },
  {
    id: 'settings-appearance',
    category: 'getting-started',
    question: 'هل إعدادات المظهر تؤثر على النموذج المنشور؟',
    answer:
      'لا — إعدادات المظهر في لوحة Forms (فاتح/داكن) للوحة التحكم فقط. تصميم النموذج للزوار يُضبط من خطوة التصميم.',
    keywords: ['مظهر', 'dark', 'theme'],
    links: [{ label: 'الإعدادات', href: `${APP_BASE}/settings` }],
  },
];

export const HELP_CONTACT = {
  email: 'support@rukny.io',
  emailSubject: 'دعم Forms — Rukny',
  responseHint: 'نرد عادة خلال 24–48 ساعة في أيام العمل.',
  docsUrl: 'https://rukny.io',
} as const;

export function normalizeHelpQuery(q: string): string {
  return q.trim().toLowerCase();
}

export function filterHelpFaq(
  items: HelpFaqItem[],
  query: string,
  category: HelpCategoryId | 'all',
): HelpFaqItem[] {
  const nq = normalizeHelpQuery(query);

  return items.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (!nq) return true;

    const haystack = [
      item.question,
      item.answer,
      ...(item.keywords ?? []),
      ...(item.links?.map((l) => l.label) ?? []),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(nq);
  });
}

export function getHelpCategoryMeta(id: HelpCategoryId): HelpCategory {
  return HELP_CATEGORIES.find((c) => c.id === id)!;
}
