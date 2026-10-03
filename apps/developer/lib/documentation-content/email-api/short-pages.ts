import type { Localized, DocMeta } from '../types';

export const emailReferenceCopy: Localized<
  DocMeta & {
    headersAuth: [string, string, string];
    headersMessages: [string, string, string, string];
    authRows: { required: string; notes: string }[];
    summaries: Record<string, string>;
    prevLabel: string;
  }
> = {
  en: {
    metaTitle: 'API reference — Email API | Rukny Documentation',
    metaDescription: 'REST endpoint reference for the public Rukny Email API.',
    title: 'API reference',
    description:
      'Public endpoints you call with an API key. Domain and sender setup happen in the developer portal.',
    toc: [
      { id: 'base', label: 'Base URL' },
      { id: 'auth', label: 'Auth headers' },
      { id: 'messages', label: 'Messages' },
    ],
    headersAuth: ['Header', 'Required', 'Notes'],
    headersMessages: ['Method', 'Path', 'Scopes', 'Summary'],
    authRows: [
      { required: 'Always', notes: 'rk_live_… or rk_test_…' },
      {
        required: 'When sending',
        notes: 'Required on POST /email/messages (8–128 chars)',
      },
      { required: 'JSON bodies', notes: 'application/json' },
    ],
    summaries: {
      sendMessage: 'Send one transactional email from an authorized sender.',
      getMessage: 'Read operational delivery status for a message id.',
    },
    prevLabel: 'REST & curl',
  },
  ar: {
    metaTitle: 'مرجع API — Email API | توثيق رُكني',
    metaDescription: 'مرجع نقاط REST لـ Rukny Email API العام.',
    title: 'مرجع API',
    description:
      'نقاط عامة تستدعيها بمفتاح API. إعداد النطاق والمُرسِل يتم في بوابة المطوّرين.',
    toc: [
      { id: 'base', label: 'الرابط الأساسي' },
      { id: 'auth', label: 'ترويسات المصادقة' },
      { id: 'messages', label: 'الرسائل' },
    ],
    headersAuth: ['الترويسة', 'مطلوب', 'ملاحظات'],
    headersMessages: ['الطريقة', 'المسار', 'الصلاحيات', 'الملخص'],
    authRows: [
      { required: 'دائماً', notes: 'rk_live_… أو rk_test_…' },
      {
        required: 'عند الإرسال',
        notes: 'مطلوب على POST /email/messages (8–128 حرفاً)',
      },
      { required: 'أجسام JSON', notes: 'application/json' },
    ],
    summaries: {
      sendMessage: 'أرسل بريداً معاملاتياً واحداً من مُرسِل مصرّح.',
      getMessage: 'اقرأ حالة التوصيل التشغيلية لمعرّف رسالة.',
    },
    prevLabel: 'REST و curl',
  },
};

export const emailErrorsCopy: Localized<
  DocMeta & {
    httpHeaders: [string, string, string];
    commonHeaders: [string, string];
    errorDescriptions: Record<number, string>;
    commonRows: [string, string][];
    sdkBody: string;
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Errors — Email API | Rukny Documentation',
    metaDescription: 'HTTP status codes and SDK error handling for the Email API.',
    title: 'Errors',
    description:
      'Failures use standard HTTP status codes. The Node SDK surfaces them as RuknyEmailError with status and body.',
    toc: [
      { id: 'http', label: 'HTTP status codes' },
      { id: 'common', label: 'Common causes' },
      { id: 'sdk', label: 'SDK errors' },
    ],
    httpHeaders: ['Status', 'Code', 'Description'],
    commonHeaders: ['Symptom', 'Likely fix'],
    errorDescriptions: {
      400: 'Invalid payload, missing Idempotency-Key, or malformed addresses.',
      401: 'Missing or invalid API key.',
      403: 'Insufficient scope, product not installed, sender not authorized, recipient suppressed, or quota exceeded.',
      404: 'Message was not found for this key.',
      429: 'Rate limit exceeded. Retry with backoff.',
      503: 'Upstream provider temporarily unavailable.',
    },
    commonRows: [
      [
        '403 sender not authorized',
        'Verify domain, then authorize the from address for this app.',
      ],
      [
        '403 product not installed',
        'Install Email API on the app that owns the API key.',
      ],
      [
        '403 recipient suppressed',
        'Remove the address from suppression only if bounce was a mistake.',
      ],
      [
        '400 missing Idempotency-Key',
        'Send an 8–128 character key on every live POST.',
      ],
      [
        '402 quota exceeded',
        'Upgrade plan, buy an overage pack, or wait for the next cycle. Use test keys meanwhile.',
      ],
    ],
    sdkBody:
      'Retry 429 and 5xx with backoff. Fix the request for 4xx before retrying with a new idempotency key only when the business event itself is new.',
    prevLabel: 'Quotas & limits',
    nextLabel: 'Node.js SDK',
  },
  ar: {
    metaTitle: 'الأخطاء — Email API | توثيق رُكني',
    metaDescription: 'رموز حالة HTTP ومعالجة أخطاء SDK لـ Email API.',
    title: 'الأخطاء',
    description:
      'تستخدم الإخفاقات رموز HTTP القياسية. يعرضها Node SDK كـ RuknyEmailError مع الحالة والجسم.',
    toc: [
      { id: 'http', label: 'رموز حالة HTTP' },
      { id: 'common', label: 'أسباب شائعة' },
      { id: 'sdk', label: 'أخطاء SDK' },
    ],
    httpHeaders: ['الحالة', 'الرمز', 'الوصف'],
    commonHeaders: ['العَرَض', 'الإصلاح المحتمل'],
    errorDescriptions: {
      400: 'حمولة غير صالحة، أو Idempotency-Key مفقود، أو عناوين تالفة.',
      401: 'مفتاح API مفقود أو غير صالح.',
      403: 'صلاحية غير كافية، أو المنتج غير مثبت، أو المُرسِل غير مصرّح، أو المستلم مكبوت، أو تجاوز الحصة.',
      404: 'لم تُعثر على الرسالة لهذا المفتاح.',
      429: 'تم تجاوز حد المعدل. أعد المحاولة مع تراجع تدريجي.',
      503: 'المزوّد العلوي غير متاح مؤقتاً.',
    },
    commonRows: [
      [
        '403 المُرسِل غير مصرّح',
        'وثّق النطاق ثم صرّح بعنوان from لهذا التطبيق.',
      ],
      [
        '403 المنتج غير مثبت',
        'ثبّت Email API على التطبيق الذي يملك مفتاح API.',
      ],
      [
        '403 المستلم مكبوت',
        'أزل العنوان من الكبت فقط إن كان الارتداد خطأً.',
      ],
      [
        '400 Idempotency-Key مفقود',
        'أرسل مفتاحاً من 8–128 حرفاً في كل POST حي.',
      ],
      [
        '402 تجاوز الحصة',
        'رقِّ الخطة أو اشترِ حزمة تجاوز أو انتظر الدورة التالية. استخدم مفاتيح الاختبار مؤقتاً.',
      ],
    ],
    sdkBody:
      'أعد محاولة 429 و5xx مع تراجع تدريجي. أصلح الطلب لـ 4xx قبل إعادة المحاولة بمفتاح Idempotency جديد فقط عندما يكون حدث العمل نفسه جديداً.',
    prevLabel: 'الحصص والحدود',
    nextLabel: 'Node.js SDK',
  },
};

