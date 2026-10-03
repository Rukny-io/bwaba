import type { Localized, DocMeta } from '../types';

export const emailAuthCopy: Localized<DocMeta & {
  keysIntro: string;
  keyHeaders: [string, string, string];
  liveEnv: string; liveBehavior: string;
  testEnv: string; testBehavior: string;
  importantTitle: string; importantBody: string;
  headersIntro: string;
  scopeHeaders: [string, string];
  scopeDescriptions: Record<string, string>;
  idemBody: string; idemItems: string[];
  envBody: string;
  prevLabel: string; nextLabel: string;
}> = {
  en: {
    metaTitle: 'Authentication — Email API | Rukny Documentation',
    metaDescription: 'API keys, scopes, and idempotency for the Rukny Email API.',
    title: 'Authentication',
    description: 'Every request authenticates with an app-scoped API key. Live sends also require an idempotency key so retries stay safe.',
    toc: [
      { id: 'keys', label: 'API keys' },
      { id: 'headers', label: 'Headers' },
      { id: 'scopes', label: 'Scopes' },
      { id: 'idempotency', label: 'Idempotency' },
      { id: 'environments', label: 'Environments' },
    ],
    keysIntro: 'Create keys in the developer dashboard. The prefix tells you which environment you are in:',
    keyHeaders: ['Prefix', 'Environment', 'Behavior'],
    liveEnv: 'Live',
    liveBehavior: 'Counts against quota. Sends to real recipients.',
    testEnv: 'Test',
    testBehavior: 'Can only deliver to your account email or an address on a verified domain you own.',
    importantTitle: 'Important',
    importantBody: 'Never expose keys in browsers, mobile apps, or client-side bundles. The Node SDK refuses to run in the browser for this reason.',
    headersIntro: 'With @rukny/email, pass apiKey in the constructor and idempotencyKey on each send call — headers are set for you.',
    scopeHeaders: ['Scope', 'Description'],
    scopeDescriptions: {
      'email:send': 'Send transactional email',
      'email:read': 'Read delivery status',
    },
    idemBody: 'Idempotency keys must be 8–128 characters: letters, numbers, hyphens, or underscores. Reusing a key with the same API key returns the original result instead of creating another send.',
    idemItems: [
      'Use a new key for each distinct business event.',
      'Reuse the same key when retrying the same event after a timeout.',
      'Good examples: order_98421_receipt, otp_user42_v3',
    ],
    envBody: 'Keep separate keys for staging and production. Test mode validates your integration without spending quota or emailing customers. Switch to live only after domain verification and sender authorization succeed.',
    prevLabel: 'Best practices',
    nextLabel: 'Messages',
  },
  ar: {
    metaTitle: 'المصادقة — Email API | توثيق رُكني',
    metaDescription: 'مفاتيح API والصلاحيات وIdempotency لـ Rukny Email API.',
    title: 'المصادقة',
    description: 'كل طلب يصادق بمفتاح API مرتبط بالتطبيق. الإرسال الحي يتطلب أيضاً مفتاح Idempotency حتى تبقى إعادة المحاولة آمنة.',
    toc: [
      { id: 'keys', label: 'مفاتيح API' },
      { id: 'headers', label: 'الترويسات' },
      { id: 'scopes', label: 'الصلاحيات' },
      { id: 'idempotency', label: 'Idempotency' },
      { id: 'environments', label: 'البيئات' },
    ],
    keysIntro: 'أنشئ المفاتيح في لوحة المطوّرين. البادئة تخبرك بأي بيئة أنت:',
    keyHeaders: ['البادئة', 'البيئة', 'السلوك'],
    liveEnv: 'حي',
    liveBehavior: 'يُحسب من الحصة. يُرسل لمستلمين حقيقيين.',
    testEnv: 'اختبار',
    testBehavior: 'يمكنه التسليم فقط لبريد حسابك أو عنوان على نطاق موثّق تملكه.',
    importantTitle: 'مهم',
    importantBody: 'لا تعرض المفاتيح في المتصفحات أو تطبيقات الجوال أو الحزم من جهة العميل. يرفض Node SDK العمل في المتصفح لهذا السبب.',
    headersIntro: 'مع @rukny/email، مرّر apiKey في المُنشئ وidempotencyKey في كل استدعاء send — تُضبط الترويسات لك.',
    scopeHeaders: ['الصلاحية', 'الوصف'],
    scopeDescriptions: {
      'email:send': 'إرسال بريد معاملاتي',
      'email:read': 'قراءة حالة التوصيل',
    },
    idemBody: 'يجب أن تكون مفاتيح Idempotency من 8–128 حرفاً: حروف وأرقام وشرطات أو شرطات سفلية. إعادة استخدام مفتاح بنفس مفتاح API تعيد النتيجة الأصلية بدل إنشاء إرسال آخر.',
    idemItems: [
      'استخدم مفتاحاً جديداً لكل حدث عمل مميز.',
      'أعد استخدام نفس المفتاح عند إعادة محاولة نفس الحدث بعد مهلة.',
      'أمثلة جيدة: order_98421_receipt، otp_user42_v3',
    ],
    envBody: 'أبقِ مفاتيح منفصلة للتجريب والإنتاج. وضع الاختبار يتحقق من تكاملك دون صرف الحصة أو مراسلة العملاء. انتقل للحي فقط بعد نجاح توثيق النطاق وتفويض المُرسِل.',
    prevLabel: 'أفضل الممارسات',
    nextLabel: 'الرسائل',
  },
};

