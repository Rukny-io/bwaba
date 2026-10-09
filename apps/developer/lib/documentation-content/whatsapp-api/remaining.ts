import type { Localized, DocMeta } from '../types';

export const whatsappAuthCopy: Localized<DocMeta & {
  baseAfter: string;
  keysIntro: string;
  keyHeaders: [string, string, string];
  liveEnv: string; liveBehavior: string;
  testEnv: string; testBehavior: string;
  importantTitle: string; importantBody: string;
  headersIntro: string;
  scopeHeaders: [string, string];
  scopes: [string, string][];
  walletBody: string;
  prevLabel: string; nextLabel: string;
}> = {
  en: {
    metaTitle: 'Authentication — WhatsApp API | Rukny Documentation',
    metaDescription: 'API keys, scopes, and base URL for the Rukny WhatsApp API.',
    title: 'Authentication',
    description: 'Every request authenticates with an app-scoped API key. Outbound live traffic also requires wallet balance.',
    toc: [
      { id: 'base-url', label: 'Base URL' },
      { id: 'keys', label: 'API keys' },
      { id: 'headers', label: 'Headers' },
      { id: 'scopes', label: 'Scopes' },
      { id: 'wallet', label: 'Wallet' },
    ],
    baseAfter: 'All WhatsApp paths are relative to this base, for example /whatsapp/messages.',
    keysIntro: 'Create keys in the developer dashboard. The prefix tells you which environment you are in:',
    keyHeaders: ['Prefix', 'Environment', 'Behavior'],
    liveEnv: 'Live',
    liveBehavior: 'Debits wallet. Sends to real recipients via Meta.',
    testEnv: 'Test',
    testBehavior: 'Use with portal Try it and staging. Still requires a linked WABA for real Meta delivery.',
    importantTitle: 'Important',
    importantBody: 'Never expose keys in browsers, mobile apps, or client-side bundles.',
    headersIntro: 'With @rukny/whatsapp, pass apiKey in the constructor — headers are set for you.',
    scopeHeaders: ['Scope', 'Description'],
    scopes: [
      ['whatsapp:send', 'Send outbound WhatsApp messages'],
      ['whatsapp:read', 'Read message status and history'],
      ['templates:read', 'List and fetch templates'],
      ['templates:write', 'Create and delete templates'],
      ['contacts:read', 'Read contacts via GET /whatsapp/contacts'],
      ['contacts:write', 'Manage contacts via POST/PATCH/DELETE /whatsapp/contacts'],
      ['webhooks:manage', 'Manage webhook endpoints'],
      ['media:upload', 'Upload media via POST /whatsapp/media'],
    ],
    walletBody: 'Successful commercial sends debit the app wallet. Insufficient balance returns HTTP 402. Top up from the portal wallet before campaigns.',
    prevLabel: 'Best practices',
    nextLabel: 'Messages',
  },
  ar: {
    metaTitle: 'المصادقة — WhatsApp API | توثيق رُكني',
    metaDescription: 'مفاتيح API والصلاحيات والرابط الأساسي لـ Rukny WhatsApp API.',
    title: 'المصادقة',
    description: 'كل طلب يصادق بمفتاح API مرتبط بالتطبيق. الحركة الصادرة الحية تتطلب أيضاً رصيد محفظة.',
    toc: [
      { id: 'base-url', label: 'الرابط الأساسي' },
      { id: 'keys', label: 'مفاتيح API' },
      { id: 'headers', label: 'الترويسات' },
      { id: 'scopes', label: 'الصلاحيات' },
      { id: 'wallet', label: 'المحفظة' },
    ],
    baseAfter: 'كل مسارات واتساب نسبية لهذا الأساس، مثلاً /whatsapp/messages.',
    keysIntro: 'أنشئ المفاتيح في لوحة المطوّرين. البادئة تخبرك بأي بيئة أنت:',
    keyHeaders: ['البادئة', 'البيئة', 'السلوك'],
    liveEnv: 'حي',
    liveBehavior: 'يخصم من المحفظة. يرسل لمستلمين حقيقيين عبر Meta.',
    testEnv: 'اختبار',
    testBehavior: 'استخدمه مع جرّب في البوابة والتجريب. ما زال يتطلب WABA مرتبطاً لتسليم Meta الحقيقي.',
    importantTitle: 'مهم',
    importantBody: 'لا تعرض المفاتيح في المتصفحات أو تطبيقات الجوال أو الحزم من جهة العميل.',
    headersIntro: 'مع @rukny/whatsapp، مرّر apiKey في المُنشئ — تُضبط الترويسات لك.',
    scopeHeaders: ['الصلاحية', 'الوصف'],
    scopes: [
      ['whatsapp:send', 'إرسال رسائل واتساب صادرة'],
      ['whatsapp:read', 'قراءة حالة الرسائل والسجل'],
      ['templates:read', 'سرد وجلب القوالب'],
      ['templates:write', 'إنشاء وحذف القوالب'],
      ['contacts:read', 'قراءة جهات الاتصال عبر GET /whatsapp/contacts'],
      ['contacts:write', 'إدارة جهات الاتصال عبر POST/PATCH/DELETE /whatsapp/contacts'],
      ['webhooks:manage', 'إدارة نقاط الويب هوك'],
      ['media:upload', 'رفع الوسائط عبر POST /whatsapp/media'],
    ],
    walletBody: 'الإرسالات التجارية الناجحة تخصم من محفظة التطبيق. الرصيد غير الكافي يعيد HTTP 402. اشحن من محفظة البوابة قبل الحملات.',
    prevLabel: 'أفضل الممارسات',
    nextLabel: 'الرسائل',
  },
};

