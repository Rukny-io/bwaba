import type { DocMeta, Localized } from '../types';

export const ruknyOtpOverviewCopy: Localized<
  DocMeta & {
    portalTitle: string;
    portalBody: string;
    portalReference: string;
    portalIntegration: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Rukny OTP | Rukny Documentation',
    metaDescription:
      'Send WhatsApp verification codes from your backend with a managed Rukny sender.',
    title: 'Rukny OTP',
    description:
      'HTTP API for delivering one-time codes on WhatsApp. Rukny owns the sender and template; your server generates the code and verifies the user.',
    toc: [
      { id: 'portal', label: 'Developer portal' },
      { id: 'docs', label: 'Documentation' },
    ],
    portalTitle: 'Dashboard setup',
    portalBody:
      'In the developer portal: install Rukny OTP on your app, create a live API key bound to that app, and fund the app wallet. Billing applies per delivered message.',
    portalReference: 'API reference',
    portalIntegration: 'Where to add code in your project',
    nextLabel: 'Authentication',
  },
  ar: {
    metaTitle: 'Rukny OTP | توثيق رُكني',
    metaDescription:
      'أرسل رموز التحقق عبر WhatsApp من خادمك مع رقم مُدار من Rukny.',
    title: 'Rukny OTP',
    description:
      'API HTTP لتسليم رموز لمرة واحدة على WhatsApp. Rukny تدير المرسل والقالب؛ خادمك يولّد الرمز ويتحقق من المستخدم.',
    toc: [
      { id: 'portal', label: 'بوابة المطورين' },
      { id: 'docs', label: 'التوثيق' },
    ],
    portalTitle: 'إعداد اللوحة',
    portalBody:
      'في بوابة المطورين: ثبّت Rukny OTP على التطبيق، أنشئ API key حي مربوطاً به، واشحن محفظة التطبيق. الفوترة لكل رسالة مُسلّمة.',
    portalReference: 'مرجع API',
    portalIntegration: 'أين تضيف الكود في مشروعك',
    nextLabel: 'المصادقة',
  },
};

export const ruknyOtpAuthCopy: Localized<
  DocMeta & {
    headers: [string, string, string];
    rows: [string, string, string][];
    callout: string;
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Authentication — Rukny OTP | Rukny Documentation',
    metaDescription: 'Authenticate Rukny OTP API requests with a live API key.',
    title: 'Authentication',
    description:
      'All requests are server-to-server. Use a live API key created for the same developer app that has Rukny OTP installed.',
    toc: [{ id: 'headers', label: 'Headers' }],
    headers: ['Header', 'Required', 'Notes'],
    rows: [
      ['X-API-Key', 'Always', 'rk_live_… from the developer portal (live key linked to your app)'],
      ['Content-Type', 'POST bodies', 'application/json'],
    ],
    callout: 'Never expose your API key in mobile apps, browsers, or public repos.',
    prevLabel: 'Overview',
    nextLabel: 'Backend integration',
  },
  ar: {
    metaTitle: 'المصادقة — Rukny OTP | توثيق رُكني',
    metaDescription: 'مصادقة طلبات Rukny OTP بمفتاح API حي.',
    title: 'المصادقة',
    description:
      'كل الطلبات من الخادم إلى الخادم. استخدم API key حي أنشأته لنفس تطبيق المطور الذي عليه Rukny OTP.',
    toc: [{ id: 'headers', label: 'الترويسات' }],
    headers: ['الترويسة', 'مطلوب', 'ملاحظات'],
    rows: [
      ['X-API-Key', 'دائماً', 'rk_live_… من بوابة المطورين (مفتاح Live مربوط بتطبيقك)'],
      ['Content-Type', 'طلبات POST', 'application/json'],
    ],
    callout: 'لا تعرّض مفتاح API في تطبيقات الجوال أو المتصفح أو مستودعات عامة.',
    prevLabel: 'نظرة عامة',
    nextLabel: 'ربط الخادم',
  },
};

