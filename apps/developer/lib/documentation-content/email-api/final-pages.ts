import type { Localized, DocMeta } from '../types';

export const emailUseCasesCopy: Localized<
  DocMeta & {
    otpBody: string;
    magicBody: string;
    receiptBody: string;
    idemTitle: string;
    idemBody: string;
    securityBody: string;
    techniques: { title: string; body: string }[];
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Use cases — Email API | Rukny Documentation',
    metaDescription:
      'Practical Email API patterns for OTPs, magic links, receipts, and alerts.',
    title: 'Use cases',
    description:
      'Copy-ready patterns for the most common transactional emails. Each example assumes a verified domain and authorized sender.',
    toc: [
      { id: 'otp', label: 'OTP / verification' },
      { id: 'magic-link', label: 'Magic link' },
      { id: 'receipt', label: 'Receipt' },
      { id: 'security', label: 'Security alert' },
      { id: 'techniques', label: 'Techniques' },
    ],
    otpBody:
      'Keep the code short-lived, put it in both subject and body when helpful, and always use a unique idempotency key per attempt.',
    magicBody:
      'Prefer a single CTA URL. Avoid nesting tracking redirects that break deliverability. Expire the token server-side.',
    receiptBody:
      'Keep receipts plain and scannable. Include order id in the subject for searchability. Store the returned message id with the order record.',
    idemTitle: 'Idempotency tip',
    idemBody:
      'Using receipt_${order.id} means a retry after a timeout returns the original send instead of emailing twice.',
    securityBody:
      'Send from a recognizable address. Include when and where the action happened, plus a clear recovery path.',
    techniques: [
      {
        title: 'Stable idempotency keys',
        body: 'Derive keys from business ids (order_123, otp_user_456_attempt_2) instead of random UUIDs when you want natural dedupe.',
      },
      {
        title: 'Text + HTML together',
        body: 'Provide both bodyText and bodyHtml for better client compatibility. At least one is required.',
      },
      {
        title: 'Store the message id',
        body: 'Persist result.id next to the user action so support can look up delivery status later.',
      },
      {
        title: 'Test then live',
        body: 'Validate templates with rk_test_ keys, then swap to rk_live_ without changing your code path.',
      },
    ],
    prevLabel: 'Get started',
    nextLabel: 'Best practices',
  },
  ar: {
    metaTitle: 'حالات الاستخدام — Email API | توثيق رُكني',
    metaDescription:
      'أنماط عملية لـ Email API لرموز OTP وروابط الدخول والإيصالات والتنبيهات.',
    title: 'حالات الاستخدام',
    description:
      'أنماط جاهزة للنسخ لأكثر رسائل المعاملات شيوعاً. كل مثال يفترض نطاقاً موثّقاً ومُرسِلاً مصرّحاً.',
    toc: [
      { id: 'otp', label: 'OTP / التحقق' },
      { id: 'magic-link', label: 'رابط الدخول' },
      { id: 'receipt', label: 'إيصال' },
      { id: 'security', label: 'تنبيه أمني' },
      { id: 'techniques', label: 'تقنيات' },
    ],
    otpBody:
      'أبقِ الرمز قصير العمر، ضعه في الموضوع والجسم عند الفائدة، واستخدم دائماً مفتاح Idempotency فريداً لكل محاولة.',
    magicBody:
      'فضّل رابط CTA واحداً. تجنّب إعادة توجيه التتبع المتداخلة التي تضر التوصيل. أنهِ صلاحية الرمز من جهة الخادم.',
    receiptBody:
      'أبقِ الإيصالات بسيطة وقابلة للمسح. ضمّن معرّف الطلب في الموضوع للبحث. خزّن معرّف الرسالة المعاد مع سجل الطلب.',
    idemTitle: 'نصيحة Idempotency',
    idemBody:
      'استخدام receipt_${order.id} يعني أن إعادة المحاولة بعد مهلة تعيد الإرسال الأصلي بدل إرسال بريد مرتين.',
    securityBody:
      'أرسل من عنوان معروف. اذكر متى وأين حدث الإجراء، مع مسار استعادة واضح.',
    techniques: [
      {
        title: 'مفاتيح Idempotency مستقرة',
        body: 'اشتق المفاتيح من معرّفات العمل (order_123، otp_user_456_attempt_2) بدل UUID عشوائي عندما تريد إزالة التكرار طبيعياً.',
      },
      {
        title: 'نص وHTML معاً',
        body: 'قدّم bodyText وbodyHtml معاً لتوافق أفضل مع العملاء. واحد على الأقل مطلوب.',
      },
      {
        title: 'خزّن معرّف الرسالة',
        body: 'احفظ result.id بجانب إجراء المستخدم ليتمكن الدعم من البحث عن حالة التوصيل لاحقاً.',
      },
      {
        title: 'اختبار ثم حي',
        body: 'تحقق من القوالب بمفاتيح rk_test_ ثم بدّل إلى rk_live_ دون تغيير مسار الكود.',
      },
    ],
    prevLabel: 'البدء',
    nextLabel: 'أفضل الممارسات',
  },
};

