import type { Localized, DocMeta } from '../types';

export const whatsappRestCopy: Localized<
  DocMeta & {
    authBody: string;
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'REST & curl — WhatsApp API | Rukny Documentation',
    metaDescription: 'Call the Rukny WhatsApp API with plain HTTPS requests.',
    title: 'REST & curl',
    description:
      'Use any HTTP client. All examples assume JSON request bodies and the public API base URL.',
    toc: [
      { id: 'base', label: 'Base URL' },
      { id: 'auth', label: 'Auth header' },
      { id: 'example', label: 'Example' },
    ],
    authBody:
      'Send X-API-Key on every request. For JSON posts also send Content-Type: application/json.',
    prevLabel: 'Node.js SDK',
    nextLabel: 'API reference',
  },
  ar: {
    metaTitle: 'REST و curl — WhatsApp API | توثيق رُكني',
    metaDescription: 'استدعِ Rukny WhatsApp API بطلبات HTTPS عادية.',
    title: 'REST و curl',
    description:
      'استخدم أي عميل HTTP. كل الأمثلة تفترض أجسام JSON ورابط الـ API العام.',
    toc: [
      { id: 'base', label: 'الرابط الأساسي' },
      { id: 'auth', label: 'ترويسة المصادقة' },
      { id: 'example', label: 'مثال' },
    ],
    authBody:
      'أرسل X-API-Key في كل طلب. لطلبات JSON أرسل أيضاً Content-Type: application/json.',
    prevLabel: 'Node.js SDK',
    nextLabel: 'مرجع API',
  },
};

export const whatsappSendIndexCopy: Localized<
  DocMeta & {
    recipes: { href: string; title: string; description: string }[];
    languagesBefore: string;
    languagesLink: string;
    languagesAfter: string;
    prevLabel: string;
    nextLabel: string;
  }
> = {
  en: {
    metaTitle: 'Sending examples — WhatsApp API | Rukny Documentation',
    metaDescription: 'Text, template, and OTP WhatsApp send examples for Rukny.',
    title: 'Sending examples',
    description: 'Copy-ready recipes for the most common outbound message shapes.',
    toc: [
      { id: 'recipes', label: 'Recipes' },
      { id: 'languages', label: 'Languages' },
    ],
    recipes: [
      {
        href: '/documentation/whatsapp-api/send/text',
        title: 'Text message',
        description: 'Free-form text inside the customer care window.',
      },
      {
        href: '/documentation/whatsapp-api/send/template',
        title: 'Template message',
        description: 'Approved template with body variables.',
      },
      {
        href: '/documentation/whatsapp-api/send/otp',
        title: 'OTP / authentication',
        description: 'AUTHENTICATION template for one-time codes.',
      },
    ],
    languagesBefore:
      'Each recipe includes curl and Node.js samples. For Python and PHP see the same pages, or use',
    languagesLink: 'REST & curl',
    languagesAfter: 'as a baseline for any HTTP client.',
    prevLabel: 'Errors',
    nextLabel: 'Text message',
  },
  ar: {
    metaTitle: 'أمثلة الإرسال — WhatsApp API | توثيق رُكني',
    metaDescription: 'أمثلة إرسال واتساب للنص والقالب وOTP عبر رُكني.',
    title: 'أمثلة الإرسال',
    description: 'وصفات جاهزة لأشكل الرسائل الصادرة الأكثر شيوعاً.',
    toc: [
      { id: 'recipes', label: 'الوصفات' },
      { id: 'languages', label: 'اللغات' },
    ],
    recipes: [
      {
        href: '/documentation/whatsapp-api/send/text',
        title: 'رسالة نصية',
        description: 'نص حر داخل نافذة رعاية العملاء.',
      },
      {
        href: '/documentation/whatsapp-api/send/template',
        title: 'رسالة قالب',
        description: 'قالب معتمد مع متغيرات الجسم.',
      },
      {
        href: '/documentation/whatsapp-api/send/otp',
        title: 'OTP / المصادقة',
        description: 'قالب AUTHENTICATION لرموز لمرة واحدة.',
      },
    ],
    languagesBefore:
      'كل وصفة تتضمن عينات curl وNode.js. لـ Python وPHP راجع نفس الصفحات، أو استخدم',
    languagesLink: 'REST و curl',
    languagesAfter: 'كأساس لأي عميل HTTP.',
    prevLabel: 'الأخطاء',
    nextLabel: 'رسالة نصية',
  },
};

export const whatsappRecipeMeta: Localized<
  Record<
    string,
    {
      title: string;
      description: string;
      metaTitle: string;
      prevLabel: string;
      nextLabel: string;
    }
  >
> = {
  en: {
    text: {
      title: 'Text message',
      description: 'Send a free-form text body to an E.164 WhatsApp number.',
      metaTitle: 'Text message — WhatsApp API | Rukny Documentation',
      prevLabel: 'Sending examples',
      nextLabel: 'Template message',
    },
    template: {
      title: 'Template message',
      description: 'Send an approved template with body parameters.',
      metaTitle: 'Template message — WhatsApp API | Rukny Documentation',
      prevLabel: 'Text message',
      nextLabel: 'OTP / authentication',
    },
    otp: {
      title: 'OTP / authentication',
      description: 'Send a one-time code with an AUTHENTICATION template.',
      metaTitle: 'OTP / authentication — WhatsApp API | Rukny Documentation',
      prevLabel: 'Template message',
      nextLabel: 'Node.js SDK',
    },
  },
  ar: {
    text: {
      title: 'رسالة نصية',
      description: 'أرسل نصاً حراً إلى رقم واتساب بصيغة E.164.',
      metaTitle: 'رسالة نصية — WhatsApp API | توثيق رُكني',
      prevLabel: 'أمثلة الإرسال',
      nextLabel: 'رسالة قالب',
    },
    template: {
      title: 'رسالة قالب',
      description: 'أرسل قالباً معتمداً مع معاملات الجسم.',
      metaTitle: 'رسالة قالب — WhatsApp API | توثيق رُكني',
      prevLabel: 'رسالة نصية',
      nextLabel: 'OTP / المصادقة',
    },
    otp: {
      title: 'OTP / المصادقة',
      description: 'أرسل رمزاً لمرة واحدة بقالب AUTHENTICATION.',
      metaTitle: 'OTP / المصادقة — WhatsApp API | توثيق رُكني',
      prevLabel: 'رسالة قالب',
      nextLabel: 'Node.js SDK',
    },
  },
};