export const whatsappSdkCopy: Localized<DocMeta & {
  tipTitle: string; tipBody: string;
  methodsIntro: string; methodsLink: string;
  webhooksBefore: string; webhooksLink: string; webhooksAfter: string;
  prevLabel: string; nextLabel: string;
}> = {
  en: {
    metaTitle: 'Node.js SDK — WhatsApp API | Rukny Documentation',
    metaDescription: 'Use @rukny/whatsapp to send messages and verify webhooks.',
    title: 'Node.js SDK',
    description: 'The official TypeScript client for the Rukny WhatsApp API.',
    toc: [
      { id: 'install', label: 'Install' },
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'methods', label: 'Methods' },
      { id: 'webhooks', label: 'Webhooks' },
    ],
    tipTitle: 'Tip',
    tipBody: 'Keep the API key in environment variables. Never import the SDK in browser bundles.',
    methodsIntro: 'More send shapes live under',
    methodsLink: 'Sending examples',
    webhooksBefore: 'Use verifyWebhookSignature with the raw body and your webhook secret. See',
    webhooksLink: 'Webhooks',
    webhooksAfter: 'for the full flow.',
    prevLabel: 'OTP / authentication',
    nextLabel: 'REST & curl',
  },
  ar: {
    metaTitle: 'Node.js SDK — WhatsApp API | توثيق رُكني',
    metaDescription: 'استخدم @rukny/whatsapp لإرسال الرسائل والتحقق من الويب هوك.',
    title: 'Node.js SDK',
    description: 'عميل TypeScript الرسمي لـ Rukny WhatsApp API.',
    toc: [
      { id: 'install', label: 'التثبيت' },
      { id: 'quickstart', label: 'البدء السريع' },
      { id: 'methods', label: 'الطرق' },
      { id: 'webhooks', label: 'ويب هوك' },
    ],
    tipTitle: 'نصيحة',
    tipBody: 'أبقِ مفتاح API في متغيرات البيئة. لا تستورد الـ SDK في حزم المتصفح.',
    methodsIntro: 'أشكال إرسال إضافية في',
    methodsLink: 'أمثلة الإرسال',
    webhooksBefore: 'استخدم verifyWebhookSignature مع الجسم الخام وسر الويب هوك. راجع',
    webhooksLink: 'ويب هوك',
    webhooksAfter: 'للتدفق الكامل.',
    prevLabel: 'OTP / المصادقة',
    nextLabel: 'REST و curl',
  },
};