export const emailTestingCopy: Localized<DocMeta & {
  modeHeaders: [string, string, string];
  modeRows: [string, string, string][];
  tipTitle: string; tipBody: string;
  tryBody: string; tryBeforeLink: string; tryLink: string;
  checklist: { title: string; description: string }[];
  prevLabel: string; nextLabel: string;
}> = {
  en: {
    metaTitle: 'Testing — Email API | Rukny Documentation',
    metaDescription: 'Test keys, portal Try it, and safe sandbox habits for Email API.',
    title: 'Testing',
    description: 'Validate your integration without emailing customers or spending live quota. Switch environments by changing the API key — not your application logic.',
    toc: [
      { id: 'modes', label: 'Test vs live' },
      { id: 'try-it', label: 'Try it console' },
      { id: 'checklist', label: 'Pre-launch checklist' },
    ],
    modeHeaders: ['', 'Test', 'Live'],
    modeRows: [
      ['Key prefix', 'rk_test_', 'rk_live_'],
      ['Recipients', 'Account email or verified domain', 'Any authorized recipient'],
      ['Quota', 'Does not consume live quota', 'Counts against plan'],
      ['Idempotency', 'Recommended', 'Required'],
    ],
    tipTitle: 'Tip',
    tipBody: 'Keep the same code path for both environments. Load the key from process.env.RUKNY_API_KEY so staging and production differ only by configuration.',
    tryBody: 'The portal includes a Try it panel that sends with a test key on your behalf. Use it to confirm domain + sender setup before writing backend code.',
    tryBeforeLink: 'Open your app → Email API → Try it after',
    tryLink: 'signing in',
    checklist: [
      { title: 'Domain verified', description: 'DNS records pass and status is verified.' },
      { title: 'Sender authorized', description: 'from address is linked to the app.' },
      { title: 'Test send works', description: 'SDK or Try it delivers to your account email.' },
      { title: 'Status polling works', description: 'getStatus returns a sensible lifecycle state.' },
      { title: 'Idempotency wired', description: 'Retries reuse the same business key.' },
      { title: 'Live key scoped', description: 'Production key has only the scopes you need.' },
    ],
    prevLabel: 'Domains',
    nextLabel: 'Quotas & limits',
  },
  ar: {
    metaTitle: 'الاختبار — Email API | توثيق رُكني',
    metaDescription: 'مفاتيح الاختبار وتجربة البوابة وعادات الصندوق الآمن لـ Email API.',
    title: 'الاختبار',
    description: 'تحقق من تكاملك دون مراسلة العملاء أو صرف الحصة الحية. بدّل البيئات بتغيير مفتاح API — لا منطق التطبيق.',
    toc: [
      { id: 'modes', label: 'اختبار مقابل حي' },
      { id: 'try-it', label: 'وحدة جرّب' },
      { id: 'checklist', label: 'قائمة ما قبل الإطلاق' },
    ],
    modeHeaders: ['', 'اختبار', 'حي'],
    modeRows: [
      ['بادئة المفتاح', 'rk_test_', 'rk_live_'],
      ['المستلمون', 'بريد الحساب أو نطاق موثّق', 'أي مستلم مصرّح'],
      ['الحصة', 'لا تستهلك الحصة الحية', 'تُحسب من الخطة'],
      ['Idempotency', 'موصى به', 'مطلوب'],
    ],
    tipTitle: 'نصيحة',
    tipBody: 'أبقِ نفس مسار الكود للبيئتين. حمّل المفتاح من process.env.RUKNY_API_KEY ليختلف التجريب والإنتاج بالإعداد فقط.',
    tryBody: 'تتضمن البوابة لوحة جرّب ترسل بمفتاح اختبار نيابةً عنك. استخدمها لتأكيد إعداد النطاق والمُرسِل قبل كتابة كود الخادم.',
    tryBeforeLink: 'افتح تطبيقك → Email API → جرّب بعد',
    tryLink: 'تسجيل الدخول',
    checklist: [
      { title: 'النطاق موثّق', description: 'سجلات DNS ناجحة والحالة موثّقة.' },
      { title: 'المُرسِل مصرّح', description: 'عنوان from مرتبط بالتطبيق.' },
      { title: 'إرسال الاختبار يعمل', description: 'SDK أو جرّب يوصل لبريد حسابك.' },
      { title: 'استطلاع الحالة يعمل', description: 'getStatus يعيد حالة دورة حياة منطقية.' },
      { title: 'Idempotency مربوط', description: 'إعادة المحاولة تعيد استخدام نفس مفتاح العمل.' },
      { title: 'المفتاح الحي مقيّد', description: 'مفتاح الإنتاج يملك فقط الصلاحيات التي تحتاجها.' },
    ],
    prevLabel: 'النطاقات',
    nextLabel: 'الحصص والحدود',
  },
};

