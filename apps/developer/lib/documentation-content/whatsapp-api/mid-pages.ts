import type { Localized, DocMeta } from '../types';

export const whatsappBestPracticesCopy: Localized<
  DocMeta & {
    sections: { id: string; title: string; body: string; calloutTitle?: string; calloutBody?: string }[];
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Best practices — WhatsApp API | Rukny Documentation',
    metaDescription:
      'Operational guidance for reliable WhatsApp messaging with Rukny.',
    title: 'Best practices',
    description:
      'Keep messaging reliable, compliant, and easy to operate in production.',
    toc: [
      { id: 'keys', label: 'Protect keys' },
      { id: 'templates', label: 'Templates first' },
      { id: 'quality', label: 'Phone quality' },
      { id: 'webhooks', label: 'Prefer webhooks' },
      { id: 'wallet', label: 'Watch the wallet' },
    ],
    sections: [
      {
        id: 'keys',
        title: 'Protect API keys',
        body: 'Store keys in a secret manager. Never ship them to browsers or mobile clients. Use test keys in CI and staging; rotate live keys if they leak.',
      },
      {
        id: 'templates',
        title: 'Design templates carefully',
        body: 'Outside the care window you need approved templates. Write clear copy, minimize variables, and pick the right category (AUTHENTICATION, UTILITY, or MARKETING). Rejected templates waste review time — preview in Meta before submitting large batches.',
      },
      {
        id: 'quality',
        title: 'Protect phone quality',
        body: 'High complaint rates lower quality ratings and messaging limits. Send only to opted-in users, honor opt-outs, and avoid aggressive marketing cadence.',
        calloutTitle: 'Important',
        calloutBody:
          'Meta may restrict numbers with poor quality. Monitor quality in the portal and pause campaigns if ratings drop.',
      },
      {
        id: 'webhooks',
        title: 'Prefer webhooks over polling',
        body: 'Subscribe to delivery and inbound events instead of polling every message. Verify X-Rukny-Signature and reject replayed delivery ids.',
      },
      {
        id: 'wallet',
        title: 'Watch the wallet',
        body: 'Failed sends still consume operational time; insufficient balance returns a clear wallet error. Keep a balance buffer before campaigns and alert on low funds.',
      },
    ],
    prevLabel: 'Use cases',
    nextLabel: 'Authentication',
  },
  ar: {
    metaTitle: 'أفضل الممارسات — WhatsApp API | توثيق رُكني',
    metaDescription: 'إرشادات تشغيلية لرسائل واتساب موثوقة مع رُكني.',
    title: 'أفضل الممارسات',
    description: 'حافظ على موثوقية الرسائل والامتثال وسهولة التشغيل في الإنتاج.',
    toc: [
      { id: 'keys', label: 'احمِ المفاتيح' },
      { id: 'templates', label: 'القوالب أولاً' },
      { id: 'quality', label: 'جودة الرقم' },
      { id: 'webhooks', label: 'فضّل الويب هوك' },
      { id: 'wallet', label: 'راقب المحفظة' },
    ],
    sections: [
      {
        id: 'keys',
        title: 'احمِ مفاتيح API',
        body: 'خزّن المفاتيح في مدير أسرار. لا ترسلها للمتصفحات أو عملاء الجوال. استخدم مفاتيح الاختبار في CI والتجريب؛ دوّر المفاتيح الحية إن تسرّبت.',
      },
      {
        id: 'templates',
        title: 'صمّم القوالب بعناية',
        body: 'خارج نافذة الرعاية تحتاج قوالب معتمدة. اكتب نصاً واضحاً، قلّل المتغيرات، واختر الفئة الصحيحة (AUTHENTICATION أو UTILITY أو MARKETING). القوالب المرفوضة تهدر وقت المراجعة — عاين في Meta قبل دفعات كبيرة.',
      },
      {
        id: 'quality',
        title: 'احمِ جودة الرقم',
        body: 'معدلات الشكاوى العالية تخفض تقييم الجودة وحدود المراسلة. أرسل فقط للموافقين، احترم إلغاء الاشتراك، وتجنّب إيقاع تسويق عدواني.',
        calloutTitle: 'مهم',
        calloutBody:
          'قد تقيّد Meta الأرقام ذات الجودة الضعيفة. راقب الجودة في البوابة وأوقف الحملات إن انخفض التقييم.',
      },
      {
        id: 'webhooks',
        title: 'فضّل الويب هوك على الاستطلاع',
        body: 'اشترك في أحداث التسليم والوارد بدل استطلاع كل رسالة. تحقّق من X-Rukny-Signature وارفض معرّفات التسليم المعادة.',
      },
      {
        id: 'wallet',
        title: 'راقب المحفظة',
        body: 'الإرسالات الفاشلة ما زالت تستهلك وقتاً تشغيلياً؛ الرصيد غير الكافي يعيد خطأ محفظة واضحاً. أبقِ هامش رصيد قبل الحملات ونبّه عند انخفاض الأموال.',
      },
    ],
    prevLabel: 'حالات الاستخدام',
    nextLabel: 'المصادقة',
  },
};