export const whatsappReferenceCopy: Localized<DocMeta & {
  tableHeaders: [string, string, string, string];
  openapiBody: string;
  callout: string;
  prevLabel: string;
}> = {
  en: {
    metaTitle: 'API reference — WhatsApp API | Rukny Documentation',
    metaDescription: 'Endpoint reference for the Rukny WhatsApp REST API.',
    title: 'API reference',
    description: 'Methods, paths, and scopes for the public WhatsApp REST surface.',
    toc: [
      { id: 'messages', label: 'Messages' },
      { id: 'templates', label: 'Templates' },
      { id: 'openapi', label: 'OpenAPI' },
    ],
    tableHeaders: ['Method', 'Path', 'Scopes', 'Summary'],
    openapiBody: 'Machine-readable definitions live in the monorepo at packages/whatsapp/openapi/public-v1.yaml.',
    callout: 'Portal Try it uses the same paths through the developer dashboard with a test API key.',
    prevLabel: 'REST & curl',
  },
  ar: {
    metaTitle: 'مرجع API — WhatsApp API | توثيق رُكني',
    metaDescription: 'مرجع النقاط لـ Rukny WhatsApp REST API.',
    title: 'مرجع API',
    description: 'الطرق والمسارات والصلاحيات لسطح WhatsApp REST العام.',
    toc: [
      { id: 'messages', label: 'الرسائل' },
      { id: 'templates', label: 'القوالب' },
      { id: 'openapi', label: 'OpenAPI' },
    ],
    tableHeaders: ['الطريقة', 'المسار', 'الصلاحيات', 'الملخص'],
    openapiBody: 'التعريفات المقروءة آلياً موجودة في المستودع عند packages/whatsapp/openapi/public-v1.yaml.',
    callout: 'وحدة جرّب في البوابة تستخدم نفس المسارات عبر لوحة المطوّرين بمفتاح اختبار.',
    prevLabel: 'REST و curl',
  },
};