export const emailGetStartedCopy: Localized<DocMeta & {
  beforeItems: string[];
  setupTitle: string;
  steps: { title: string; body: string }[];
  tipTitle: string; tipBody: string;
  sendTitle: string; sendIntro: string;
  sendOtherBefore: string; sendExamples: string; sendOtherMid: string; sendRest: string;
  verifyTitle: string; verifyP1: string; verifyP2: string;
  nextTitle: string;
  nextItems: { before: string; link: string; after: string; href: string }[];
  prevLabel: string; nextLabel: string;
}> = {
  en: {
    metaTitle: 'Get started — Email API | Rukny Documentation',
    metaDescription: 'Verify a domain, create an API key, and send your first email with Rukny.',
    title: 'Get started',
    description: 'Go from zero to a delivered transactional email in a few steps. Start in test mode, then switch to live when DNS and senders are ready.',
    toc: [
      { id: 'before-you-begin', label: 'Before you begin' },
      { id: 'setup', label: 'Setup' },
      { id: 'send', label: 'Send your first email' },
      { id: 'verify', label: 'Verify delivery' },
      { id: 'next', label: 'What next' },
    ],
    beforeItems: [
      'A Rukny developer account',
      'Permission to edit DNS for your sending domain',
      'A server environment where you can keep API keys private',
    ],
    setupTitle: 'Setup',
    steps: [
      { title: 'Create an app and install Email API', body: 'Open the dashboard, create or select an app, then install Email API from Products.' },
      { title: 'Verify your domain', body: 'In Email API → Domains, add your domain and publish the DNS records shown (SPF / DKIM). Refresh until the domain is verified.' },
      { title: 'Authorize a sender', body: 'Authorize an address on that domain, for example noreply@yourdomain.com. Only authorized senders can appear in from.' },
      { title: 'Create an API key', body: 'Create a key with at least email:send. Add email:read if you will poll delivery status. Start with a rk_test_ key.' },
    ],
    tipTitle: 'Tip',
    tipBody: 'Test keys can only send to your account email or an address on a verified domain you own. That keeps sandbox traffic safe while you wire your backend.',
    sendTitle: 'Send your first email',
    sendIntro: 'Install the SDK and send from your server:',
    sendOtherBefore: 'Using another language? Browse',
    sendExamples: 'Sending examples',
    sendOtherMid: '(Python, PHP, Go, SMTP, CLI, and more) or see',
    sendRest: 'REST & curl',
    verifyTitle: 'Verify delivery',
    verifyP1: 'Check the message status with messages.getStatus(id) using the id returned from send. Status values move through queued → sent → delivered (or bounced / complained).',
    verifyP2: 'You can also use the portal Try it console before wiring production traffic.',
    nextTitle: 'What next',
    nextItems: [
      { before: 'Read', link: 'Authentication', after: 'for scopes and idempotency rules.', href: '/documentation/email-api/authentication' },
      { before: 'Browse', link: 'Use cases', after: 'for OTP and receipt recipes.', href: '/documentation/email-api/use-cases' },
      { before: 'Follow', link: 'Best practices', after: 'before going live.', href: '/documentation/email-api/best-practices' },
    ],
    prevLabel: 'Overview',
    nextLabel: 'Use cases',
  },
  ar: {
    metaTitle: 'البدء — Email API | توثيق رُكني',
    metaDescription: 'وثّق نطاقاً، أنشئ مفتاح API، وأرسل أول بريد مع رُكني.',
    title: 'البدء',
    description: 'من الصفر إلى بريد معاملاتي مُسلَّم في خطوات قليلة. ابدأ بوضع الاختبار ثم انتقل للحي عندما يكون DNS والمُرسِلون جاهزين.',
    toc: [
      { id: 'before-you-begin', label: 'قبل أن تبدأ' },
      { id: 'setup', label: 'الإعداد' },
      { id: 'send', label: 'أرسل أول بريد' },
      { id: 'verify', label: 'تحقق من التوصيل' },
      { id: 'next', label: 'ماذا بعد' },
    ],
    beforeItems: [
      'حساب مطوّر في رُكني',
      'صلاحية تعديل DNS لنطاق الإرسال',
      'بيئة خادم يمكنك فيها إبقاء مفاتيح API خاصة',
    ],
    setupTitle: 'الإعداد',
    steps: [
      { title: 'أنشئ تطبيقاً وثبّت Email API', body: 'افتح لوحة التحكم، أنشئ أو اختر تطبيقاً، ثم ثبّت Email API من المنتجات.' },
      { title: 'وثّق نطاقك', body: 'في Email API → النطاقات، أضف نطاقك وانشر سجلات DNS المعروضة (SPF / DKIM). حدّث حتى يُوثَّق النطاق.' },
      { title: 'صرّح بمُرسِل', body: 'صرّح بعنوان على ذلك النطاق، مثل noreply@yourdomain.com. فقط المُرسِلون المصرّحون يمكن أن يظهروا في from.' },
      { title: 'أنشئ مفتاح API', body: 'أنشئ مفتاحاً بصلاحية email:send على الأقل. أضف email:read إن كنت ستستطلع حالة التوصيل. ابدأ بمفتاح rk_test_.' },
    ],
    tipTitle: 'نصيحة',
    tipBody: 'مفاتيح الاختبار ترسل فقط لبريد حسابك أو عنوان على نطاق موثّق تملكه. هذا يبقي حركة الصندوق الآمن آمنة أثناء ربط خادمك.',
    sendTitle: 'أرسل أول بريد',
    sendIntro: 'ثبّت الـ SDK وأرسل من خادمك:',
    sendOtherBefore: 'تستخدم لغة أخرى؟ تصفّح',
    sendExamples: 'أمثلة الإرسال',
    sendOtherMid: '(Python وPHP وGo وSMTP وCLI والمزيد) أو راجع',
    sendRest: 'REST و curl',
    verifyTitle: 'تحقق من التوصيل',
    verifyP1: 'تحقق من حالة الرسالة بـ messages.getStatus(id) باستخدام المعرّف المعاد من الإرسال. تمر الحالات عبر queued → sent → delivered (أو bounced / complained).',
    verifyP2: 'يمكنك أيضاً استخدام وحدة جرّب في البوابة قبل ربط حركة الإنتاج.',
    nextTitle: 'ماذا بعد',
    nextItems: [
      { before: 'اقرأ', link: 'المصادقة', after: 'للصلاحيات وقواعد Idempotency.', href: '/documentation/email-api/authentication' },
      { before: 'تصفّح', link: 'حالات الاستخدام', after: 'لوصفات OTP والإيصالات.', href: '/documentation/email-api/use-cases' },
      { before: 'اتبع', link: 'أفضل الممارسات', after: 'قبل الإطلاق الحي.', href: '/documentation/email-api/best-practices' },
    ],
    prevLabel: 'نظرة عامة',
    nextLabel: 'حالات الاستخدام',
  },
};