export const emailRestCopy: Localized<
  DocMeta & {
    calloutBefore: string;
    calloutLink: string;
    calloutAfter: string;
    sendIntro: string;
    goodFitTitle: string;
    goodFit: string[];
    preferSdkTitle: string;
    preferSdk: string[];
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'REST & curl — Email API | Rukny Documentation',
    metaDescription:
      'Call the Email API with curl, fetch, Python requests, or any HTTPS client.',
    title: 'REST & curl',
    description:
      'Use plain HTTPS if you are not on Node.js. The same endpoints power the SDK — headers and bodies are identical.',
    toc: [
      { id: 'base', label: 'Base URL' },
      { id: 'send', label: 'Send with curl / Node / Python' },
      { id: 'status', label: 'Check status' },
      { id: 'when', label: 'When to use REST' },
    ],
    calloutBefore: 'Prefer the',
    calloutLink: 'Node.js SDK',
    calloutAfter:
      'when you can. REST is ideal for Go, PHP, Ruby, Python, and shell scripts.',
    sendIntro:
      'Switch languages in the panel. The SDK tab shows the equivalent @rukny/email call.',
    goodFitTitle: 'Good fit',
    goodFit: [
      'Non-Node backends',
      'One-off scripts and ops runbooks',
      'Quick debugging with curl',
    ],
    preferSdkTitle: 'Prefer the SDK when',
    preferSdk: [
      'You already run Node or TypeScript',
      'You want typed inputs and RuknyEmailError',
      'You want idempotency headers handled for you',
    ],
    prevLabel: 'Node.js SDK',
    nextLabel: 'API reference',
  },
  ar: {
    metaTitle: 'REST و curl — Email API | توثيق رُكني',
    metaDescription:
      'استدعِ Email API عبر curl أو fetch أو Python requests أو أي عميل HTTPS.',
    title: 'REST و curl',
    description:
      'استخدم HTTPS العادي إن لم تكن على Node.js. نفس النقاط تشغّل الـ SDK — الترويسات والأجسام متطابقة.',
    toc: [
      { id: 'base', label: 'الرابط الأساسي' },
      { id: 'send', label: 'أرسل بـ curl / Node / Python' },
      { id: 'status', label: 'تحقق من الحالة' },
      { id: 'when', label: 'متى تستخدم REST' },
    ],
    calloutBefore: 'فضّل',
    calloutLink: 'Node.js SDK',
    calloutAfter:
      'عندما تستطيع. REST مثالي لـ Go وPHP وRuby وPython وسكربتات shell.',
    sendIntro:
      'بدّل اللغات في اللوحة. تبويب SDK يعرض استدعاء @rukny/email المكافئ.',
    goodFitTitle: 'مناسب لـ',
    goodFit: [
      'خوادم غير Node',
      'سكربتات لمرة واحدة ودفاتر العمليات',
      'تصحيح سريع بـ curl',
    ],
    preferSdkTitle: 'فضّل الـ SDK عندما',
    preferSdk: [
      'تشغّل Node أو TypeScript بالفعل',
      'تريد مدخلات مكتوبة الأنواع وRuknyEmailError',
      'تريد معالجة ترويسات Idempotency نيابةً عنك',
    ],
    prevLabel: 'Node.js SDK',
    nextLabel: 'مرجع API',
  },
};
