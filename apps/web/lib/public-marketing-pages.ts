import {
  BarChart3,
  BrainCircuit,
  ClipboardList,
  ShoppingBag,
  UserCircle2,
  type LucideIcon,
} from 'lucide-react';
import { productTints } from '@/lib/public-antigravity-theme';
import { siteUrls } from '@/lib/site-urls';

export type ProductSlug = 'stores' | 'forms' | 'profile' | 'analytics' | 'ai';

export type ProductFeature = {
  title: string;
  description: string;
  icon?: string;
};

export type ProductDetailSection = {
  eyebrow?: string;
  title: string;
  titleMuted?: string;
  items: ProductFeature[];
};

export type ProductWorkflowStep = {
  title: string;
  description: string;
};

export type ProductPageContent = {
  slug: ProductSlug;
  eyebrow: string;
  title: string;
  headline: string;
  headlineMuted: string;
  description: string;
  icon: LucideIcon;
  tint: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCta?: { label: string; href: string };
  features: ProductFeature[];
  highlights: string[];
  detailSections?: ProductDetailSection[];
  workflowSteps?: ProductWorkflowStep[];
  workflowEyebrow?: string;
  workflowTitle?: string;
  workflowTitleMuted?: string;
  showcaseDescription?: string;
  badge?: string;
};