export const whatsappWebhooksCopy: Localized<DocMeta & {
  setupSteps: string[];
  eventsIntro: string;
  verifyBody: string;
  importantTitle: string; importantBody: string;
  replayBody: string;
  prevLabel: string; nextLabel: string;
}> = {
  en: {
    metaTitle: 'Webhooks — WhatsApp API | Rukny Documentation',
    metaDescription: 'Receive WhatsApp delivery and inbound events with signed webhooks.',
    title: 'Webhooks',
    description: 'Subscribe your HTTPS endpoint to receive message and template events from Rukny.',
    toc: [
      { id: 'setup', label: 'Setup' },
      { id: 'events', label: 'Events' },
      { id: 'verify', label: 'Verify signatures' },
      { id: 'replay', label: 'Replay protection' },
    ],
    setupSteps: [
      'Create a publicly reachable HTTPS endpoint.',
      'Register the URL in the developer portal under WhatsApp → Webhooks (scope webhooks:manage).',
      'Store the webhook signing secret securely.',
      'Return HTTP 2xx quickly; process asynchronously if needed.',
    ],
    eventsIntro: 'Common event names include:',
    verifyBody: 'Validate X-Rukny-Signature (and timestamp when provided) against the raw request body and your secret.',
    importantTitle: 'Important',
    importantBody: 'Use the raw body bytes for HMAC. Parsing JSON first will break signature verification.',
    replayBody: 'Prefer rejecting duplicate X-Rukny-Delivery values. The Node SDK helper assertWebhookDeliveryNotReplayed tracks seen ids in memory — use Redis or similar in production.',
    prevLabel: 'Templates',
    nextLabel: 'Errors',
  },
  ar: {
    metaTitle: 'ويب هوك — WhatsApp API | توثيق رُكني',
    metaDescription: 'استقبل أحداث تسليم ووارد واتساب عبر ويب هوك موقّعة.',
    title: 'ويب هوك',
    description: 'اشترك بنقطة HTTPS لاستقبال أحداث الرسائل والقوالب من رُكني.',
    toc: [
      { id: 'setup', label: 'الإعداد' },
      { id: 'events', label: 'الأحداث' },
      { id: 'verify', label: 'التحقق من التوقيع' },
      { id: 'replay', label: 'حماية إعادة التشغيل' },
    ],
    setupSteps: [
      'أنشئ نقطة HTTPS يمكن الوصول إليها عاماً.',
      'سجّل الرابط في بوابة المطوّرين تحت واتساب → ويب هوك (صلاحية webhooks:manage).',
      'خزّن سر توقيع الويب هوك بأمان.',
      'أعد HTTP 2xx بسرعة؛ عالج بشكل غير متزامن إن لزم.',
    ],
    eventsIntro: 'أسماء الأحداث الشائعة تشمل:',
    verifyBody: 'تحقق من X-Rukny-Signature (والطابع الزمني عند توفره) مقابل جسم الطلب الخام وسرك.',
    importantTitle: 'مهم',
    importantBody: 'استخدم بايتات الجسم الخام لـ HMAC. تحليل JSON أولاً سيكسر التحقق من التوقيع.',
    replayBody: 'فضّل رفض قيم X-Rukny-Delivery المكررة. مساعد Node SDK المسمى assertWebhookDeliveryNotReplayed يتتبع المعرّفات في الذاكرة — استخدم Redis أو مشابهاً في الإنتاج.',
    prevLabel: 'القوالب',
    nextLabel: 'الأخطاء',
  },
};

export const whatsappTemplatesCopy: Localized<DocMeta & {
  overviewBody: string; callout: string;
  endpointHeaders: [string, string, string];
  createExample: string;
  categoryHeaders: [string, string];
  categories: [string, string][];
  syncBody: string;
  prevLabel: string; nextLabel: string;
}> = {
  en: {
    metaTitle: 'Templates — WhatsApp API | Rukny Documentation',
    metaDescription: 'Create, sync, and manage WhatsApp message templates with Rukny.',
    title: 'Templates',
    description: 'Templates are required for most outbound messages outside the customer care window. Manage them through the API or the developer portal.',
    toc: [
      { id: 'overview', label: 'Overview' },
      { id: 'endpoints', label: 'Endpoints' },
      { id: 'categories', label: 'Categories' },
      { id: 'sync', label: 'Sync from Meta' },
    ],
    overviewBody: 'Templates live on the WABA in Meta. Rukny mirrors them in your app so you can list, create, delete, and sync. Only APPROVED templates can be sent.',
    callout: 'Creating a template submits it to Meta for review. Expect a delay before status becomes approved or rejected.',
    endpointHeaders: ['Method', 'Path', 'Summary'],
    createExample: 'Create example:',
    categoryHeaders: ['Category', 'Typical use'],
    categories: [
      ['AUTHENTICATION', 'OTP and verification codes'],
      ['UTILITY', 'Orders, appointments, account updates'],
      ['MARKETING', 'Promotions and opt-in campaigns'],
    ],
    syncBody: 'After Meta approves or rejects a template, sync from the portal or API so your local catalog matches Meta. Sending with a stale name or language fails.',
    prevLabel: 'Messages',
    nextLabel: 'Webhooks',
  },
  ar: {
    metaTitle: 'القوالب — WhatsApp API | توثيق رُكني',
    metaDescription: 'أنشئ وزامن وأدر قوالب رسائل واتساب مع رُكني.',
    title: 'القوالب',
    description: 'القوالب مطلوبة لمعظم الرسائل الصادرة خارج نافذة رعاية العملاء. أدِرها عبر API أو بوابة المطوّرين.',
    toc: [
      { id: 'overview', label: 'نظرة عامة' },
      { id: 'endpoints', label: 'النقاط' },
      { id: 'categories', label: 'الفئات' },
      { id: 'sync', label: 'المزامنة من Meta' },
    ],
    overviewBody: 'تعيش القوالب على WABA في Meta. تعكسها رُكني في تطبيقك لتسرد وتنشئ وتحذف وتزامن. فقط القوالب APPROVED يمكن إرسالها.',
    callout: 'إنشاء قالب يرسله لمراجعة Meta. توقّع تأخيراً قبل أن تصبح الحالة معتمدة أو مرفوضة.',
    endpointHeaders: ['الطريقة', 'المسار', 'الملخص'],
    createExample: 'مثال الإنشاء:',
    categoryHeaders: ['الفئة', 'الاستخدام النموذجي'],
    categories: [
      ['AUTHENTICATION', 'OTP ورموز التحقق'],
      ['UTILITY', 'الطلبات والمواعيد وتحديثات الحساب'],
      ['MARKETING', 'العروض وحملات الاشتراك'],
    ],
    syncBody: 'بعد موافقة Meta أو رفضها لقالب، زامن من البوابة أو API ليطابق كتالوجك المحلي Meta. الإرسال باسم أو لغة قديمة يفشل.',
    prevLabel: 'الرسائل',
    nextLabel: 'ويب هوك',
  },
};

