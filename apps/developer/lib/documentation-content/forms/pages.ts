import type { Localized, DocMeta } from '../types';

type Step = { title: string; body: string };

export const formsGetStartedCopy: Localized<
  DocMeta & {
    beforeItems: string[];
    setupTitle: string;
    steps: Step[];
    tipTitle: string;
    tipBody: string;
    embedTitle: string;
    embedP1: string;
    embedP2Before: string;
    embedLink: string;
    nextTitle: string;
    nextItems: { before: string; link: string; after: string; href: string }[];
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Get started — Forms | Rukny Documentation',
    metaDescription:
      'Install Forms on your app, link a form, set your website domain, and embed it.',
    title: 'Get started',
    description:
      'Go from zero to a live embedded form on your website. Linking does not require a domain — embedding does.',
    toc: [
      { id: 'before-you-begin', label: 'Before you begin' },
      { id: 'setup', label: 'Setup' },
      { id: 'embed', label: 'Embed on your site' },
      { id: 'next', label: 'What next' },
    ],
    beforeItems: [
      'A Rukny developer account',
      'Access to the Forms product (same account)',
      'A website where you can paste an iframe snippet',
    ],
    setupTitle: 'Setup',
    steps: [
      {
        title: 'Create an app and install Forms',
        body: 'Open the dashboard, select an app, then install Forms from Products if it is not already installed.',
      },
      {
        title: 'Create or pick a form',
        body: 'Create a form in the Forms dashboard, or use one you already own. Publish it when you are ready for the public page and embed.',
      },
      {
        title: 'Link the form to your app',
        body: 'In the app → Forms hub, choose Link form and select the form. A form can only be linked to one developer app at a time.',
      },
      {
        title: 'Set your website URL',
        body: 'Open Settings → Domains and add your app website URL. Rukny derives the allowed embed origin from that URL. Without it, Connect will show embed as blocked.',
      },
    ],
    tipTitle: 'Tip',
    tipBody:
      'You can link forms before the website domain is set. Domain setup only unlocks secure iframe embedding.',
    embedTitle: 'Embed on your site',
    embedP1:
      'Open the linked form → Connect. Copy the iframe snippet, paste it into your page, and load the page from your allowed origin. Use the live preview in Connect to confirm the form renders.',
    embedP2Before: 'Details and edge cases:',
    embedLink: 'Embedding',
    nextTitle: 'What next',
    nextItems: [
      {
        before: 'Add the',
        link: 'submission listener',
        after: 'for in-page UX.',
        href: '/documentation/forms/events',
      },
      {
        before: 'Configure a',
        link: 'webhook',
        after: 'if your backend should receive answers.',
        href: '/documentation/forms/webhooks',
      },
      {
        before: 'Read',
        link: 'Website domain',
        after: 'if embeds are blocked.',
        href: '/documentation/forms/domains',
      },
    ],
    prevLabel: 'Overview',
    nextLabel: 'Linking forms',
  },
  ar: {
    metaTitle: 'البدء — النماذج | توثيق رُكني',
    metaDescription:
      'ثبّت النماذج على تطبيقك، اربط نموذجاً، اضبط نطاق الموقع، وادمِجه.',
    title: 'البدء',
    description:
      'من الصفر إلى نموذج مضمّن على موقعك. الربط لا يتطلب نطاقاً — التضمين يتطلبه.',
    toc: [
      { id: 'before-you-begin', label: 'قبل أن تبدأ' },
      { id: 'setup', label: 'الإعداد' },
      { id: 'embed', label: 'التضمين في موقعك' },
      { id: 'next', label: 'ماذا بعد' },
    ],
    beforeItems: [
      'حساب مطوّر في رُكني',
      'الوصول إلى منتج النماذج (نفس الحساب)',
      'موقع يمكنك لصق مقطع iframe فيه',
    ],
    setupTitle: 'الإعداد',
    steps: [
      {
        title: 'أنشئ تطبيقاً وثبّت النماذج',
        body: 'افتح لوحة التحكم، اختر تطبيقاً، ثم ثبّت النماذج من المنتجات إن لم تكن مثبتة.',
      },
      {
        title: 'أنشئ أو اختر نموذجاً',
        body: 'أنشئ نموذجاً في لوحة النماذج، أو استخدم واحداً تملكه. انشره عندما تكون جاهزاً للصفحة العامة والتضمين.',
      },
      {
        title: 'اربط النموذج بتطبيقك',
        body: 'في التطبيق → مركز النماذج، اختر ربط نموذج وحدد النموذج. يمكن ربط النموذج بتطبيق مطوّر واحد فقط في كل مرة.',
      },
      {
        title: 'اضبط رابط موقعك',
        body: 'افتح الإعدادات → النطاقات وأضف رابط موقع التطبيق. تستخرج رُكني أصل التضمين المسموح من ذلك الرابط. بدونه سيظهر التضمين محظوراً في Connect.',
      },
    ],
    tipTitle: 'نصيحة',
    tipBody:
      'يمكنك ربط النماذج قبل ضبط نطاق الموقع. ضبط النطاق يفتح فقط التضمين الآمن عبر iframe.',
    embedTitle: 'التضمين في موقعك',
    embedP1:
      'افتح النموذج المرتبط → Connect. انسخ مقطع iframe، الصقه في صفحتك، وحمّل الصفحة من الأصل المسموح. استخدم المعاينة المباشرة في Connect للتأكد من العرض.',
    embedP2Before: 'التفاصيل والحالات الخاصة:',
    embedLink: 'التضمين',
    nextTitle: 'ماذا بعد',
    nextItems: [
      {
        before: 'أضف',
        link: 'مستمع الإرسال',
        after: 'لتجربة داخل الصفحة.',
        href: '/documentation/forms/events',
      },
      {
        before: 'اضبط',
        link: 'ويب هوك',
        after: 'إذا كان خادمك يجب أن يستقبل الإجابات.',
        href: '/documentation/forms/webhooks',
      },
      {
        before: 'اقرأ',
        link: 'نطاق الموقع',
        after: 'إذا كان التضمين محظوراً.',
        href: '/documentation/forms/domains',
      },
    ],
    prevLabel: 'نظرة عامة',
    nextLabel: 'ربط النماذج',
  },
};