export const emailSdkCopy: Localized<DocMeta & {
  serverOnlyTitle: string; serverOnlyBody: string;
  configHeaders: [string, string, string];
  configRows: { opt: string; required: string; desc: string }[];
  methodsTitle: string;
  methodHeaders: [string, string];
  methods: [string, string][];
  errorsBody: string;
  prevLabel: string; nextLabel: string;
}> = {
  en: {
    metaTitle: 'Node.js SDK — Email API | Rukny Documentation',
    metaDescription: 'Install and use @rukny/email for server-side transactional email.',
    title: 'Node.js SDK',
    description: '@rukny/email is the recommended way to send email and check status from Node.js and TypeScript. Server-side only.',
    toc: [
      { id: 'install', label: 'Install' },
      { id: 'quickstart', label: 'Quickstart' },
      { id: 'config', label: 'Configuration' },
      { id: 'methods', label: 'Methods' },
      { id: 'errors', label: 'Errors' },
    ],
    serverOnlyTitle: 'Server-side only',
    serverOnlyBody: 'The package throws if it detects a browser runtime so API keys cannot leak to clients.',
    configHeaders: ['Option', 'Required', 'Description'],
    configRows: [
      { opt: 'apiKey', required: 'Yes', desc: 'Your rk_live_ or rk_test_ key' },
      { opt: 'baseUrl', required: 'No', desc: 'Defaults to https://api.rukny.io/api/v1' },
      { opt: 'timeoutMs', required: 'No', desc: 'Request timeout (default 30000)' },
      { opt: 'fetch', required: 'No', desc: 'Custom fetch implementation for tests' },
    ],
    methodsTitle: 'Messages',
    methodHeaders: ['Method', 'Description'],
    methods: [
      ['messages.send(input, options)', 'Send one transactional email'],
      ['messages.getStatus(id)', 'Read operational delivery status'],
    ],
    errorsBody: 'Failures throw RuknyEmailError with status, message, and body. See the Errors guide for HTTP codes and retry advice.',
    prevLabel: 'Errors',
    nextLabel: 'REST & curl',
  },
  ar: {
    metaTitle: 'Node.js SDK — Email API | توثيق رُكني',
    metaDescription: 'ثبّت واستخدم @rukny/email للبريد المعاملاتي من جهة الخادم.',
    title: 'Node.js SDK',
    description: '@rukny/email هي الطريقة الموصى بها لإرسال البريد وقراءة الحالة من Node.js وTypeScript. من جهة الخادم فقط.',
    toc: [
      { id: 'install', label: 'التثبيت' },
      { id: 'quickstart', label: 'البدء السريع' },
      { id: 'config', label: 'الإعداد' },
      { id: 'methods', label: 'الطرق' },
      { id: 'errors', label: 'الأخطاء' },
    ],
    serverOnlyTitle: 'من جهة الخادم فقط',
    serverOnlyBody: 'ترمي الحزمة إن اكتشفت بيئة متصفح حتى لا تتسرب مفاتيح API للعملاء.',
    configHeaders: ['الخيار', 'مطلوب', 'الوصف'],
    configRows: [
      { opt: 'apiKey', required: 'نعم', desc: 'مفتاح rk_live_ أو rk_test_' },
      { opt: 'baseUrl', required: 'لا', desc: 'الافتراضي https://api.rukny.io/api/v1' },
      { opt: 'timeoutMs', required: 'لا', desc: 'مهلة الطلب (الافتراضي 30000)' },
      { opt: 'fetch', required: 'لا', desc: 'تنفيذ fetch مخصص للاختبارات' },
    ],
    methodsTitle: 'الرسائل',
    methodHeaders: ['الطريقة', 'الوصف'],
    methods: [
      ['messages.send(input, options)', 'أرسل بريداً معاملاتياً واحداً'],
      ['messages.getStatus(id)', 'اقرأ حالة التوصيل التشغيلية'],
    ],
    errorsBody: 'ترمي الإخفاقات RuknyEmailError مع الحالة والرسالة والجسم. راجع دليل الأخطاء لرموز HTTP ونصائح إعادة المحاولة.',
    prevLabel: 'الأخطاء',
    nextLabel: 'REST و curl',
  },
};