export const emailBestPracticesCopy: Localized<
  DocMeta & {
    deliverability: { title: string; description: string }[];
    deliverCallout: string;
    securityItems: string[];
    reliabilityItems: string[];
    contentItems: string[];
    opsBefore: string;
    opsLink: string;
    opsAfter: string;
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Best practices — Email API | Rukny Documentation',
    metaDescription:
      'Deliverability, security, and reliability guidance for the Rukny Email API.',
    title: 'Best practices',
    description:
      'Keep mail landing in the inbox, protect your keys, and make retries safe. These habits matter more than fancy templates.',
    toc: [
      { id: 'deliverability', label: 'Deliverability' },
      { id: 'security', label: 'Security' },
      { id: 'reliability', label: 'Reliability' },
      { id: 'content', label: 'Content' },
      { id: 'ops', label: 'Operations' },
    ],
    deliverability: [
      {
        title: 'Verify DNS fully',
        description: 'Publish every SPF and DKIM record before sending live traffic.',
      },
      {
        title: 'Use a real domain',
        description: 'Send from your brand domain, not free mailbox providers.',
      },
      {
        title: 'Stay transactional',
        description: 'Avoid promotional blasts on this API — it is built for 1:1 mail.',
      },
      {
        title: 'Respect suppressions',
        description: 'Hard bounces and complaints suppress recipients automatically.',
      },
    ],
    deliverCallout:
      'A sudden spike in bounces or complaints can pause sending for review. Fix list quality before retrying volume.',
    securityItems: [
      'Keep keys on the server only — never in browsers, mobile apps, or public repos.',
      'Prefer scoped keys (email:send only where possible).',
      'Rotate keys on a schedule and after any suspected leak.',
      'Use separate keys for staging and production.',
    ],
    reliabilityItems: [
      'Always send an Idempotency-Key for live messages.',
      'Retry on network failures and 5xx with exponential backoff.',
      'Treat 4xx as permanent for that request body — fix the payload before retrying.',
      'Store the returned message id with your business event.',
    ],
    contentItems: [
      'Keep subjects short and specific — no newlines.',
      'Include a plain-text body even when you send HTML.',
      'One clear action per email when possible.',
      'MVP limit: one recipient, no attachments, no CC/BCC.',
    ],
    opsBefore: 'Monitor',
    opsLink: 'quotas',
    opsAfter:
      'and switch from test to live only after DNS + sender authorization are green. Use the portal Domains UI for day-to-day DNS checks, and the API for automation.',
    prevLabel: 'Use cases',
    nextLabel: 'Authentication',
  },
  ar: {
    metaTitle: 'أفضل الممارسات — Email API | توثيق رُكني',
    metaDescription: 'إرشادات التوصيل والأمان والموثوقية لـ Rukny Email API.',
    title: 'أفضل الممارسات',
    description:
      'أبقِ البريد في الوارد، احمِ مفاتيحك، واجعل إعادة المحاولة آمنة. هذه العادات أهم من القوالب الفاخرة.',
    toc: [
      { id: 'deliverability', label: 'قابلية التوصيل' },
      { id: 'security', label: 'الأمان' },
      { id: 'reliability', label: 'الموثوقية' },
      { id: 'content', label: 'المحتوى' },
      { id: 'ops', label: 'التشغيل' },
    ],
    deliverability: [
      {
        title: 'وثّق DNS بالكامل',
        description: 'انشر كل سجل SPF وDKIM قبل إرسال حركة حية.',
      },
      {
        title: 'استخدم نطاقاً حقيقياً',
        description: 'أرسل من نطاق علامتك، لا من مزودي بريد مجانيين.',
      },
      {
        title: 'ابقَ معاملاتياً',
        description: 'تجنّب البث الترويجي على هذا الـ API — مبني لبريد 1:1.',
      },
      {
        title: 'احترم الكبت',
        description: 'الارتدادات الصلبة والشكاوى تكبت المستلمين تلقائياً.',
      },
    ],
    deliverCallout:
      'ارتفاع مفاجئ في الارتدادات أو الشكاوى قد يوقف الإرسال للمراجعة. أصلح جودة القائمة قبل إعادة الحجم.',
    securityItems: [
      'أبقِ المفاتيح على الخادم فقط — لا في المتصفحات أو تطبيقات الجوال أو المستودعات العامة.',
      'فضّل المفاتيح المقيّدة (email:send فقط حيث أمكن).',
      'دوّر المفاتيح وفق جدول وبعد أي تسريب مشتبه.',
      'استخدم مفاتيح منفصلة للتجريب والإنتاج.',
    ],
    reliabilityItems: [
      'أرسل دائماً Idempotency-Key للرسائل الحية.',
      'أعد المحاولة عند فشل الشبكة و5xx مع تراجع أسي.',
      'عامل 4xx كدائم لتلك الحمولة — أصلحها قبل إعادة المحاولة.',
      'خزّن معرّف الرسالة المعاد مع حدث العمل.',
    ],
    contentItems: [
      'أبقِ المواضيع قصيرة ومحددة — بلا أسطر جديدة.',
      'ضمّن جسماً نصياً حتى عند إرسال HTML.',
      'إجراء واضح واحد لكل بريد عند الإمكان.',
      'حد MVP: مستلم واحد، بلا مرفقات، بلا CC/BCC.',
    ],
    opsBefore: 'راقب',
    opsLink: 'الحصص',
    opsAfter:
      'وانتقل من الاختبار للحي فقط بعد أن يكون DNS وتفويض المُرسِل أخضرين. استخدم واجهة النطاقات في البوابة لفحص DNS اليومي، والـ API للأتمتة.',
    prevLabel: 'حالات الاستخدام',
    nextLabel: 'المصادقة',
  },
};