export const formsLinkingCopy: Localized<
  DocMeta & {
    why: string;
    howTitle: string;
    howSteps: string[];
    calloutTitle: string;
    calloutBody: string;
    rulesTitle: string;
    rules: string[];
    domainLink: string;
    unlinkTitle: string;
    unlinkBody: string;
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Linking forms — Forms | Rukny Documentation',
    metaDescription:
      'How linking a Rukny form to a developer app works, and what blocks linking.',
    title: 'Linking forms',
    description:
      'Linking attaches a form you own to one developer app so you can manage embed settings and snippets from that app.',
    toc: [
      { id: 'why', label: 'Why link' },
      { id: 'how', label: 'How to link' },
      { id: 'rules', label: 'Rules' },
      { id: 'unlink', label: 'Unlink' },
    ],
    why: 'Linking scopes the form to your app: Connect snippets, embed readiness, and the Forms hub list all live under that app. Without a link, the form still works in Forms — it just is not wired into the developer portal.',
    howTitle: 'How to link',
    howSteps: [
      'Open your app → Forms.',
      'Choose Link form.',
      'Select a form that is not linked elsewhere.',
      'Open Connect when you are ready to embed.',
    ],
    calloutTitle: 'Create from the hub',
    calloutBody:
      'Create form opens the Forms builder with your app id so you can return and link after publishing.',
    rulesTitle: 'Rules',
    rules: [
      'You can only link forms you own (or can manage).',
      'A form can be linked to only one developer app at a time.',
      'Linking does not require a website domain — embedding does. See',
      'Draft forms can be linked, but they must be published before the public page and embed are ready.',
    ],
    domainLink: 'Website domain',
    unlinkTitle: 'Unlink',
    unlinkBody:
      'Unlink from the Forms hub when you want to move the form to another app or stop embedding under this app. Unlinking does not delete the form or its responses in Forms.',
    prevLabel: 'Get started',
    nextLabel: 'Website domain',
  },
  ar: {
    metaTitle: 'ربط النماذج — النماذج | توثيق رُكني',
    metaDescription: 'كيف يعمل ربط نموذج رُكني بتطبيق مطوّر، وما الذي يمنع الربط.',
    title: 'ربط النماذج',
    description:
      'الربط يربط نموذجاً تملكه بتطبيق مطوّر واحد لإدارة إعدادات التضمين والمقاطع من ذلك التطبيق.',
    toc: [
      { id: 'why', label: 'لماذا الربط' },
      { id: 'how', label: 'كيف تربط' },
      { id: 'rules', label: 'القواعد' },
      { id: 'unlink', label: 'إلغاء الربط' },
    ],
    why: 'الربط يقيّد النموذج بتطبيقك: مقاطع Connect وجاهزية التضمين وقائمة مركز النماذج كلها تحت ذلك التطبيق. بدون ربط، النموذج يعمل في النماذج — لكنه غير موصول ببوابة المطوّرين.',
    howTitle: 'كيف تربط',
    howSteps: [
      'افتح تطبيقك → النماذج.',
      'اختر ربط نموذج.',
      'اختر نموذجاً غير مربوط بمكان آخر.',
      'افتح Connect عندما تكون جاهزاً للتضمين.',
    ],
    calloutTitle: 'إنشاء من المركز',
    calloutBody:
      'إنشاء نموذج يفتح منشئ النماذج مع معرّف تطبيقك لتعود وتربط بعد النشر.',
    rulesTitle: 'القواعد',
    rules: [
      'يمكنك ربط النماذج التي تملكها (أو تديرها) فقط.',
      'يمكن ربط النموذج بتطبيق مطوّر واحد فقط في كل مرة.',
      'الربط لا يتطلب نطاق موقع — التضمين يتطلبه. راجع',
      'يمكن ربط المسودات، لكن يجب نشرها قبل جاهزية الصفحة العامة والتضمين.',
    ],
    domainLink: 'نطاق الموقع',
    unlinkTitle: 'إلغاء الربط',
    unlinkBody:
      'ألغِ الربط من مركز النماذج عندما تريد نقل النموذج لتطبيق آخر أو إيقاف التضمين تحت هذا التطبيق. إلغاء الربط لا يحذف النموذج أو ردوده في النماذج.',
    prevLabel: 'البدء',
    nextLabel: 'نطاق الموقع',
  },
};