export const whatsappGetStartedCopy: Localized<DocMeta & {
  beforeItems: string[];
  setupTitle: string;
  steps: { title: string; body: string }[];
  tipTitle: string; tipBody: string;
  sendTitle: string; sendIntro: string;
  sendOtherBefore: string; sendLink: string; sendOtherAfter: string;
  verifyTitle: string; verifyBody: string;
  nextTitle: string;
  nextItems: { before: string; link: string; after: string; href: string }[];
  prevLabel: string; nextLabel: string;
}> = {
  en: {
    metaTitle: 'Get started — WhatsApp API | Rukny Documentation',
    metaDescription: 'Connect a WABA, create an API key, and send your first WhatsApp message with Rukny.',
    title: 'Get started',
    description: 'Go from zero to an accepted WhatsApp message in a few steps. Connect Meta, fund the wallet, then send from your server with a live key.',
    toc: [
      { id: 'before-you-begin', label: 'Before you begin' },
      { id: 'setup', label: 'Setup' },
      { id: 'send', label: 'Send your first message' },
      { id: 'verify', label: 'Verify delivery' },
      { id: 'next', label: 'What next' },
    ],
    beforeItems: [
      'A Rukny developer account',
      'A Meta Business portfolio you can authorize',
      'A server environment where you can keep API keys private',
    ],
    setupTitle: 'Setup',
    steps: [
      { title: 'Create an app and install WhatsApp API', body: 'Open the dashboard, create or select an app, then install WhatsApp API from Products.' },
      { title: 'Connect WhatsApp Business', body: 'Open WhatsApp Business in the portal and complete Meta Embedded Signup. Link at least one phone number and finish any payment method steps Meta requires for commercial messaging.' },
      { title: 'Top up the app wallet', body: 'Live outbound messages debit the app wallet. Transfer funds from your main wallet before sending production traffic.' },
      { title: 'Create an API key', body: 'Create a live key with at least whatsapp:send. Add whatsapp:read and templates:read as needed. Store the rk_live_ secret on your server.' },
    ],
    tipTitle: 'Tip',
    tipBody: 'Outside the 24-hour customer care window you must use an approved template. Create and sync templates in the portal before sending utility or auth messages cold.',
    sendTitle: 'Send your first message',
    sendIntro: 'Send a session text while the care window is open, or an approved template anytime:',
    sendOtherBefore: 'More recipes:',
    sendLink: 'Sending examples',
    sendOtherAfter: '.',
    verifyTitle: 'Verify delivery',
    verifyBody: 'Poll message status with GET /whatsapp/messages/:id or subscribe to webhooks for delivery updates. Prefer webhooks in production.',
    nextTitle: 'What next',
    nextItems: [
      { before: 'Read', link: 'Authentication', after: 'for keys, scopes, and wallet rules.', href: '/documentation/whatsapp-api/authentication' },
      { before: 'Browse', link: 'Use cases', after: 'for OTP and order patterns.', href: '/documentation/whatsapp-api/use-cases' },
      { before: 'Follow', link: 'Best practices', after: 'before going live.', href: '/documentation/whatsapp-api/best-practices' },
    ],
    prevLabel: 'Overview',
    nextLabel: 'Use cases',
  },
  ar: {
    metaTitle: 'البدء — WhatsApp API | توثيق رُكني',
    metaDescription: 'اربط WABA، أنشئ مفتاح API، وأرسل أول رسالة واتساب مع رُكني.',
    title: 'البدء',
    description: 'من الصفر إلى رسالة واتساب مقبولة في خطوات قليلة. اربط Meta، موّل المحفظة، ثم أرسل من خادمك بمفتاح live.',
    toc: [
      { id: 'before-you-begin', label: 'قبل أن تبدأ' },
      { id: 'setup', label: 'الإعداد' },
      { id: 'send', label: 'أرسل أول رسالة' },
      { id: 'verify', label: 'تحقق من التوصيل' },
      { id: 'next', label: 'ماذا بعد' },
    ],
    beforeItems: [
      'حساب مطوّر في رُكني',
      'محفظة Meta Business يمكنك تفويضها',
      'بيئة خادم يمكنك فيها إبقاء مفاتيح API خاصة',
    ],
    setupTitle: 'الإعداد',
    steps: [
      { title: 'أنشئ تطبيقاً وثبّت WhatsApp API', body: 'افتح لوحة التحكم، أنشئ أو اختر تطبيقاً، ثم ثبّت WhatsApp API من المنتجات.' },
      { title: 'اربط WhatsApp Business', body: 'افتح واتساب بزنس في البوابة وأكمل Meta Embedded Signup. اربط رقماً واحداً على الأقل وأنهِ أي خطوات دفع تطلبها Meta للمراسلة التجارية.' },
      { title: 'اشحن محفظة التطبيق', body: 'الرسائل الصادرة الحية تخصم من محفظة التطبيق. حوّل أموالاً من محفظتك الرئيسية قبل حركة الإنتاج.' },
      { title: 'أنشئ مفتاح API', body: 'أنشئ مفتاح live بصلاحية whatsapp:send على الأقل. أضف whatsapp:read وtemplates:read حسب الحاجة. احفظ سر rk_live_ على خادمك فقط.' },
    ],
    tipTitle: 'نصيحة',
    tipBody: 'خارج نافذة رعاية العملاء لمدة 24 ساعة يجب استخدام قالب معتمد. أنشئ وزامن القوالب في البوابة قبل إرسال رسائل المرافق أو المصادقة على البارد.',
    sendTitle: 'أرسل أول رسالة',
    sendIntro: 'أرسل نص جلسة بينما نافذة الرعاية مفتوحة، أو قالباً معتمداً في أي وقت:',
    sendOtherBefore: 'المزيد من الوصفات:',
    sendLink: 'أمثلة الإرسال',
    sendOtherAfter: '.',
    verifyTitle: 'تحقق من التوصيل',
    verifyBody: 'استطلع حالة الرسالة بـ GET /whatsapp/messages/:id أو اشترك في الويب هوك لتحديثات التسليم. فضّل الويب هوك في الإنتاج.',
    nextTitle: 'ماذا بعد',
    nextItems: [
      { before: 'اقرأ', link: 'المصادقة', after: 'للمفاتيح والصلاحيات وقواعد المحفظة.', href: '/documentation/whatsapp-api/authentication' },
      { before: 'تصفّح', link: 'حالات الاستخدام', after: 'لأنماط OTP والطلبات.', href: '/documentation/whatsapp-api/use-cases' },
      { before: 'اتبع', link: 'أفضل الممارسات', after: 'قبل الإطلاق الحي.', href: '/documentation/whatsapp-api/best-practices' },
    ],
    prevLabel: 'نظرة عامة',
    nextLabel: 'حالات الاستخدام',
  },
};