export const emailDomainsCopy: Localized<
  DocMeta & {
    whyBody: string;
    steps: { title: string; body: string }[];
    portalTitle: string;
    portalBody: string;
    sendersBody: string;
    deliverability: { title: string; description: string }[];
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Domains — Email API | Rukny Documentation',
    metaDescription:
      'Verify your sending domain and authorize sender addresses in the Rukny developer portal.',
    title: 'Domains',
    description:
      'Prove you own the domain you send from, then authorize the exact addresses your app may use. Do this in the developer portal — not with hand-written REST calls.',
    toc: [
      { id: 'why', label: 'Why domains matter' },
      { id: 'flow', label: 'Setup in the portal' },
      { id: 'senders', label: 'Authorize senders' },
      { id: 'deliverability', label: 'Deliverability' },
    ],
    whyBody:
      'Inbox providers trust mail that passes SPF and DKIM from a domain you control. Until verification succeeds, live sending from that domain is blocked.',
    steps: [
      {
        title: 'Open Domains',
        body: 'Sign in to the developer dashboard, open your app → Email API → Domains.',
      },
      {
        title: 'Add your domain',
        body: 'Enter a domain you control (for example yourdomain.com) and start verification.',
      },
      {
        title: 'Publish DNS records',
        body: 'Copy the SPF / DKIM records shown in the portal into your DNS host. Propagation can take a few minutes to several hours.',
      },
      {
        title: 'Refresh until verified',
        body: 'Use Refresh in the Domains UI until the domain status is verified.',
      },
    ],
    portalTitle: 'Portal only',
    portalBody:
      'Domain verification and sender authorization are managed in the dashboard with your login session. Public API keys are for sending messages and reading delivery status.',
    sendersBody:
      'After the domain is verified, authorize a sender such as noreply@yourdomain.com for the app. Only authorized addresses may appear in from when you send.',
    deliverability: [
      {
        title: 'Hard bounces',
        description: 'Invalid recipients are suppressed for your account automatically.',
      },
      {
        title: 'Complaints',
        description: 'Spam complaints suppress the address and protect your reputation.',
      },
      {
        title: 'Sudden spikes',
        description:
          'A suspicious rise in bounces or complaints can pause sending for review.',
      },
    ],
    prevLabel: 'Messages',
    nextLabel: 'Testing',
  },
  ar: {
    metaTitle: 'النطاقات — Email API | توثيق رُكني',
    metaDescription:
      'وثّق نطاق الإرسال وصرّح بعناوين المُرسِلين في بوابة مطوّري رُكني.',
    title: 'النطاقات',
    description:
      'أثبت ملكية النطاق الذي ترسل منه، ثم صرّح بالعناوين التي يجوز لتطبيقك استخدامها. افعل ذلك في بوابة المطوّرين — لا بطلبات REST يدوية.',
    toc: [
      { id: 'why', label: 'لماذا تهم النطاقات' },
      { id: 'flow', label: 'الإعداد في البوابة' },
      { id: 'senders', label: 'تفويض المُرسِلين' },
      { id: 'deliverability', label: 'قابلية التوصيل' },
    ],
    whyBody:
      'يثق مزودو الوارد بالبريد الذي يمر SPF وDKIM من نطاق تتحكم به. حتى ينجح التوثيق، يُحظر الإرسال الحي من ذلك النطاق.',
    steps: [
      {
        title: 'افتح النطاقات',
        body: 'سجّل الدخول إلى لوحة المطوّرين، افتح تطبيقك → Email API → النطاقات.',
      },
      {
        title: 'أضف نطاقك',
        body: 'أدخل نطاقاً تتحكم به (مثل yourdomain.com) وابدأ التوثيق.',
      },
      {
        title: 'انشر سجلات DNS',
        body: 'انسخ سجلات SPF / DKIM المعروضة في البوابة إلى مضيف DNS. قد يستغرق الانتشار دقائق إلى ساعات.',
      },
      {
        title: 'حدّث حتى يُوثَّق',
        body: 'استخدم تحديث في واجهة النطاقات حتى تصبح حالة النطاق موثّقة.',
      },
    ],
    portalTitle: 'البوابة فقط',
    portalBody:
      'توثيق النطاق وتفويض المُرسِل يُداران في اللوحة بجلسة تسجيل دخولك. مفاتيح API العامة لإرسال الرسائل وقراءة حالة التوصيل.',
    sendersBody:
      'بعد توثيق النطاق، صرّح بمُرسِل مثل noreply@yourdomain.com للتطبيق. فقط العناوين المصرّحة قد تظهر في from عند الإرسال.',
    deliverability: [
      {
        title: 'ارتدادات صلبة',
        description: 'المستلمون غير الصالحين يُكبتون لحسابك تلقائياً.',
      },
      {
        title: 'الشكاوى',
        description: 'شكاوى البريد المزعج تكبت العنوان وتحمي سمعتك.',
      },
      {
        title: 'ارتفاعات مفاجئة',
        description:
          'ارتفاع مشبوه في الارتدادات أو الشكاوى قد يوقف الإرسال للمراجعة.',
      },
    ],
    prevLabel: 'الرسائل',
    nextLabel: 'الاختبار',
  },
};