export const formsDomainsCopy: Localized<
  DocMeta & {
    whyBody: string;
    calloutTitle: string;
    calloutBody: string;
    setupTitle: string;
    steps: Step[];
    checksTitle: string;
    checks: string[];
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Website domain — Forms | Rukny Documentation',
    metaDescription:
      'Set your app website URL so Rukny can allowlist the origin for form embeds.',
    title: 'Website domain',
    description:
      'Embeds are only allowed on the website origin configured for your developer app. This is separate from Email API domain verification.',
    toc: [
      { id: 'why', label: 'Why it matters' },
      { id: 'setup', label: 'Set it up' },
      { id: 'checks', label: 'What gets checked' },
    ],
    whyBody:
      'Without a website URL, Connect marks embedding as blocked and the Forms hub shows a setup strip pointing to Domains. That keeps iframes from being pasted onto arbitrary third-party sites.',
    calloutTitle: 'Not the same as Email Domains',
    calloutBody:
      'Forms uses the app website URL under Settings → Domains. Email API uses SPF/DKIM verification for sending mail. You may need both if you use both products.',
    setupTitle: 'Set it up',
    steps: [
      {
        title: 'Open Settings → Domains',
        body: 'In the developer dashboard, open your app → Settings → Domains.',
      },
      {
        title: 'Enter your website URL',
        body: 'Use a full URL such as https://www.example.com. Rukny stores the origin (scheme + host + port) for embed checks.',
      },
      {
        title: 'Return to Forms',
        body: 'The hub strip should show your allowed domain. Open Connect again — embed should unlock once the form is also published.',
      },
    ],
    checksTitle: 'What gets checked',
    checks: [
      'The page hosting the iframe must match the allowed origin.',
      'Localhost may work for development if that is the origin you configured — match scheme and port carefully.',
      'Changing the website URL updates the allowlist for linked forms on that app.',
    ],
    prevLabel: 'Linking forms',
    nextLabel: 'Embedding',
  },
  ar: {
    metaTitle: 'نطاق الموقع — النماذج | توثيق رُكني',
    metaDescription:
      'اضبط رابط موقع التطبيق حتى تسمح رُكني بأصل التضمين للنماذج.',
    title: 'نطاق الموقع',
    description:
      'يُسمح بالتضمين فقط على أصل الموقع المضبوط لتطبيق المطوّر. هذا منفصل عن توثيق نطاق Email API.',
    toc: [
      { id: 'why', label: 'لماذا يهم' },
      { id: 'setup', label: 'الإعداد' },
      { id: 'checks', label: 'ما الذي يُفحص' },
    ],
    whyBody:
      'بدون رابط موقع، يعلّم Connect التضمين كمحظور ويعرض مركز النماذج شريطاً يشير إلى النطاقات. هذا يمنع لصق iframes على مواقع طرف ثالث عشوائية.',
    calloutTitle: 'ليس نفس نطاقات البريد',
    calloutBody:
      'النماذج تستخدم رابط موقع التطبيق تحت الإعدادات → النطاقات. Email API يستخدم توثيق SPF/DKIM لإرسال البريد. قد تحتاج كليهما إن استخدمت المنتجين.',
    setupTitle: 'الإعداد',
    steps: [
      {
        title: 'افتح الإعدادات → النطاقات',
        body: 'في لوحة المطوّرين، افتح تطبيقك → الإعدادات → النطاقات.',
      },
      {
        title: 'أدخل رابط موقعك',
        body: 'استخدم رابطاً كاملاً مثل https://www.example.com. تخزّن رُكني الأصل (المخطط + المضيف + المنفذ) لفحص التضمين.',
      },
      {
        title: 'عد إلى النماذج',
        body: 'يجب أن يظهر الشريط النطاق المسموح. افتح Connect مجدداً — يُفتح التضمين بعد نشر النموذج أيضاً.',
      },
    ],
    checksTitle: 'ما الذي يُفحص',
    checks: [
      'يجب أن تطابق الصفحة المستضيفة لـ iframe الأصل المسموح.',
      'قد يعمل localhost للتطوير إن كان هو الأصل الذي ضبطته — طابق المخطط والمنفذ بعناية.',
      'تغيير رابط الموقع يحدّث قائمة السماح للنماذج المرتبطة بذلك التطبيق.',
    ],
    prevLabel: 'ربط النماذج',
    nextLabel: 'التضمين',
  },
};