export const ruknyOtpIntegrationCopy: Localized<
  DocMeta & {
    envTitle: string;
    envIntro: string;
    serverTitle: string;
    serverIntro: string;
    serverPaths: { label: string; path: string }[];
    flowTitle: string;
    flowSteps: string[];
    neverTitle: string;
    neverItems: string[];
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Backend integration — Rukny OTP | Rukny Documentation',
    metaDescription:
      'Where to store the API key and which server files should call Rukny OTP.',
    title: 'Backend integration',
    description:
      'Rukny OTP is not a client SDK. You add a few lines on your server when the user requests a code.',
    toc: [
      { id: 'env', label: 'Environment' },
      { id: 'server', label: 'Server files' },
      { id: 'flow', label: 'Request flow' },
      { id: 'never', label: 'Do not' },
    ],
    envTitle: '1. Environment variables (server only)',
    envIntro:
      'Add these on your backend host or secrets manager — not in frontend .env files shipped to users.',
    serverTitle: '2. Where to call the API',
    serverIntro:
      'Create or extend a server route that runs when the user asks for a code. Examples:',
    serverPaths: [
      { label: 'Next.js App Router', path: 'app/api/auth/otp/send/route.ts' },
      { label: 'Next.js Pages', path: 'pages/api/auth/otp/send.ts' },
      { label: 'Express / Nest', path: 'src/routes/auth/send-otp.ts (or your auth module)' },
      { label: 'Laravel', path: 'app/Http/Controllers/Auth/OtpController.php' },
    ],
    flowTitle: '3. What that route should do',
    flowSteps: [
      'Validate the phone number from your client (session / rate limit).',
      'Generate a one-time code and store it server-side (Redis, DB, or signed session) with the phone.',
      'POST to /otp/send with X-API-Key, to (E.164), and code.',
      'When the user submits the code, compare it to what you stored — Rukny does not verify login for you.',
    ],
    neverTitle: 'Do not',
    neverItems: [
      'Call Rukny OTP from React, mobile apps, or static sites.',
      'Commit rk_live_ keys to git.',
    ],
    prevLabel: 'Authentication',
    nextLabel: 'API reference',
  },
  ar: {
    metaTitle: 'ربط الخادم — Rukny OTP | توثيق رُكني',
    metaDescription: 'أين تخزّن المفتاح وأي ملفات الخادم تستدعي Rukny OTP.',
    title: 'ربط الخادم',
    description:
      'Rukny OTP ليس SDK في العميل. تضيف استدعاءاً من الخادم عندما يطلب المستخدم رمزاً.',
    toc: [
      { id: 'env', label: 'البيئة' },
      { id: 'server', label: 'ملفات الخادم' },
      { id: 'flow', label: 'تدفق الطلب' },
      { id: 'never', label: 'ممنوع' },
    ],
    envTitle: '1. متغيرات البيئة (الخادم فقط)',
    envIntro:
      'أضفها على خادمك أو مدير الأسرار — وليس في .env يصل للمتصفح أو تطبيق الجوال.',
    serverTitle: '2. أين تستدعي API',
    serverIntro: 'أنشئ أو عدّل مساراً يعمل عند طلب الرمز. أمثلة:',
    serverPaths: [
      { label: 'Next.js App Router', path: 'app/api/auth/otp/send/route.ts' },
      { label: 'Next.js Pages', path: 'pages/api/auth/otp/send.ts' },
      { label: 'Express / Nest', path: 'src/routes/auth/send-otp.ts' },
      { label: 'Laravel', path: 'app/Http/Controllers/Auth/OtpController.php' },
    ],
    flowTitle: '3. ما الذي يفعله المسار',
    flowSteps: [
      'تحقق من رقم الهاتف من العميل (جلسة / حد معدل).',
      'ولّد رمزاً لمرة واحدة وخزّنه في الخادم (Redis أو DB أو جلسة) مع الهاتف.',
      'أرسل POST إلى /otp/send مع X-API-Key و to (E.164) و code.',
      'عند إدخال المستخدم للرمز، قارنه بما خزّنت — Rukny لا تتحقق من تسجيل الدخول.',
    ],
    neverTitle: 'لا تفعل',
    neverItems: [
      'استدعاء Rukny OTP من React أو تطبيق جوال أو موقع ثابت.',
      'رفع مفاتيح rk_live_ إلى git.',
    ],
    prevLabel: 'المصادقة',
    nextLabel: 'مرجع API',
  },
};