export const emailMessagesCopy: Localized<
  DocMeta & {
    scopeLabel: string;
    fieldHeaders: [string, string, string, string];
    yes: string;
    no: string;
    statusHeaders: [string, string];
    statuses: [string, string][];
    privacyTitle: string;
    privacyBody: string;
    limitsBody: string;
    summaries: Record<string, string>;
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Messages — Email API | Rukny Documentation',
    metaDescription:
      'Send transactional email and read delivery status with Rukny Email API.',
    title: 'Messages',
    description:
      'Send one transactional email per request, then poll its operational status. Bodies and recipient addresses are never returned by the status endpoint.',
    toc: [
      { id: 'send', label: 'Send' },
      { id: 'fields', label: 'Fields' },
      { id: 'status', label: 'Status' },
      { id: 'lifecycle', label: 'Lifecycle' },
      { id: 'limits', label: 'Limits' },
    ],
    scopeLabel: 'scope',
    fieldHeaders: ['Field', 'Type', 'Required', 'Notes'],
    yes: 'Yes',
    no: 'No',
    statusHeaders: ['Status', 'Meaning'],
    statuses: [
      ['queued', 'Accepted and waiting for the provider'],
      ['sent', 'Handed off to the email provider'],
      ['delivered', 'Provider reported successful delivery'],
      ['bounced', 'Hard bounce — recipient may be suppressed'],
      ['complained', 'Marked as spam — recipient suppressed'],
      ['failed', 'Could not be sent (validation or provider error)'],
    ],
    privacyTitle: 'What status does not include',
    privacyBody:
      'For privacy, status responses never include the subject, body, or full recipient address — only the message id, status, and timestamps.',
    limitsBody:
      'One recipient per request. No attachments, CC, or BCC yet. The from address must be verified and authorized for the app that owns the API key.',
    summaries: {
      sendMessage: 'Send one transactional email from an authorized sender.',
      getMessage: 'Read operational delivery status for a message id.',
    },
    prevLabel: 'Authentication',
    nextLabel: 'Domains',
  },
  ar: {
    metaTitle: 'الرسائل — Email API | توثيق رُكني',
    metaDescription: 'أرسل بريداً معاملاتياً واقرأ حالة التوصيل عبر Rukny Email API.',
    title: 'الرسائل',
    description:
      'أرسل بريداً معاملاتياً واحداً لكل طلب، ثم استطلع حالته التشغيلية. الأجسام وعناوين المستلمين لا تُعاد أبداً من نقطة الحالة.',
    toc: [
      { id: 'send', label: 'إرسال' },
      { id: 'fields', label: 'الحقول' },
      { id: 'status', label: 'الحالة' },
      { id: 'lifecycle', label: 'دورة الحياة' },
      { id: 'limits', label: 'الحدود' },
    ],
    scopeLabel: 'الصلاحية',
    fieldHeaders: ['الحقل', 'النوع', 'مطلوب', 'ملاحظات'],
    yes: 'نعم',
    no: 'لا',
    statusHeaders: ['الحالة', 'المعنى'],
    statuses: [
      ['queued', 'مقبول وفي انتظار المزود'],
      ['sent', 'سُلِّم لمزود البريد'],
      ['delivered', 'أبلغ المزود عن تسليم ناجح'],
      ['bounced', 'ارتداد صلب — قد يُكبت المستلم'],
      ['complained', 'وُسِم كمزعج — المستلم مكبوت'],
      ['failed', 'تعذّر الإرسال (تحقق أو خطأ مزود)'],
    ],
    privacyTitle: 'ما لا تتضمنه الحالة',
    privacyBody:
      'للخصوصية، لا تتضمن استجابات الحالة الموضوع أو الجسم أو عنوان المستلم الكامل — فقط معرّف الرسالة والحالة والطوابع الزمنية.',
    limitsBody:
      'مستلم واحد لكل طلب. لا مرفقات ولا CC ولا BCC بعد. يجب أن يكون عنوان from موثّقاً ومصرّحاً للتطبيق الذي يملك مفتاح API.',
    summaries: {
      sendMessage: 'أرسل بريداً معاملاتياً واحداً من مُرسِل مصرّح.',
      getMessage: 'اقرأ حالة التوصيل التشغيلية لمعرّف رسالة.',
    },
    prevLabel: 'المصادقة',
    nextLabel: 'النطاقات',
  },
};