export const formsEmbeddingCopy: Localized<
  DocMeta & {
    requirements: string[];
    detailsLink: string;
    calloutTitle: string;
    calloutBody: string;
    snippetTitle: string;
    snippetP1Before: string;
    snippetP1Link: string;
    snippetP1After: string;
    snippetP2: string;
    publicTitle: string;
    publicBody: string;
    troubleshootingTitle: string;
    troubleshooting: { title: string; body: string }[];
    resizeLink: string;
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Embedding — Forms | Rukny Documentation',
    metaDescription:
      'Embed a linked Rukny form on your website with a secure iframe snippet.',
    title: 'Embedding',
    description:
      'Paste the Connect iframe onto your site. Embedding requires a published form and your app website origin.',
    toc: [
      { id: 'requirements', label: 'Requirements' },
      { id: 'snippet', label: 'iframe snippet' },
      { id: 'public-link', label: 'Public link' },
      { id: 'troubleshooting', label: 'Troubleshooting' },
    ],
    requirements: [
      'Form linked to your developer app',
      'Form status is published',
      'Website URL set under Settings → Domains',
    ],
    detailsLink: 'details',
    calloutTitle: 'Connect panel',
    calloutBody:
      'Open app → Forms → Connect for a live preview and copy buttons. Prefer that snippet over typing URLs by hand.',
    snippetTitle: 'iframe snippet',
    snippetP1Before: 'Use',
    snippetP1Link: 'event listener',
    snippetP1After:
      'can find the frame for auto-resize. Replace the slug with yours:',
    snippetP2:
      'The embed URL includes ?embed=1 so the form renders in embed mode (chrome suited for iframes).',
    publicTitle: 'Public link',
    publicBody:
      'Every form also has a standalone public page (no iframe). Share it when you do not need an on-site embed:',
    troubleshootingTitle: 'Troubleshooting',
    troubleshooting: [
      {
        title: 'Embed blocked / no preview',
        body: '— set the website URL, then publish the form.',
      },
      {
        title: 'Blank frame on your site',
        body: '— confirm the page origin matches the configured website origin (scheme, host, port).',
      },
      {
        title: 'Wrong height',
        body: '— add the resize listener.',
      },
    ],
    resizeLink: 'resize listener',
    prevLabel: 'Website domain',
    nextLabel: 'Embed events',
  },
  ar: {
    metaTitle: 'التضمين — النماذج | توثيق رُكني',
    metaDescription:
      'ادمِج نموذج رُكني مرتبطاً في موقعك بمقطع iframe آمن.',
    title: 'التضمين',
    description:
      'الصق iframe من Connect في موقعك. التضمين يتطلب نموذجاً منشوراً وأصل موقع تطبيقك.',
    toc: [
      { id: 'requirements', label: 'المتطلبات' },
      { id: 'snippet', label: 'مقطع iframe' },
      { id: 'public-link', label: 'الرابط العام' },
      { id: 'troubleshooting', label: 'استكشاف الأخطاء' },
    ],
    requirements: [
      'نموذج مرتبط بتطبيق المطوّر',
      'حالة النموذج منشورة',
      'رابط الموقع مضبوط تحت الإعدادات → النطاقات',
    ],
    detailsLink: 'التفاصيل',
    calloutTitle: 'لوحة Connect',
    calloutBody:
      'افتح التطبيق → النماذج → Connect لمعاينة مباشرة وأزرار نسخ. فضّل ذلك المقطع على كتابة الروابط يدوياً.',
    snippetTitle: 'مقطع iframe',
    snippetP1Before: 'استخدم',
    snippetP1Link: 'مستمع الأحداث',
    snippetP1After:
      'ليجد الإطار لتغيير الحجم التلقائي. استبدل الـ slug بخاصتك:',
    snippetP2:
      'يتضمن رابط التضمين ?embed=1 ليعرض النموذج في وضع التضمين (واجهة مناسبة لـ iframes).',
    publicTitle: 'الرابط العام',
    publicBody:
      'لكل نموذج أيضاً صفحة عامة مستقلة (بدون iframe). شاركها عندما لا تحتاج تضميناً في الموقع:',
    troubleshootingTitle: 'استكشاف الأخطاء',
    troubleshooting: [
      {
        title: 'التضمين محظور / لا معاينة',
        body: '— اضبط رابط الموقع ثم انشر النموذج.',
      },
      {
        title: 'إطار فارغ في موقعك',
        body: '— تأكد أن أصل الصفحة يطابق أصل الموقع المضبوط (المخطط، المضيف، المنفذ).',
      },
      {
        title: 'ارتفاع خاطئ',
        body: '— أضف مستمع تغيير الحجم.',
      },
    ],
    resizeLink: 'مستمع تغيير الحجم',
    prevLabel: 'نطاق الموقع',
    nextLabel: 'أحداث التضمين',
  },
};

