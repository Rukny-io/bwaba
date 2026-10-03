import type { Localized, DocMeta } from '../types';

export type WhatsappOverviewCopy = DocMeta & {
  features: { title: string; description: string }[];
  howItWorks: { beforeKey: string; afterKey: string };
  recommendedTitle: string;
  recommendedBefore: string;
  recommendedAfter: string;
  whereToStart: {
    title: string;
    cards: { href: string; title: string; description: string }[];
  };
  integrationPaths: {
    title: string;
    intro: string;
    items: { href: string; label: string; note: string }[];
  };
  notIncluded: { title: string; body: string };
  nextLabel: string;
};

export const whatsappOverviewCopy: Localized<WhatsappOverviewCopy> = {
  en: {
    metaTitle: 'WhatsApp API | Rukny Documentation',
    metaDescription:
      'Send WhatsApp messages, templates, and OTPs with the Rukny WhatsApp API and @rukny/whatsapp.',
    title: 'WhatsApp API',
    description:
      'Send reliable WhatsApp Business messages from your backend — text, approved templates, and OTPs — using a linked WABA and app-scoped API keys.',
    toc: [
      { id: 'what-you-can-build', label: 'What you can build' },
      { id: 'how-it-works', label: 'How it works' },
      { id: 'where-to-start', label: 'Where to start' },
      { id: 'integration-paths', label: 'Integration paths' },
      { id: 'not-included', label: 'What it is not' },
    ],
    features: [
      {
        title: 'Transactional alerts',
        description: 'Order updates, reminders, and account notices via templates.',
      },
      {
        title: 'Authentication OTPs',
        description: 'One-time codes with AUTHENTICATION templates.',
      },
      {
        title: 'Session text',
        description: 'Free-form text inside an open customer service window.',
      },
      {
        title: 'Inbound events',
        description: 'Webhooks for delivery, reads, failures, and customer replies.',
      },
    ],
    howItWorks: {
      beforeKey:
        'Each app installs WhatsApp API, connects a WhatsApp Business Account (WABA) through Meta Embedded Signup, then calls the API with an',
      afterKey:
        '. Outbound live traffic debits the app wallet. Templates must be approved in Meta before you can send them outside the customer care window.',
    },
    recommendedTitle: 'Recommended',
    recommendedBefore: 'Use the official Node package',
    recommendedAfter:
      'on your server. It handles typing, OTP helpers, and webhook signature verification.',
    whereToStart: {
      title: 'Where to start',
      cards: [
        {
          href: '/documentation/whatsapp-api/get-started',
          title: 'Get started',
          description:
            'Connect WABA, create a key, top up the wallet, and send your first message.',
        },
        {
          href: '/documentation/whatsapp-api/use-cases',
          title: 'Use cases',
          description: 'Patterns for OTP, order updates, and support replies.',
        },
        {
          href: '/documentation/whatsapp-api/send',
          title: 'Sending examples',
          description:
            'Text, template, and OTP recipes in curl, Node, Python, and PHP.',
        },
        {
          href: '/documentation/whatsapp-api/sdk',
          title: 'Node.js SDK',
          description:
            'Install @rukny/whatsapp and ship with a few lines of TypeScript.',
        },
        {
          href: '/documentation/whatsapp-api/reference',
          title: 'API reference',
          description: 'Methods, paths, scopes, and response shapes.',
        },
      ],
    },
    integrationPaths: {
      title: 'Integration paths',
      intro: 'Pick the path that fits your stack:',
      items: [
        {
          href: '/documentation/whatsapp-api/sdk',
          label: 'Node.js SDK',
          note: '— preferred for TypeScript and Node backends.',
        },
        {
          href: '/documentation/whatsapp-api/send',
          label: 'Sending examples',
          note: '— text, template, and OTP in multiple languages.',
        },
        {
          href: '/documentation/whatsapp-api/rest',
          label: 'REST & curl',
          note: '— any language that can make HTTPS requests.',
        },
        {
          href: '/login?next=/apps',
          label: 'Portal Try it',
          note: '— send a safe test message from the developer dashboard.',
        },
      ],
    },
    notIncluded: {
      title: 'What it is not',
      body: 'WhatsApp API is not a full customer inbox or broadcast CRM. Use it to send and track Business Platform messages from your systems. Upload media with POST /v1/whatsapp/media, then reference the returned id in outbound messages. Some interactive types continue to expand — check the endpoint reference for what is live today.',
    },
    nextLabel: 'Get started',
  },
  ar: {
    metaTitle: 'WhatsApp API | توثيق رُكني',
    metaDescription:
      'أرسل رسائل واتساب والقوالب ورموز OTP عبر Rukny WhatsApp API و@rukny/whatsapp.',
    title: 'WhatsApp API',
    description:
      'أرسل رسائل WhatsApp Business موثوقة من خادمك — نصاً وقوالب معتمدة وOTP — باستخدام WABA مرتبط ومفاتيح API مرتبطة بالتطبيق.',
    toc: [
      { id: 'what-you-can-build', label: 'ماذا يمكنك بناؤه' },
      { id: 'how-it-works', label: 'كيف يعمل' },
      { id: 'where-to-start', label: 'من أين تبدأ' },
      { id: 'integration-paths', label: 'مسارات التكامل' },
      { id: 'not-included', label: 'ما ليس عليه' },
    ],
    features: [
      {
        title: 'تنبيهات معاملاتية',
        description: 'تحديثات الطلبات والتذكيرات وإشعارات الحساب عبر القوالب.',
      },
      {
        title: 'OTP للمصادقة',
        description: 'رموز لمرة واحدة بقوالب AUTHENTICATION.',
      },
      {
        title: 'نص الجلسة',
        description: 'نص حر داخل نافذة خدمة العملاء المفتوحة.',
      },
      {
        title: 'أحداث واردة',
        description: 'ويب هوك للتسليم والقراءة والفشل وردود العملاء.',
      },
    ],
    howItWorks: {
      beforeKey:
        'يثبّت كل تطبيق WhatsApp API، ويربط حساب WhatsApp Business (WABA) عبر Meta Embedded Signup، ثم يستدعي الـ API بمفتاح',
      afterKey:
        '. الحركة الصادرة الحية تُخصم من محفظة التطبيق. يجب اعتماد القوالب في Meta قبل إرسالها خارج نافذة رعاية العملاء.',
    },
    recommendedTitle: 'موصى به',
    recommendedBefore: 'استخدم حزمة Node الرسمية',
    recommendedAfter:
      'على خادمك. تتولى الأنواع ومساعدات OTP والتحقق من توقيع الويب هوك.',
    whereToStart: {
      title: 'من أين تبدأ',
      cards: [
        {
          href: '/documentation/whatsapp-api/get-started',
          title: 'البدء',
          description:
            'اربط WABA، أنشئ مفتاحاً، اشحن المحفظة، وأرسل أول رسالة.',
        },
        {
          href: '/documentation/whatsapp-api/use-cases',
          title: 'حالات الاستخدام',
          description: 'أنماط لـ OTP وتحديثات الطلبات وردود الدعم.',
        },
        {
          href: '/documentation/whatsapp-api/send',
          title: 'أمثلة الإرسال',
          description:
            'وصفات نص وقالب وOTP بـ curl وNode وPython وPHP.',
        },
        {
          href: '/documentation/whatsapp-api/sdk',
          title: 'Node.js SDK',
          description:
            'ثبّت @rukny/whatsapp وأطلق بعدة أسطر TypeScript.',
        },
        {
          href: '/documentation/whatsapp-api/reference',
          title: 'مرجع API',
          description: 'الطرق والمسارات والصلاحيات وأشكال الاستجابة.',
        },
      ],
    },
    integrationPaths: {
      title: 'مسارات التكامل',
      intro: 'اختر المسار الذي يناسب منصتك:',
      items: [
        {
          href: '/documentation/whatsapp-api/sdk',
          label: 'Node.js SDK',
          note: '— المفضّل لـ TypeScript وخوادم Node.',
        },
        {
          href: '/documentation/whatsapp-api/send',
          label: 'أمثلة الإرسال',
          note: '— نص وقالب وOTP بعدة لغات.',
        },
        {
          href: '/documentation/whatsapp-api/rest',
          label: 'REST و curl',
          note: '— أي لغة يمكنها طلبات HTTPS.',
        },
        {
          href: '/login?next=/apps',
          label: 'جرّب من البوابة',
          note: '— أرسل رسالة اختبار آمنة من لوحة المطوّرين.',
        },
      ],
    },
    notIncluded: {
      title: 'ما ليس عليه',
      body: 'WhatsApp API ليس صندوق وارد كامل للعملاء أو CRM للبث. استخدمه لإرسال وتتبع رسائل Business Platform من أنظمتك. ارفع الوسائط عبر POST /v1/whatsapp/media ثم استخدم المعرّف المُعاد في الرسائل الصادرة. بعض الأنواع التفاعلية ما زالت تتوسع — راجع مرجع النقاط لمعرفة ما هو متاح اليوم.',
    },
    nextLabel: 'البدء',
  },
};