export const PRODUCT_PAGES: Record<ProductSlug, ProductPageContent> = {
  stores: {
    slug: 'stores',
    eyebrow: 'المتجر',
    title: 'المتاجر الإلكترونية',
    headline: 'متجرك يبيع',
    headlineMuted: ' رقمياً وماديّاً',
    description:
      'منتجات رقمية تُسلّم فوراً، ومنتجات مادية تُشحن للعميل — مع بوابة دفع آمنة، تخصيصات مرنة، وإدارة كاملة من لوحة واحدة.',
    icon: ShoppingBag,
    tint: productTints.stores,
    ctaLabel: 'أنشئ متجرك',
    ctaHref: siteUrls.accounts,
    secondaryCta: { label: 'عرض الأسعار', href: '/pricing' },
    features: [
      {
        title: 'ثلاثة أنواع من المنتجات',
        description:
          'ماديّة تُلمس وتُشحن، رقمية تُسلّم بعد الدفع، وخدمات بدون مخزون — كل نوع بحقوله المناسبة.',
        icon: 'layers',
      },
      {
        title: 'بوابة دفع كاملة',
        description:
          'دفع آمن بالبطاقة، دفع عند الاستلام للمنتجات المادية، وتحقق OTP لحماية كل طلب.',
        icon: 'credit-card',
      },
      {
        title: 'تخصيصات وإدارة',
        description:
          'متغيرات، حقول حسب تصنيفك، كوبونات، شعار وصورة غلاف، ومتابعة الطلبات والمخزون من مكان واحد.',
        icon: 'settings',
      },
    ],
    highlights: [
      'منتجات مادية، رقمية، وخدمات',
      'تسليم ملفات رقمية تلقائياً بعد الشراء',
      'متغيرات: مقاس، لون، ونوع',
      'دفع آمن بالبطاقة البنكية',
      'الدفع عند الاستلام للمنتجات المادية',
      'تحقق OTP عبر واتساب',
      'كوبونات خصم ومراجعات العملاء',
      'تتبع الطلبات وحالة الدفع',
      'صفحة متجر جاهزة للمشاركة',
    ],
    showcaseDescription:
      'كل ما تحتاجه للبيع — من إضافة المنتج إلى استلام الدفع — في تجربة واحدة متكاملة.',
    detailSections: [
      {
        eyebrow: 'أنواع المنتجات',
        title: 'رقمي',
        titleMuted: ' أو مادي — أو خدمة',
        items: [
          {
            title: 'منتجات مادية',
            description:
              'ملابس، إكسسوارات، أدوات، أو أي منتج تلمسه باليد — مع صور، وصف، مخزون، وعناوين توصيل.',
            icon: 'package',
          },
          {
            title: 'منتجات رقمية',
            description:
              'ملفات PDF، دورات، قوالب، أو محتوى رقمي — يُرفع مرة واحدة ويُسلّم للعميل تلقائياً بعد الدفع.',
            icon: 'download',
          },
          {
            title: 'خدمات',
            description:
              'استشارات، مواعيد، أو خدمات بدون مخزون — أضفها كمنتج مستقل مع وصف وسعر واضح.',
            icon: 'calendar',
          },
        ],
      },
      {
        eyebrow: 'المدفوعات',
        title: 'بوابة دفع',
        titleMuted: ' آمنة ومحلية',
        items: [
          {
            title: 'الدفع بالبطاقة',
            description:
              'بوابة دفع مدمجة لاستقبال المدفوعات بالبطاقة — تجربة شراء موحّدة وآمنة لزبائنك.',
            icon: 'credit-card',
          },
          {
            title: 'الدفع عند الاستلام',
            description:
              'فعّل الدفع نقداً عند التوصيل للمنتجات المادية — خيار مألوف يزيد ثقة المشتري.',
            icon: 'banknote',
          },
          {
            title: 'تحقق وحماية',
            description:
              'تحقق OTP عبر واتساب قبل إتمام الطلب، مع تتبع حالة الدفع والطلب خطوة بخطوة.',
            icon: 'shield',
          },
        ],
      },
      {
        eyebrow: 'التخصيص',
        title: 'متجرك',
        titleMuted: ' على مقاس نشاطك',
        items: [
          {
            title: 'متغيرات وحقول ذكية',
            description:
              'مقاسات وألوان للمنتجات المادية، وحقول مخصصة حسب تصنيف متجرك — مثل المادة والماركة في الأزياء.',
            icon: 'palette',
          },
          {
            title: 'هوية المتجر',
            description:
              'اسم المتجر، الشعار، صورة الغلاف، وصف بالعربية، وبيانات التواصل — صفحة جاهزة للمشاركة فوراً.',
            icon: 'store',
          },
          {
            title: 'أدوات البيع',
            description:
              'كوبونات خصم، قائمة أمنيات، مراجعات العملاء، وربط المتجر بملفك الشخصي على ركني.',
            icon: 'tag',
          },
        ],
      },
    ],
  },
  forms: {
    slug: 'forms',
    eyebrow: 'النماذج',
    title: 'النماذج الذكية',
    headline: 'نماذج ذكية',
    headlineMuted: ' لكل احتياجك',
    description:
      'تواصل، استبيان، تسجيل، أو طلب — ابنِ نموذجاً احترافياً بحقول متنوعة، خطوات متعددة، مزامنة جداول جوجل، وتحليلات فورية.',
    icon: ClipboardList,
    tint: productTints.forms,
    ctaLabel: 'أنشئ نموذجاً',
    ctaHref: siteUrls.accounts,
    secondaryCta: { label: 'دليل الإعداد', href: '/docs' },
    features: [
      {
        title: 'بناء مرن',
        description:
          '30+ نوع حقل — نص، اختيار، تقييم، ملف، توقيع، NPS، مصفوفة — مع خطوات ومنطق شرطي.',
        icon: 'layout',
      },
      {
        title: 'مزامنة وتكامل',
        description:
          'Google Sheets و Drive، Webhooks، وتصدير CSV — كل استجابة تصل حيث تريد.',
        icon: 'spreadsheet',
      },
      {
        title: 'تحقق وإشعارات',
        description:
          'OTP للبريد وواتساب، إشعار فوري، وتحليلات لكل حقل ومعدل إكمال.',
        icon: 'bell',
      },
    ],
    highlights: [
      'تواصل، استبيان، تسجيل، وطلبات',
      '30+ نوع حقل بما فيها التوقيع والملفات',
      'خطوات متعددة ومنطق شرطي',
      'مزامنة Google Sheets و Drive',
      'Webhooks لأنظمتك الخارجية',
      'OTP للبريد والهاتف',
      'إشعار فوري عند كل إرسال',
      'تحليلات ومعدل إكمال النموذج',
      'فريق عمل مشترك للنماذج',
      'نشر على rukny.io/f/slug',
      'ربط النموذج بملفك الشخصي',
      'تصدير CSV للاستجابات',
    ],
    showcaseDescription:
      'من سؤال واحد إلى نموذج تسجيل متعدد الخطوات — ابنه في دقائق، انشره، وتابع كل استجابة.',
    detailSections: [
      {
        eyebrow: 'البناء',
        title: 'صمّم',
        titleMuted: ' نموذجك',
        items: [
          {
            title: 'حقول متنوعة',
            description:
              'نص، اختيار، تقييم، NPS، مصفوفة، ترتيب، ومحافظات العراق — أكثر من 30 نوع حقل.',
            icon: 'layout',
          },
          {
            title: 'خطوات متعددة',
            description:
              'قسّم النموذج إلى خطوات واضحة — تجربة أسهل للمستجيب ومعدل إكمال أعلى.',
            icon: 'layers',
          },
          {
            title: 'منطق شرطي',
            description:
              'أظهر أو أخفِ حقولاً حسب إجابات سابقة — نماذج تتكيف مع كل مستجيب.',
            icon: 'branch',
          },
        ],
      },
      {
        eyebrow: 'المحتوى',
        title: 'أضف',
        titleMuted: ' أكثر من أسئلة',
        items: [
          {
            title: 'وسائط وتنسيق',
            description:
              'عناوين، فقرات، صور، فيديو، وصوت — نموذج غني يشرح ويجمع في آن واحد.',
            icon: 'image',
          },
          {
            title: 'ملفات وتوقيع',
            description:
              'ارفع مستندات PDF أو وقّع إلكترونياً — مثالي للطلبات والتسجيلات الرسمية.',
            icon: 'pen',
          },
          {
            title: 'حماية وتحقق',
            description:
              'حماية من الردود الوهمية وOTP للبريد وواتساب — بيانات أدق وردود أكثر موثوقية.',
            icon: 'shield',
          },
        ],
      },
      {
        eyebrow: 'الربط',
        title: 'كل استجابة',
        titleMuted: ' تصل حيث تريد',
        items: [
          {
            title: 'Google Sheets',
            description:
              'مزامنة تلقائية مع جداول جوجل — كل إرسال يظهر في الجدول الذي تختاره.',
            icon: 'spreadsheet',
          },
          {
            title: 'Google Drive',
            description:
              'ارفع الملفات والتوقيعات مباشرة إلى Drive — تنظيم تلقائي بدون مجهود.',
            icon: 'cloud',
          },
          {
            title: 'Webhooks',
            description:
              'أرسل الأحداث فوراً إلى أنظمتك الخارجية — ربط مباشرة بسير عملك.',
            icon: 'webhook',
          },
        ],
      },
      {
        eyebrow: 'الاستخدام',
        title: 'نموذج',
        titleMuted: ' لكل غرض',
        items: [
          {
            title: 'تواصل واستبيان',
            description:
              'نماذج تواصل، آراء العملاء، واستبيانات رضا — اجمع ملاحظات بسرعة.',
            icon: 'message',
          },
          {
            title: 'تسجيل وطلبات',
            description:
              'تسجيل فعاليات، طلبات خدمة، أو طلبات توظيف — حقول مناسبة لكل سيناريو.',
            icon: 'clipboard',
          },
          {
            title: 'اختبارات تفاعلية',
            description:
              'اختبارات قصيرة وتقييمات — مع تحليل للنتائج.',
            icon: 'chart',
          },
        ],
      },
      {
        eyebrow: 'الإدارة',
        title: 'تابع',
        titleMuted: ' وشارك',
        items: [
          {
            title: 'نشر ومشاركة',
            description:
              'رابط عام rukny.io/f/slug — شاركه أو اربطه بملفك الشخصي على ركني.',
            icon: 'link',
          },
          {
            title: 'فريق العمل',
            description:
              'شارك النموذج مع زملائك — صلاحيات مختلفة للإدارة والتحرير والعرض.',
            icon: 'users',
          },
          {
            title: 'تحليلات وتصدير',
            description:
              'معدل الإكمال، تحليل كل حقل، وتصدير CSV — قرارات مبنية على أرقام.',
            icon: 'chart',
          },
        ],
      },
    ],
    workflowEyebrow: 'كيف يعمل',
    workflowTitle: 'ثلاث خطوات',
    workflowTitleMuted: ' للانطلاق',
    workflowSteps: [
      {
        title: 'ابنِ نموذجك',
        description: 'اختر الحقول، رتّب الخطوات، وفعّل المنطق الشرطي — من محرّر بسيط ومرن.',
      },
      {
        title: 'انشره',
        description: 'احصل على رابط عام أو اربطه بملفك — شاركه فوراً مع جمهورك.',
      },
      {
        title: 'تابع الاستجابات',
        description: 'إشعارات فورية، مزامنة Sheets، وتحليلات — كل إرسال في مكان واحد.',
      },
    ],
  },
  profile: {
    slug: 'profile',
    eyebrow: 'الهوية',
    title: 'الملف الشخصي',
    headline: 'رابط واحد',
    headlineMuted: ' لكل حضورك',
    description:
      'صفحة شخصية تجمع روابطك، متجرك، ونماذجك — وجهة احترافية تشاركها بضغطة واحدة.',
    icon: UserCircle2,
    tint: productTints.profile,
    ctaLabel: 'أنشئ صفحتك',
    ctaHref: siteUrls.accounts,
    secondaryCta: { label: 'دليل الإعداد', href: '/docs' },
    features: [
      {
        title: 'رابط واحد للجميع',
        description:
          'شارك rukny.io/username واجمع كل روابطك ومنتجاتك في صفحة واحدة نظيفة.',
        icon: 'link',
      },
      {
        title: 'روابط غنية',
        description:
          'وسائل التواصل، واتساب، نماذج، متجر، وروابط خارجية — بترتيب تتحكم به.',
        icon: 'share',
      },
      {
        title: 'هوية مرنة',
        description:
          'صورة، غلاف، نبذة، وسمات مظهر — صفحة تعكس شخصيتك أو علامتك.',
        icon: 'palette',
      },
    ],
    highlights: [
      'رابط شخصي قصير وسهل المشاركة',
      'Instagram، TikTok، YouTube، X، واتساب',
      'ربط المتجر والنماذج مباشرة',
      'عناوين، نصوص، وروابط مخصصة',
      'صورة شخصية وصورة غلاف',
      'سمات مظهر: كلاسيكي، داكن، وبسيط',
      'إخفاء البريد أو الهاتف عند الحاجة',
      'تحليلات نقرات الروابط',
      'صفحة عامة أو خاصة',
    ],
    showcaseDescription:
      'من صانع المحتوى إلى التاجر — صفحة واحدة تجمع كل ما تريد أن يراه جمهورك.',
    detailSections: [
      {
        eyebrow: 'المحتوى',
        title: 'كل روابطك',
        titleMuted: ' في مكان واحد',
        items: [
          {
            title: 'وسائل التواصل',
            description:
              'Instagram، TikTok، YouTube، X، LinkedIn، Facebook، Snapchat، Telegram — بأيقونات جاهزة.',
            icon: 'share',
          },
          {
            title: 'متجر ونماذج',
            description:
              'اربط متجرك ونماذجك مباشرة من الصفحة — الزائر يصل لمنتجاتك واستبياناتك دون بحث.',
            icon: 'store',
          },
          {
            title: 'روابط مخصصة',
            description:
              'أي رابط خارجي، بريد، هاتف، عنوان فرعي، أو نص توضيحي — رتّبها كما يناسبك.',
            icon: 'link',
          },
        ],
      },
      {
        eyebrow: 'المظهر',
        title: 'هويتك',
        titleMuted: ' كما تريدها',
        items: [
          {
            title: 'صورة وغلاف',
            description:
              'ارفع صورتك الشخصية وصورة الغلاف — أول انطباع احترافي لكل زائر.',
            icon: 'image',
          },
          {
            title: 'نبذة واسم',
            description:
              'اسم العرض، نبذة قصيرة، وبيانات تواصل — كل ما يحتاجه الزائر لمعرفتك.',
            icon: 'user',
          },
          {
            title: 'سمات المظهر',
            description:
              'اختر بين سمة كلاسيكية، داكنة، أو بسيطة — مظهر يناسب أسلوبك.',
            icon: 'palette',
          },
        ],
      },
      {
        eyebrow: 'الوصول',
        title: 'شارك',
        titleMuted: ' وتابع',
        items: [
          {
            title: 'رابط قصير',
            description:
              'rukny.io/username — رابط واحد تضعه في السيرة، البايو، أو أي مكان.',
            icon: 'globe',
          },
          {
            title: 'خصوصية مرنة',
            description:
              'اجعل صفحتك عامة للجميع أو خاصة — وأخفِ البريد أو الهاتف عند الحاجة.',
            icon: 'eye',
          },
          {
            title: 'تحليلات النقرات',
            description:
              'اعرف أي روابط يتفاعل معها جمهورك — قرارات أوضح لمحتواك وعروضك.',
            icon: 'chart',
          },
        ],
      },
    ],
  },
  analytics: {
    slug: 'analytics',
    eyebrow: 'القرار',
    title: 'التحليلات',
    headline: 'تابع الأداء',
    headlineMuted: ' بوضوح',
    description:
      'مبيعات، زيارات، واستجابات في لوحة واحدة — صورة واضحة قبل الخطوة التالية.',
    icon: BarChart3,
    tint: productTints.analytics,
    ctaLabel: 'افتح لوحة التحليلات',
    ctaHref: siteUrls.accounts,
    secondaryCta: { label: 'عرض الأسعار', href: '/pricing' },
    features: [
      {
        title: 'لوحة موحّدة',
        description: 'مبيعات المتجر، زيارات الصفحة، واستجابات النماذج معاً.',
      },
      {
        title: 'قرارات أسرع',
        description: 'ارَ الأرقام المهمة دون التنقل بين أدوات مختلفة.',
      },
      {
        title: 'تصدير وتقارير',
        description: 'صدّر بياناتك وشاركها مع فريقك عند الحاجة.',
      },
    ],
    highlights: [
      'تحليلات المبيعات',
      'زيارات الصفحات',
      'استجابات النماذج',
      'مقارنة الفترات',
      'تصدير CSV',
    ],
  },
  ai: {
    slug: 'ai',
    eyebrow: 'قريباً',
    title: 'الذكاء الاصطناعي',
    headline: 'أدوات ذكية',
    headlineMuted: ' داخل ركني',
    description:
      'أدوات ذكية لتسريع المحتوى، الردود، وقراراتك اليومية داخل المنصة.',
    icon: BrainCircuit,
    tint: productTints.ai,
    ctaLabel: 'انضم لقائمة الانتظار',
    ctaHref: 'mailto:support@rukny.io?subject=الذكاء%20الاصطناعي%20—%20ركني',
    secondaryCta: { label: 'استكشف المنتجات', href: '/#products' },
    badge: 'قريباً',
    features: [
      {
        title: 'محتوى أسرع',
        description: 'مساعدة في كتابة أوصاف المنتجات والردود.',
      },
      {
        title: 'ردود ذكية',
        description: 'اقتراحات للرد على العملاء والاستفسارات.',
      },
      {
        title: 'قرارات أوضح',
        description: 'ملخصات وتحليلات بلغة بسيطة.',
      },
    ],
    highlights: [
      'مساعدة في المحتوى',
      'اقتراحات للردود',
      'ملخصات ذكية',
      'تكامل مع منتجات ركني',
      'قريباً للجميع',
    ],
  },
};

export const PRODUCT_SLUGS = Object.keys(PRODUCT_PAGES) as ProductSlug[];

export function getProductPage(slug: string): ProductPageContent | undefined {
  return PRODUCT_PAGES[slug as ProductSlug];
}