export const formsEventsCopy: Localized<
  DocMeta & {
    overviewBefore: string;
    overviewLink: string;
    overviewAfter: string;
    eventsTitle: string;
    headers: [string, string, string];
    submittedWhen: string;
    submittedFields: string;
    resizeWhen: string;
    resizeFields: string;
    snippetTitle: string;
    snippetIntro: string;
    tipTitle: string;
    tipBody: string;
    securityTitle: string;
    securityBody: string;
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Embed events — Forms | Rukny Documentation',
    metaDescription:
      'Listen for Rukny form postMessage events for submissions and iframe resize.',
    title: 'Embed events',
    description:
      'The embedded form posts window messages to the parent page. Use them to close modals, track conversions, or resize the iframe.',
    toc: [
      { id: 'overview', label: 'Overview' },
      { id: 'events', label: 'Event types' },
      { id: 'snippet', label: 'Listener snippet' },
      { id: 'security', label: 'Origin checks' },
    ],
    overviewBefore: 'Messages use',
    overviewLink: 'embed snippet',
    overviewAfter: '.',
    eventsTitle: 'Event types',
    headers: ['event', 'When', 'Useful fields'],
    submittedWhen: 'After a successful submission',
    submittedFields: 'and related payload fields',
    resizeWhen: 'When the form height changes',
    resizeFields: '(number, pixels)',
    snippetTitle: 'Listener snippet',
    snippetIntro: 'Mark your iframe with data-rukny-form so resize can target it:',
    tipTitle: 'Tip',
    tipBody:
      'Connect in the portal copies this snippet for you. Keep it on every page that embeds the form if you rely on auto-height.',
    securityTitle: 'Origin checks',
    securityBody:
      'In production, validate event.origin against the Rukny public site origin that serves /f/… embeds. Do not trust messages from unexpected origins.',
    prevLabel: 'Embedding',
    nextLabel: 'Webhooks',
  },
  ar: {
    metaTitle: 'أحداث التضمين — النماذج | توثيق رُكني',
    metaDescription:
      'استمع لأحداث postMessage لنماذج رُكني للإرسالات وتغيير حجم iframe.',
    title: 'أحداث التضمين',
    description:
      'يرسل النموذج المضمّن رسائل نافذة إلى الصفحة الأم. استخدمها لإغلاق النوافذ أو تتبع التحويلات أو تغيير حجم iframe.',
    toc: [
      { id: 'overview', label: 'نظرة عامة' },
      { id: 'events', label: 'أنواع الأحداث' },
      { id: 'snippet', label: 'مقطع المستمع' },
      { id: 'security', label: 'فحص الأصل' },
    ],
    overviewBefore: 'تستخدم الرسائل',
    overviewLink: 'مقطع التضمين',
    overviewAfter: '.',
    eventsTitle: 'أنواع الأحداث',
    headers: ['الحدث', 'متى', 'حقول مفيدة'],
    submittedWhen: 'بعد إرسال ناجح',
    submittedFields: 'وحقول الحمولة ذات الصلة',
    resizeWhen: 'عندما يتغير ارتفاع النموذج',
    resizeFields: '(رقم، بكسل)',
    snippetTitle: 'مقطع المستمع',
    snippetIntro:
      'علّم iframe بـ data-rukny-form ليتمكن تغيير الحجم من استهدافه:',
    tipTitle: 'نصيحة',
    tipBody:
      'ينسخ Connect في البوابة هذا المقطع لك. أبقِه في كل صفحة تضمّن النموذج إن اعتمدت على الارتفاع التلقائي.',
    securityTitle: 'فحص الأصل',
    securityBody:
      'في الإنتاج، تحقّق من event.origin مقابل أصل موقع رُكني العام الذي يخدم تضمينات /f/…. لا تثق برسائل من أصول غير متوقعة.',
    prevLabel: 'التضمين',
    nextLabel: 'ويب هوك',
  },
};

