import type { Localized, DocMeta } from '../types';

export type EmailOverviewCopy = DocMeta & {
  features: { title: string; description: string }[];
  howItWorks: { beforeKey: string; mid: string; afterIdem: string };
  recommendedTitle: string;
  recommendedBodyBefore: string;
  recommendedBodyAfter: string;
  whereToStart: {
    title: string;
    getStarted: { title: string; description: string };
    useCases: { title: string; description: string };
    send: { title: string; description: string };
    sdk: { title: string; description: string };
    reference: { title: string; description: string };
  };
  integrationPaths: {
    title: string;
    intro: string;
    sdk: string;
    sdkNote: string;
    send: string;
    sendNote: string;
    rest: string;
    restNote: string;
    portal: string;
    portalNote: string;
  };
  notIncluded: { title: string; body: string };
  nextLabel: string;
};

export const emailOverviewCopy: Localized<EmailOverviewCopy> = {
  en: {
    metaTitle: 'Email API | Rukny Documentation',
    metaDescription:
      'Send transactional email from verified domains with the Rukny Email API and @rukny/email.',
    title: 'Email API',
    description:
      'Send reliable transactional email from your backend — OTPs, magic links, receipts, and product alerts — using verified domains and app-scoped API keys.',
    toc: [
      { id: 'what-you-can-build', label: 'What you can build' },
      { id: 'how-it-works', label: 'How it works' },
      { id: 'where-to-start', label: 'Where to start' },
      { id: 'integration-paths', label: 'Integration paths' },
      { id: 'not-included', label: 'What it is not' },
    ],
    features: [
      {
        title: 'Authentication mail',
        description: 'One-time codes, password resets, and sign-in links.',
      },
      {
        title: 'Lifecycle alerts',
        description: 'Welcome notes, order updates, and delivery notices.',
      },
      {
        title: 'Product notifications',
        description: 'Account changes, billing receipts, and security alerts.',
      },
      {
        title: 'Safe testing',
        description:
          'Test keys limited to your account email or verified domains.',
      },
    ],
    howItWorks: {
      beforeKey:
        'Each app installs Email API, verifies a sending domain, authorizes a sender address, then calls the API with an',
      mid: '. Every live send needs an',
      afterIdem:
        'so retries never duplicate messages or billing.',
    },
    recommendedTitle: 'Recommended',
    recommendedBodyBefore: 'Use the official Node package',
    recommendedBodyAfter: 'on your server. It handles headers, typing, and errors for you.',
    whereToStart: {
      title: 'Where to start',
      getStarted: {
        title: 'Get started',
        description:
          'Install the product, verify DNS, create a key, and send your first email.',
      },
      useCases: {
        title: 'Use cases',
        description: 'Copy-ready patterns for OTP, receipts, and magic links.',
      },
      send: {
        title: 'Sending examples',
        description: 'Node.js, Python, PHP, Go, SMTP, CLI, and every major stack.',
      },
      sdk: {
        title: 'Node.js SDK',
        description: 'Install @rukny/email and ship with a few lines of TypeScript.',
      },
      reference: {
        title: 'API reference',
        description: 'Methods, paths, scopes, and response shapes.',
      },
    },
    integrationPaths: {
      title: 'Integration paths',
      intro: 'Pick the path that fits your stack:',
      sdk: 'Node.js SDK',
      sdkNote: '— preferred for TypeScript and Node backends.',
      send: 'Sending examples',
      sendNote: '— Node, Python, PHP, Go, Rust, SMTP, CLI, and more.',
      rest: 'REST & curl',
      restNote: '— any language that can make HTTPS requests.',
      portal: 'Portal Try it',
      portalNote: '— send a safe test message without writing code first.',
    },
    notIncluded: {
      title: 'What it is not',
      body: 'Email API is not a mailbox, inbox, or marketing campaign tool. For a full mailbox experience use Rukny Mail. For bulk marketing or attachments, wait for later API releases — the MVP focuses on one recipient, text/HTML bodies, and high deliverability.',
    },
    nextLabel: 'Get started',
  },
  ar: {
    metaTitle: 'Email API | توثيق رُكني',
    metaDescription:
      'أرسل بريداً معاملاتياً من نطاقات موثّقة عبر Rukny Email API و@rukny/email.',
    title: 'Email API',
    description:
      'أرسل بريداً معاملاتياً موثوقاً من خادمك — رموز OTP وروابط تسجيل الدخول والإيصالات وتنبيهات المنتج — باستخدام نطاقات موثّقة ومفاتيح API مرتبطة بالتطبيق.',
    toc: [
      { id: 'what-you-can-build', label: 'ماذا يمكنك بناؤه' },
      { id: 'how-it-works', label: 'كيف يعمل' },
      { id: 'where-to-start', label: 'من أين تبدأ' },
      { id: 'integration-paths', label: 'مسارات التكامل' },
      { id: 'not-included', label: 'ما ليس عليه' },
    ],
    features: [
      {
        title: 'بريد المصادقة',
        description: 'رموز لمرة واحدة، إعادة تعيين كلمة المرور، وروابط تسجيل الدخول.',
      },
      {
        title: 'تنبيهات دورة الحياة',
        description: 'رسائل الترحيب، تحديثات الطلبات، وإشعارات التوصيل.',
      },
      {
        title: 'إشعارات المنتج',
        description: 'تغييرات الحساب، إيصالات الفوترة، وتنبيهات الأمان.',
      },
      {
        title: 'اختبار آمن',
        description:
          'مفاتيح اختبار محدودة ببريد حسابك أو النطاقات الموثّقة.',
      },
    ],
    howItWorks: {
      beforeKey:
        'يثبّت كل تطبيق Email API، ويوثّق نطاق الإرسال، ويصرّح بعنوان مُرسِل، ثم يستدعي الـ API بمفتاح',
      mid: '. كل إرسال حي يحتاج',
      afterIdem: 'حتى لا تُكرَّر الرسائل أو الفوترة عند إعادة المحاولة.',
    },
    recommendedTitle: 'موصى به',
    recommendedBodyBefore: 'استخدم حزمة Node الرسمية',
    recommendedBodyAfter: 'على خادمك. تتولى الترويسات والأنواع والأخطاء نيابةً عنك.',
    whereToStart: {
      title: 'من أين تبدأ',
      getStarted: {
        title: 'البدء',
        description:
          'ثبّت المنتج، وثّق DNS، أنشئ مفتاحاً، وأرسل أول بريد.',
      },
      useCases: {
        title: 'حالات الاستخدام',
        description: 'أنماط جاهزة للنسخ لـ OTP والإيصالات وروابط الدخول.',
      },
      send: {
        title: 'أمثلة الإرسال',
        description: 'Node.js وPython وPHP وGo وSMTP وCLI وكل المنصات الرئيسية.',
      },
      sdk: {
        title: 'Node.js SDK',
        description: 'ثبّت @rukny/email وأطلق بعدة أسطر TypeScript.',
      },
      reference: {
        title: 'مرجع API',
        description: 'الطرق والمسارات والصلاحيات وأشكال الاستجابة.',
      },
    },
    integrationPaths: {
      title: 'مسارات التكامل',
      intro: 'اختر المسار الذي يناسب منصتك:',
      sdk: 'Node.js SDK',
      sdkNote: '— المفضّل لـ TypeScript وخوادم Node.',
      send: 'أمثلة الإرسال',
      sendNote: '— Node وPython وPHP وGo وRust وSMTP وCLI والمزيد.',
      rest: 'REST و curl',
      restNote: '— أي لغة يمكنها طلبات HTTPS.',
      portal: 'جرّب من البوابة',
      portalNote: '— أرسل رسالة اختبار آمنة دون كتابة كود أولاً.',
    },
    notIncluded: {
      title: 'ما ليس عليه',
      body: 'Email API ليس صندوق بريد أو أداة حملات تسويقية. لصندوق بريد كامل استخدم رُكني ميل. للتسويق الجماعي أو المرفقات انتظر إصدارات لاحقة — يركز الـ MVP على مستلم واحد ونص/HTML وتوصيل عالٍ.',
    },
    nextLabel: 'البدء',
  },
};