export const emailQuotasCopy: Localized<
  DocMeta & {
    planHeaders: [string, string, string, string];
    plansIntroBefore: string;
    plansIntroMid: string;
    overageBody: string;
    marketingHeaders: [string, string, string];
    mvp: { title: string; description: string }[];
    exceededBody: string;
    exceededCallout: string;
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Quotas & limits — Email API | Rukny Documentation',
    metaDescription:
      'Free tier, Pro/Scale plans, overage packs, and MVP payload limits for Email API.',
    title: 'Quotas & limits',
    description:
      'Understand free tier, paid capacity, overage packs, and the payload constraints of the current MVP.',
    toc: [
      { id: 'plans', label: 'Plans' },
      { id: 'overage', label: 'Overage' },
      { id: 'marketing', label: 'Marketing & automations' },
      { id: 'mvp', label: 'MVP limits' },
      { id: 'exceeded', label: 'When quota is exceeded' },
    ],
    planHeaders: ['Plan', 'Volume', 'Price (IQD/mo)', 'Notes'],
    plansIntroBefore:
      'Usage and plan status appear on the Email API overview card in the dashboard. Full public pricing lives on',
    plansIntroMid: 'and',
    overageBody:
      'When your included monthly quota is exhausted on a paid plan, purchase prepaid packs from the subscription card: 1,000 emails for 700 IQD. Packs are billed from your developer wallet.',
    marketingHeaders: ['Product', 'Free tier', 'Paid from'],
    mvp: [
      {
        title: 'One recipient',
        description: 'to accepts exactly one address per request.',
      },
      {
        title: 'Text and/or HTML',
        description: 'Provide bodyText, bodyHtml, or both — no attachments.',
      },
      {
        title: 'Optional reply-to',
        description: 'At most one replyTo address.',
      },
      {
        title: 'Subject rules',
        description: 'Required, max 255 chars, no newline characters.',
      },
    ],
    exceededBody:
      'Live sends return 402 Payment Required with code quota_exceeded when quota is exhausted. Upgrade, buy an overage pack, or wait for the next billing cycle before retrying. Test keys are not blocked by live quota.',
    exceededCallout:
      'Rate limits may also return 429. Back off exponentially and keep using the same idempotency key for the original business event.',
    prevLabel: 'Testing',
    nextLabel: 'Errors',
  },
  ar: {
    metaTitle: 'الحصص والحدود — Email API | توثيق رُكني',
    metaDescription:
      'الطبقة المجانية وخطط Pro/Scale وحزم التجاوز وحدود حمولة MVP لـ Email API.',
    title: 'الحصص والحدود',
    description:
      'افهم الطبقة المجانية والسعة المدفوعة وحزم التجاوز وقيود الحمولة في الـ MVP الحالي.',
    toc: [
      { id: 'plans', label: 'الخطط' },
      { id: 'overage', label: 'التجاوز' },
      { id: 'marketing', label: 'التسويق والأتمتة' },
      { id: 'mvp', label: 'حدود MVP' },
      { id: 'exceeded', label: 'عند تجاوز الحصة' },
    ],
    planHeaders: ['الخطة', 'الحجم', 'السعر (IQD/شهر)', 'ملاحظات'],
    plansIntroBefore:
      'يظهر الاستخدام وحالة الخطة على بطاقة نظرة Email API في اللوحة. التسعير العام الكامل على',
    plansIntroMid: 'و',
    overageBody:
      'عندما تُستنفد حصتك الشهرية المضمنة على خطة مدفوعة، اشترِ حزماً مسبقة الدفع من بطاقة الاشتراك: 1,000 رسالة بـ 700 IQD. تُفوتر الحزم من محفظة المطوّر.',
    marketingHeaders: ['المنتج', 'الطبقة المجانية', 'المدفوع من'],
    mvp: [
      {
        title: 'مستلم واحد',
        description: 'يقبل to عنواناً واحداً بالضبط لكل طلب.',
      },
      {
        title: 'نص و/أو HTML',
        description: 'قدّم bodyText أو bodyHtml أو كليهما — بلا مرفقات.',
      },
      {
        title: 'رد اختياري',
        description: 'عنوان replyTo واحد على الأكثر.',
      },
      {
        title: 'قواعد الموضوع',
        description: 'مطلوب، بحد أقصى 255 حرفاً، بلا أسطر جديدة.',
      },
    ],
    exceededBody:
      'الإرسال الحي يعيد 402 Payment Required برمز quota_exceeded عند استنفاد الحصة. رقِّ أو اشترِ حزمة تجاوز أو انتظر دورة الفوترة التالية قبل إعادة المحاولة. مفاتيح الاختبار لا تُحظر بحصة الحي.',
    exceededCallout:
      'قد تعيد حدود المعدل أيضاً 429. تراجع أسياً واستمر بنفس مفتاح Idempotency لحدث العمل الأصلي.',
    prevLabel: 'الاختبار',
    nextLabel: 'الأخطاء',
  },
};