export const formsWebhooksCopy: Localized<
  DocMeta & {
    whenBefore: string;
    whenLink: string;
    whenAfter: string;
    setupTitle: string;
    steps: Step[];
    securityTitle: string;
    securityBody: string;
    portalTitle: string;
    portalBody: string;
    prevLabel: string;
  }
> = {
  en: {
    metaTitle: 'Webhooks — Forms | Rukny Documentation',
    metaDescription:
      'Receive form submissions on your server via webhooks configured in Forms.',
    title: 'Webhooks',
    description:
      'Push each submission to your backend. Webhooks are configured in the Forms product integrations — the developer Connect page only surfaces status.',
    toc: [
      { id: 'when', label: 'When to use webhooks' },
      { id: 'setup', label: 'Setup' },
      { id: 'portal', label: 'In the developer portal' },
    ],
    whenBefore: 'Use a webhook when your server must store answers, sync a CRM, or trigger workflows. Prefer',
    whenLink: 'embed events',
    whenAfter: 'for lightweight UI updates in the browser.',
    setupTitle: 'Setup',
    steps: [
      {
        title: 'Open form integrations',
        body: 'In the Forms dashboard, open the form → Integrations (or use Configure webhook from Connect in the developer portal).',
      },
      {
        title: 'Add your HTTPS endpoint',
        body: 'Provide a URL your server can receive. Verify the payload and authenticate the request according to the Forms integration settings.',
      },
      {
        title: 'Submit a test response',
        body: 'Send a test submission and confirm your endpoint receives it before going live.',
      },
    ],
    securityTitle: 'Security',
    securityBody:
      'Keep webhook URLs private. Prefer HTTPS, reject unexpected payloads, and avoid exposing internal networks (SSRF-safe receivers).',
    portalTitle: 'In the developer portal',
    portalBody:
      'On Connect, if a webhook is already enabled you will see the URL (truncated when long). If not, the page links out to Forms integrations to configure one. Linking or unlinking the form in the developer app does not remove webhook settings in Forms.',
    prevLabel: 'Embed events',
  },
  ar: {
    metaTitle: 'ويب هوك — النماذج | توثيق رُكني',
    metaDescription:
      'استقبل إرسالات النماذج على خادمك عبر ويب هوك مضبوط في النماذج.',
    title: 'ويب هوك',
    description:
      'ادفع كل إرسال إلى خادمك. تُضبط الويب هوك في تكاملات منتج النماذج — صفحة Connect في المطوّرين تعرض الحالة فقط.',
    toc: [
      { id: 'when', label: 'متى تستخدم الويب هوك' },
      { id: 'setup', label: 'الإعداد' },
      { id: 'portal', label: 'في بوابة المطوّرين' },
    ],
    whenBefore:
      'استخدم ويب هوك عندما يجب أن يخزّن خادمك الإجابات أو يزامن CRM أو يشغّل سير عمل. فضّل',
    whenLink: 'أحداث التضمين',
    whenAfter: 'لتحديثات واجهة خفيفة في المتصفح.',
    setupTitle: 'الإعداد',
    steps: [
      {
        title: 'افتح تكاملات النموذج',
        body: 'في لوحة النماذج، افتح النموذج → التكاملات (أو استخدم إعداد ويب هوك من Connect في بوابة المطوّرين).',
      },
      {
        title: 'أضف نقطة HTTPS',
        body: 'قدّم رابطاً يمكن لخادمك استقباله. تحقّق من الحمولة وصادق الطلب وفق إعدادات تكامل النماذج.',
      },
      {
        title: 'أرسل رد اختبار',
        body: 'أرسل إرسالاً تجريبياً وتأكد أن نقطتك تستقبله قبل الإطلاق.',
      },
    ],
    securityTitle: 'الأمان',
    securityBody:
      'أبقِ روابط الويب هوك خاصة. فضّل HTTPS، ارفض الحمولات غير المتوقعة، وتجنّب كشف الشبكات الداخلية (مستقبلات آمنة من SSRF).',
    portalTitle: 'في بوابة المطوّرين',
    portalBody:
      'في Connect، إن كان الويب هوك مفعّلاً سترى الرابط (مقطوعاً إن طال). وإلا تربط الصفحة إلى تكاملات النماذج للإعداد. ربط أو إلغاء ربط النموذج في تطبيق المطوّر لا يزيل إعدادات الويب هوك في النماذج.',
    prevLabel: 'أحداث التضمين',
  },
};
