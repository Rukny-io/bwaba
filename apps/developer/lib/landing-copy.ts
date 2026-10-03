import type { Locale } from '@/lib/locale';

export type LandingLocale = Locale;

export type LandingCopy = {
  docs: string;
  pricing: string;
  login: string;
  start: string;
  startFree: string;
  switchLang: string;
  footerBrand: string;
  footerTagline: string;
  products: string;
  resources: string;
  company: string;
  whatsapp: string;
  email: string;
  forms: string;
  getStarted: string;
  contact: string;
  brand: string;
  heroEyebrow: string;
  headline: string;
  headlineMuted: string;
  support: string;
  quickstartEyebrow: string;
  quickstartTitle: string;
  quickstartTitleMuted: string;
  quickstartSupport: string;
  howEyebrow: string;
  howTitle: string;
  howTitleMuted: string;
  howSteps: { n: string; title: string; desc: string }[];
  productsEyebrow: string;
  productsTitle: string;
  productsTitleMuted: string;
  bands: { title: string; desc: string; href: string; cta: string; tint: 'whatsapp' | 'email' | 'forms' }[];
  ctaEyebrow: string;
  ctaTitle: string;
  ctaSupport: string;
  backToTop: string;
};

export const LANDING_COPY: Record<LandingLocale, LandingCopy> = {
  ar: {
    docs: 'التوثيق',
    pricing: 'الأسعار',
    login: 'تسجيل الدخول',
    start: 'ابدأ البناء',
    startFree: 'ابدأ مجاناً',
    switchLang: 'English',
    footerBrand: 'بوابة المطوّرين',
    footerTagline: 'واجهات إرسال ونماذج للمطوّرين — مفاتيح، محفظة، وتوثيق في مكان واحد.',
    products: 'المنتجات',
    resources: 'الموارد',
    company: 'الشركة',
    whatsapp: 'WhatsApp API',
    email: 'Email API',
    forms: 'Forms',
    getStarted: 'البدء',
    contact: 'تواصل',
    brand: 'رُكني',
    heroEyebrow: 'بوابة المطوّرين',
    headline: 'بوابة واحدة',
    headlineMuted: 'لواتساب والبريد والنماذج',
    support:
      'مفاتيح API ومحفظة IQD وتوثيق واضح — ابدأ الإرسال خلال دقائق.',
    quickstartEyebrow: 'Quickstart',
    quickstartTitle: 'أول رسالة',
    quickstartTitleMuted: ' في دقائق',
    quickstartSupport: 'مفتاح واحد وطلب HTTPS. الـ SDK اختياري.',
    howEyebrow: 'كيف يعمل',
    howTitle: 'من التسجيل',
    howTitleMuted: ' إلى الإنتاج',
    howSteps: [
      {
        n: '01',
        title: 'أنشئ تطبيقاً',
        desc: 'المفاتيح والنطاقات والفوترة مرتبطة بتطبيقك.',
      },
      {
        n: '02',
        title: 'فعّل منتجاً',
        desc: 'اربط واتساب، وثّق نطاقاً للبريد، أو انشر نموذجاً.',
      },
      {
        n: '03',
        title: 'استدعِ الـ API',
        desc: 'أرسل من الخادم، راقب السجلات، واستقبل الويب هوك.',
      },
    ],
    productsEyebrow: 'المنتجات',
    productsTitle: 'ثلاث قدرات،',
    productsTitleMuted: ' تطبيق واحد',
    bands: [
      {
        title: 'WhatsApp API',
        desc: 'Embedded Signup، قوالب، محفظة، وويب هوك للتسليم والوارد.',
        href: '/documentation/whatsapp-api',
        cta: 'توثيق واتساب',
        tint: 'whatsapp',
      },
      {
        title: 'Email API',
        desc: 'نطاقات موثّقة، بريد معاملاتي، و@rukny/email للخادم.',
        href: '/documentation/email-api',
        cta: 'توثيق البريد',
        tint: 'email',
      },
      {
        title: 'Forms',
        desc: 'تضمين آمن، أحداث الصفحة، وويب هوك للإرسالات.',
        href: '/documentation/forms',
        cta: 'توثيق النماذج',
        tint: 'forms',
      },
    ],
    ctaEyebrow: 'ابدأ الآن',
    ctaTitle: 'ابنِ على رُكني اليوم',
    ctaSupport: 'أنشئ تطبيقاً مجاناً وابدأ الإرسال أو نشر النماذج.',
    backToTop: 'للأعلى',
  },
  en: {
    docs: 'Docs',
    pricing: 'Pricing',
    login: 'Sign in',
    start: 'Start building',
    startFree: 'Start for free',
    switchLang: 'العربية',
    footerBrand: 'Developer portal',
    footerTagline:
      'Messaging and forms APIs for developers — keys, wallet, and docs in one place.',
    products: 'Products',
    resources: 'Resources',
    company: 'Company',
    whatsapp: 'WhatsApp API',
    email: 'Email API',
    forms: 'Forms',
    getStarted: 'Get started',
    contact: 'Contact',
    brand: 'Rukny',
    heroEyebrow: 'Developer portal',
    headline: 'One portal',
    headlineMuted: 'for WhatsApp, email, and forms',
    support:
      'API keys, IQD wallet, and clear docs — send your first message in minutes.',
    quickstartEyebrow: 'Quickstart',
    quickstartTitle: 'First message',
    quickstartTitleMuted: ' in minutes',
    quickstartSupport: 'One key and an HTTPS call. SDK optional.',
    howEyebrow: 'How it works',
    howTitle: 'From signup',
    howTitleMuted: ' to production',
    howSteps: [
      {
        n: '01',
        title: 'Create an app',
        desc: 'Keys, domains, and billing stay scoped to your application.',
      },
      {
        n: '02',
        title: 'Enable a product',
        desc: 'Connect WhatsApp, verify an Email domain, or publish a form.',
      },
      {
        n: '03',
        title: 'Call the API',
        desc: 'Send from your server, watch logs, and receive webhooks.',
      },
    ],
    productsEyebrow: 'Products',
    productsTitle: 'Three capabilities,',
    productsTitleMuted: ' one app',
    bands: [
      {
        title: 'WhatsApp API',
        desc: 'Embedded Signup, templates, wallet, and delivery webhooks.',
        href: '/documentation/whatsapp-api',
        cta: 'WhatsApp docs',
        tint: 'whatsapp',
      },
      {
        title: 'Email API',
        desc: 'Verified domains, transactional mail, and @rukny/email.',
        href: '/documentation/email-api',
        cta: 'Email docs',
        tint: 'email',
      },
      {
        title: 'Forms',
        desc: 'Secure embeds, page events, and submission webhooks.',
        href: '/documentation/forms',
        cta: 'Forms docs',
        tint: 'forms',
      },
    ],
    ctaEyebrow: 'Get started',
    ctaTitle: 'Build on Rukny today',
    ctaSupport: 'Create a free app and start sending or publishing forms.',
    backToTop: 'Back to top',
  },
};