export const whatsappUseCasesCopy: Localized<
  DocMeta & {
    otp: { body: string; cardTitle: string; cardDesc: string };
    orders: { body: string; cardTitle: string; cardDesc: string };
    support: { body: string; cardTitle: string; cardDesc: string };
    marketing: { body: string; calloutBefore: string; calloutLink: string };
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Use cases — WhatsApp API | Rukny Documentation',
    metaDescription:
      'Common WhatsApp Business patterns with Rukny: OTP, order updates, and support replies.',
    title: 'Use cases',
    description: 'Practical patterns teams ship first with the WhatsApp API.',
    toc: [
      { id: 'otp', label: 'OTP / authentication' },
      { id: 'orders', label: 'Order & utility updates' },
      { id: 'support', label: 'Support replies' },
      { id: 'marketing', label: 'Marketing templates' },
    ],
    otp: {
      body: 'Send one-time codes with an AUTHENTICATION template. Prefer the SDK helper for the correct component shape and language code.',
      cardTitle: 'OTP example',
      cardDesc: 'Node, curl, and template tips for verification codes.',
    },
    orders: {
      body: 'Confirm orders, shipping, and appointments with UTILITY templates. Keep variables short and match the approved body placeholders.',
      cardTitle: 'Template example',
      cardDesc: 'Send an approved template with body parameters.',
    },
    support: {
      body: 'Inside the customer care window you can send free-form text. Outside that window, switch back to an approved template.',
      cardTitle: 'Text example',
      cardDesc: 'Send a simple text body to an E.164 number.',
    },
    marketing: {
      body: 'Marketing category templates need Meta approval and follow Meta’s opt-in rules. Create them in the portal or via the templates API, wait for approval, then send.',
      calloutBefore:
        'Sync templates after Meta reviews them so your app catalog stays current — see',
      calloutLink: 'Templates',
    },
    prevLabel: 'Get started',
    nextLabel: 'Best practices',
  },
  ar: {
    metaTitle: 'حالات الاستخدام — WhatsApp API | توثيق رُكني',
    metaDescription:
      'أنماط WhatsApp Business الشائعة مع رُكني: OTP وتحديثات الطلبات وردود الدعم.',
    title: 'حالات الاستخدام',
    description: 'أنماط عملية تبدأ بها الفرق مع WhatsApp API.',
    toc: [
      { id: 'otp', label: 'OTP / المصادقة' },
      { id: 'orders', label: 'تحديثات الطلبات والمرافق' },
      { id: 'support', label: 'ردود الدعم' },
      { id: 'marketing', label: 'قوالب التسويق' },
    ],
    otp: {
      body: 'أرسل رموزاً لمرة واحدة بقالب AUTHENTICATION. فضّل مساعد الـ SDK لشكل المكوّن ورمز اللغة الصحيحين.',
      cardTitle: 'مثال OTP',
      cardDesc: 'Node وcurl ونصائح القوالب لرموز التحقق.',
    },
    orders: {
      body: 'أكّد الطلبات والشحن والمواعيد بقوالب UTILITY. أبقِ المتغيرات قصيرة وطابق عناصر الجسم المعتمدة.',
      cardTitle: 'مثال القالب',
      cardDesc: 'أرسل قالباً معتمداً مع معاملات الجسم.',
    },
    support: {
      body: 'داخل نافذة رعاية العملاء يمكنك إرسال نص حر. خارجها، ارجع إلى قالب معتمد.',
      cardTitle: 'مثال نصي',
      cardDesc: 'أرسل جسماً نصياً بسيطاً إلى رقم E.164.',
    },
    marketing: {
      body: 'قوالب فئة التسويق تحتاج موافقة Meta وتتبع قواعد الاشتراك. أنشئها في البوابة أو عبر API القوالب، انتظر الموافقة، ثم أرسل.',
      calloutBefore:
        'زامن القوالب بعد مراجعة Meta ليبقى كتالوج تطبيقك محدّثاً — راجع',
      calloutLink: 'القوالب',
    },
    prevLabel: 'البدء',
    nextLabel: 'أفضل الممارسات',
  },
};

export const whatsappErrorsPageCopy: Localized<
  DocMeta & {
    headers: [string, string];
    metaBody: string;
    callout: string;
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Errors — WhatsApp API | Rukny Documentation',
    metaDescription: 'Common HTTP errors returned by the Rukny WhatsApp API.',
    title: 'Errors',
    description: 'Understand common HTTP responses and how to recover.',
    toc: [
      { id: 'common', label: 'Common errors' },
      { id: 'meta', label: 'Meta errors' },
    ],
    headers: ['Status', 'Meaning'],
    metaBody:
      'When Meta rejects a register or send attempt, Rukny surfaces the Meta message when available (for example PIN mismatch or rate limits). Fix the underlying Meta condition, wait if rate-limited, then retry.',
    callout:
      'Upload media with POST /v1/whatsapp/media (scope media:upload), then pass the returned id in image, video, audio, or document payloads.',
    prevLabel: 'Webhooks',
    nextLabel: 'Sending examples',
  },
  ar: {
    metaTitle: 'الأخطاء — WhatsApp API | توثيق رُكني',
    metaDescription: 'أخطاء HTTP الشائعة التي يعيدها Rukny WhatsApp API.',
    title: 'الأخطاء',
    description: 'افهم استجابات HTTP الشائعة وكيف تتعافى منها.',
    toc: [
      { id: 'common', label: 'أخطاء شائعة' },
      { id: 'meta', label: 'أخطاء Meta' },
    ],
    headers: ['الحالة', 'المعنى'],
    metaBody:
      'عندما ترفض Meta محاولة تسجيل أو إرسال، تعرض رُكني رسالة Meta عند توفرها (مثل عدم تطابق PIN أو حدود المعدل). أصلح حالة Meta الأساسية، وانتظر إن حُدّ المعدل، ثم أعد المحاولة.',
    callout:
      'ارفع الوسائط عبر POST /v1/whatsapp/media (صلاحية media:upload)، ثم مرّر المعرّف المُعاد في رسائل image أو video أو audio أو document.',
    prevLabel: 'ويب هوك',
    nextLabel: 'أمثلة الإرسال',
  },
};