export const whatsappMessagesCopy: Localized<DocMeta & {
  requiredScope: string;
  seeExamplesBefore: string; seeExamplesLink: string; seeExamplesAfter: string;
  typesIntro: string;
  types: { title: string; body: string }[];
  windowBody: string;
  fieldHeaders: [string, string, string, string];
  yes: string; no: string;
  responseExample: string;
  prevLabel: string; nextLabel: string;
}> = {
  en: {
    metaTitle: 'Messages — WhatsApp API | Rukny Documentation',
    metaDescription: 'Send and fetch WhatsApp messages with the Rukny API.',
    title: 'Messages',
    description: 'Send outbound WhatsApp messages and look up delivery status.',
    toc: [
      { id: 'send', label: 'Send a message' },
      { id: 'status', label: 'Get message status' },
      { id: 'types', label: 'Message types' },
      { id: 'window', label: 'Customer care window' },
    ],
    requiredScope: 'Required scope:',
    seeExamplesBefore: 'See',
    seeExamplesLink: 'Sending examples',
    seeExamplesAfter: 'for text, template, and OTP payloads.',
    typesIntro: 'Common outbound shapes:',
    types: [
      { title: 'text', body: 'Free-form body inside an open care window.' },
      { title: 'template', body: 'Approved template name, language, and variables.' },
      { title: 'otp', body: 'AUTHENTICATION template helper for one-time codes.' },
    ],
    windowBody: 'After a customer messages you, Meta opens a care window (typically 24 hours) where free-form text is allowed. Outside that window, send an approved template instead.',
    fieldHeaders: ['Field', 'Type', 'Required', 'Description'],
    yes: 'Yes',
    no: 'No',
    responseExample: 'Example response:',
    prevLabel: 'Authentication',
    nextLabel: 'Templates',
  },
  ar: {
    metaTitle: 'الرسائل — WhatsApp API | توثيق رُكني',
    metaDescription: 'أرسل واجلب رسائل واتساب عبر Rukny API.',
    title: 'الرسائل',
    description: 'أرسل رسائل واتساب صادرة وابحث عن حالة التسليم.',
    toc: [
      { id: 'send', label: 'أرسل رسالة' },
      { id: 'status', label: 'احصل على حالة الرسالة' },
      { id: 'types', label: 'أنواع الرسائل' },
      { id: 'window', label: 'نافذة رعاية العملاء' },
    ],
    requiredScope: 'الصلاحية المطلوبة:',
    seeExamplesBefore: 'راجع',
    seeExamplesLink: 'أمثلة الإرسال',
    seeExamplesAfter: 'لحمولات النص والقالب وOTP.',
    typesIntro: 'أشكال الإرسال الشائعة:',
    types: [
      { title: 'text', body: 'جسم حر داخل نافذة رعاية مفتوحة.' },
      { title: 'template', body: 'اسم قالب معتمد ولغة ومتغيرات.' },
      { title: 'otp', body: 'مساعد قالب AUTHENTICATION لرموز لمرة واحدة.' },
    ],
    windowBody: 'بعد أن يراسلك عميل، تفتح Meta نافذة رعاية (عادة 24 ساعة) يُسمح فيها بالنص الحر. خارجها، أرسل قالباً معتمداً بدل ذلك.',
    fieldHeaders: ['الحقل', 'النوع', 'مطلوب', 'الوصف'],
    yes: 'نعم',
    no: 'لا',
    responseExample: 'مثال الاستجابة:',
    prevLabel: 'المصادقة',
    nextLabel: 'القوالب',
  },
};
