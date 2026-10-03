import type { Localized, DocMeta } from '../types';

export type FormsOverviewCopy = DocMeta & {
  features: { title: string; description: string }[];
  howItWorks: { title: string; body: string };
  calloutTitle: string;
  calloutBody: string;
  whereToStart: {
    title: string;
    cards: { href: string; title: string; description: string }[];
  };
  notIncluded: {
    title: string;
    beforeLink: string;
    linkLabel: string;
    afterLink: string;
  };
  nextLabel: string;
};

export const formsOverviewCopy: Localized<FormsOverviewCopy> = {
  en: {
    metaTitle: 'Forms | Rukny Documentation',
    metaDescription:
      'Link Rukny forms to your developer app, embed them on your website, and handle submissions.',
    title: 'Forms',
    description:
      'Connect forms built in Rukny Forms to your developer app, embed them securely on your website, and react when someone submits.',
    toc: [
      { id: 'what-you-can-build', label: 'What you can build' },
      { id: 'how-it-works', label: 'How it works' },
      { id: 'where-to-start', label: 'Where to start' },
      { id: 'not-included', label: 'What it is not' },
    ],
    features: [
      {
        title: 'On-site intake',
        description:
          'Contact, lead, waitlist, and support forms that live on your domain.',
      },
      {
        title: 'Secure embeds',
        description:
          'iframe embeds locked to your app website origin — not open to the whole web.',
      },
      {
        title: 'In-page events',
        description:
          'Listen for submit and resize postMessage events from the embed.',
      },
      {
        title: 'Server webhooks',
        description: 'Push answers to your backend when a form is submitted.',
      },
    ],
    howItWorks: {
      title: 'How it works',
      body: 'You design and publish forms in the Forms product. In the developer portal you install Forms on an app, link a form, set your website URL under Domains, then copy the iframe snippet from Connect. One form links to one developer app.',
    },
    calloutTitle: 'Portal-first',
    calloutBody:
      'Linking, domain allowlisting, and embed snippets are managed in the developer dashboard — there is no public Forms REST API for embeds yet.',
    whereToStart: {
      title: 'Where to start',
      cards: [
        {
          href: '/documentation/forms/get-started',
          title: 'Get started',
          description:
            'Install Forms, create or link a form, set your domain, and embed.',
        },
        {
          href: '/documentation/forms/embedding',
          title: 'Embedding',
          description: 'iframe code, publish rules, and how origin checks work.',
        },
        {
          href: '/documentation/forms/events',
          title: 'Embed events',
          description: 'postMessage events for submit and auto-resize.',
        },
        {
          href: '/documentation/forms/webhooks',
          title: 'Webhooks',
          description: 'Send submissions to your server from Forms integrations.',
        },
      ],
    },
    notIncluded: {
      title: 'What it is not',
      beforeLink:
        'Forms docs cover connecting and embedding forms from the developer portal. Form builder UX, response analytics, and team collaboration live in the',
      linkLabel: 'Forms dashboard',
      afterLink:
        '. This is not a substitute for Email API or WhatsApp messaging.',
    },
    nextLabel: 'Get started',
  },
  ar: {
    metaTitle: 'النماذج | توثيق رُكني',
    metaDescription:
      'اربط نماذج رُكني بتطبيق المطوّر، وادمِجها في موقعك، وتعامل مع الإرسالات.',
    title: 'النماذج',
    description:
      'اربط النماذج المبنية في رُكني فورمز بتطبيق المطوّر، وادمِجها بأمان في موقعك، وتفاعل عند الإرسال.',
    toc: [
      { id: 'what-you-can-build', label: 'ماذا يمكنك بناؤه' },
      { id: 'how-it-works', label: 'كيف يعمل' },
      { id: 'where-to-start', label: 'من أين تبدأ' },
      { id: 'not-included', label: 'ما ليس عليه' },
    ],
    features: [
      {
        title: 'استقبال على موقعك',
        description:
          'نماذج تواصل وعملاء وقوائم انتظار ودعم تعيش على نطاقك.',
      },
      {
        title: 'تضمين آمن',
        description:
          'تضمين iframe مقيد بأصل موقع تطبيقك — وليس مفتوحاً لكل الويب.',
      },
      {
        title: 'أحداث داخل الصفحة',
        description:
          'استمع لأحداث الإرسال وتغيير الحجم عبر postMessage من التضمين.',
      },
      {
        title: 'ويب هوك للخادم',
        description: 'ادفع الإجابات إلى خادمك عند إرسال النموذج.',
      },
    ],
    howItWorks: {
      title: 'كيف يعمل',
      body: 'تصمّم النماذج وتنشرها في منتج النماذج. في بوابة المطوّرين تثبّت النماذج على تطبيق، وتربط نموذجاً، وتضبط رابط موقعك تحت النطاقات، ثم تنسخ مقطع iframe من Connect. نموذج واحد يرتبط بتطبيق مطوّر واحد.',
    },
    calloutTitle: 'البوابة أولاً',
    calloutBody:
      'الربط وقائمة النطاقات المسموحة ومقاطع التضمين تُدار من لوحة المطوّرين — لا يوجد بعد Forms REST API عام للتضمين.',
    whereToStart: {
      title: 'من أين تبدأ',
      cards: [
        {
          href: '/documentation/forms/get-started',
          title: 'البدء',
          description:
            'ثبّت النماذج، أنشئ أو اربط نموذجاً، اضبط النطاق، وادمِج.',
        },
        {
          href: '/documentation/forms/embedding',
          title: 'التضمين',
          description: 'كود iframe وقواعد النشر وكيف تُفحص الأصول.',
        },
        {
          href: '/documentation/forms/events',
          title: 'أحداث التضمين',
          description: 'أحداث postMessage للإرسال وتغيير الحجم التلقائي.',
        },
        {
          href: '/documentation/forms/webhooks',
          title: 'ويب هوك',
          description: 'أرسل الإرسالات إلى خادمك من تكاملات النماذج.',
        },
      ],
    },
    notIncluded: {
      title: 'ما ليس عليه',
      beforeLink:
        'توثيق النماذج يغطي الربط والتضمين من بوابة المطوّرين. واجهة بناء النماذج وتحليل الردود والتعاون الجماعي موجودة في',
      linkLabel: 'لوحة النماذج',
      afterLink: '. هذا ليس بديلاً عن Email API أو رسائل واتساب.',
    },
    nextLabel: 'البدء',
  },
};