export const ruknyOtpReferenceCopy: Localized<
  DocMeta & {
    headersEndpoint: [string, string, string, string];
    sendSummary: string;
    bodyHeaders: [string, string, string];
    bodyRows: [string, string, string][];
    responseTitle: string;
    responseBody: string;
    errorsTitle: string;
    errorRows: [string, string][];
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'API reference — Rukny OTP | Rukny Documentation',
    metaDescription: 'Rukny OTP REST endpoints, request bodies, and responses.',
    title: 'API reference',
    description:
      'Public base URL and endpoints. Interactive OpenAPI-style layout — use the tables and samples below when implementing your server route.',
    toc: [
      { id: 'base', label: 'Base URL' },
      { id: 'send', label: 'Send OTP' },
      { id: 'body', label: 'Request body' },
      { id: 'response', label: 'Response' },
      { id: 'errors', label: 'Errors' },
    ],
    headersEndpoint: ['Method', 'Path', 'Auth', 'Summary'],
    sendSummary: 'Deliver a WhatsApp authentication message with the code you generated.',
    bodyHeaders: ['Field', 'Type', 'Description'],
    bodyRows: [
      ['to', 'string', 'Recipient phone in E.164 (e.g. +964771234567).'],
      ['code', 'string', 'One-time code your server generated for this attempt.'],
    ],
    responseTitle: 'Success response',
    responseBody:
      'JSON with a message id and delivery status fields (exact shape matches the live API). Use it for logging; verification stays on your server.',
    errorsTitle: 'Common errors',
    errorRows: [
      ['401', 'Missing or invalid X-API-Key'],
      ['402', 'Insufficient app wallet balance'],
      ['422', 'Invalid phone or payload'],
      ['429', 'Rate limit exceeded'],
    ],
    prevLabel: 'Backend integration',
    nextLabel: 'REST & curl',
  },
  ar: {
    metaTitle: 'مرجع API — Rukny OTP | توثيق رُكني',
    metaDescription: 'نقاط Rukny OTP وأجسام الطلب والاستجابة.',
    title: 'مرجع API',
    description:
      'الرابط الأساسي والنقاط. استخدم الجداول والأمثلة أدناه عند تنفيذ مسار الخادم.',
    toc: [
      { id: 'base', label: 'الرابط الأساسي' },
      { id: 'send', label: 'إرسال OTP' },
      { id: 'body', label: 'جسم الطلب' },
      { id: 'response', label: 'الاستجابة' },
      { id: 'errors', label: 'الأخطاء' },
    ],
    headersEndpoint: ['الطريقة', 'المسار', 'المصادقة', 'الملخص'],
    sendSummary: 'تسليم رسالة WhatsApp للمصادقة بالرمز الذي ولّدته.',
    bodyHeaders: ['الحقل', 'النوع', 'الوصف'],
    bodyRows: [
      ['to', 'string', 'هاتف المستلم بصيغة E.164 (مثل +964771234567).'],
      ['code', 'string', 'الرمز لمرة واحدة الذي ولّدته في الخادم.'],
    ],
    responseTitle: 'استجابة ناجحة',
    responseBody:
      'JSON يتضمن معرّف الرسالة وحالة التسليم. استخدمه للسجلات؛ التحقق من المستخدم يبقى في خادمك.',
    errorsTitle: 'أخطاء شائعة',
    errorRows: [
      ['401', 'X-API-Key مفقود أو غير صالح'],
      ['402', 'رصيد محفظة التطبيق غير كافٍ'],
      ['422', 'هاتف أو payload غير صالح'],
      ['429', 'تجاوز حد المعدل'],
    ],
    prevLabel: 'ربط الخادم',
    nextLabel: 'REST و curl',
  },
};

export const ruknyOtpRestCopy: Localized<
  DocMeta & {
    curlTitle: string;
    nodeTitle: string;
    nodeSample: string;
    prevLabel: string;
  }
> = {
  en: {
    metaTitle: 'REST & curl — Rukny OTP | Rukny Documentation',
    metaDescription: 'Copy-paste curl and Node examples for Rukny OTP.',
    title: 'REST & curl',
    description: 'Minimal examples you can paste into your server route.',
    toc: [
      { id: 'curl', label: 'curl' },
      { id: 'node', label: 'Node.js (fetch)' },
    ],
    curlTitle: 'curl',
    nodeTitle: 'Node.js (fetch)',
    nodeSample: `const res = await fetch(process.env.RUKNY_API_BASE + '/otp/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.RUKNY_API_KEY!,
  },
  body: JSON.stringify({ to: '+964771234567', code: '482913' }),
});
if (!res.ok) throw new Error(await res.text());
const data = await res.json();`,
    prevLabel: 'API reference',
  },
  ar: {
    metaTitle: 'REST و curl — Rukny OTP | توثيق رُكني',
    metaDescription: 'أمثلة curl و Node لـ Rukny OTP.',
    title: 'REST و curl',
    description: 'أمثلة جاهزة للنسخ في مسار الخادم.',
    toc: [
      { id: 'curl', label: 'curl' },
      { id: 'node', label: 'Node.js (fetch)' },
    ],
    curlTitle: 'curl',
    nodeTitle: 'Node.js (fetch)',
    nodeSample: `const res = await fetch(process.env.RUKNY_API_BASE + '/otp/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.RUKNY_API_KEY!,
  },
  body: JSON.stringify({ to: '+964771234567', code: '482913' }),
});
if (!res.ok) throw new Error(await res.text());
const data = await res.json();`,
    prevLabel: 'مرجع API',
  },
};
