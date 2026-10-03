import type { Locale } from '@/lib/locale';
import type { Localized } from '../types';
import {
  SEND_EXAMPLES,
  getSendExample,
  getSendExamplePager,
  type SendExample,
  type SendExampleId,
} from '@/lib/email-api-send-catalog';

type SectionOverlay = { title: string; description?: string };
type ExampleOverlay = {
  label: string;
  description: string;
  prerequisites: string[];
  sections: Record<string, SectionOverlay>;
};

const AR_OVERLAY: Record<SendExampleId, ExampleOverlay> = {
  'node': {
    label: "Node.js",
    description: "أرسل بريداً من Node.js أو TypeScript باستخدام @rukny/email الرسمي (موصى به) أو fetch.",
    prerequisites: [
      "تطبيق مطوّر رُكني مع تثبيت Email API",
      "نطاق موثّق ومُرسِل مصرّح",
      "مفتاح API بصلاحية email:send",
    ],
    sections: {
      'install': { title: "التثبيت" },
      'send': { title: "أرسل بريداً", description: "من جهة الخادم فقط — لا تعرض مفاتيح API في المتصفح." },
      'fetch': { title: "بديل: fetch" },
    },
  },
  'serverless': {
    label: "Serverless",
    description: "استدعِ REST API من Vercel Functions أو AWS Lambda أو Cloudflare Workers أو أي بيئة قصيرة العمر.",
    prerequisites: [
      "خزّن RUKNY_API_KEY في أسرار المنصة (لا ترفعه للمستودع)",
      "مُرسِل مصرّح على نطاق موثّق",
    ],
    sections: {
      'vercel': { title: "Vercel Function" },
      'lambda': { title: "AWS Lambda" },
      'workers': { title: "Cloudflare Workers" },
    },
  },
  'php': {
    label: "PHP",
    description: "أرسل عبر Guzzle أو cURL أو بريد Laravel فوق SMTP.",
    prerequisites: [
      "PHP 8.1+ مع curl أو Guzzle",
      "مفتاح API بصلاحية email:send، أو بيانات SMTP",
    ],
    sections: {
      'curl': { title: "cURL" },
      'guzzle': { title: "Guzzle" },
      'laravel-smtp': { title: "Laravel (SMTP)", description: "استخدم SMTP رُكني عندما تفضّل MAIL_MAILER=smtp." },
    },
  },
  'ruby': {
    label: "Ruby",
    description: "أرسل عبر Net::HTTP أو Faraday من Rails أو Sinatra أو Ruby العادي.",
    prerequisites: [
      "Ruby 3.x",
      "مفتاح API بصلاحية email:send",
    ],
    sections: {
      'net-http': { title: "Net::HTTP" },
      'faraday': { title: "Faraday" },
    },
  },
  'python': {
    label: "Python",
    description: "أرسل عبر requests أو httpx أو خوادم Django/FastAPI.",
    prerequisites: [
      "Python 3.9+",
      "مفتاح API بصلاحية email:send",
    ],
    sections: {
      'requests': { title: "requests" },
      'fastapi': { title: "مسار FastAPI" },
    },
  },
  'go': {
    label: "Go",
    description: "أرسل بحزمة net/http القياسية أو أي عميل HTTP.",
    prerequisites: [
      "Go 1.21+",
      "مفتاح API بصلاحية email:send",
    ],
    sections: {
      'net-http': { title: "net/http" },
    },
  },
  'rust': {
    label: "Rust",
    description: "أرسل عبر reqwest من Axum أو Actix أو أدوات CLI.",
    prerequisites: [
      "Rust 1.70+",
      "reqwest مع ميزة json",
    ],
    sections: {
      'reqwest': { title: "reqwest" },
    },
  },
  'elixir': {
    label: "Elixir",
    description: "أرسل من Phoenix أو Elixir العادي عبر Req أو HTTPoison.",
    prerequisites: [
      "Elixir 1.14+",
      "مفتاح API بصلاحية email:send",
    ],
    sections: {
      'req': { title: "Req" },
      'phoenix': { title: "متحكم Phoenix" },
    },
  },
  'java': {
    label: "Java",
    description: "أرسل عبر Java 11+ HttpClient من Spring Boot أو Java العادي.",
    prerequisites: [
      "Java 11+",
      "مفتاح API بصلاحية email:send",
    ],
    sections: {
      'httpclient': { title: "HttpClient" },
    },
  },
  'dotnet': {
    label: ".NET",
    description: "أرسل عبر HttpClient من ASP.NET Core أو تطبيقات الكونسول. SMTP يعمل أيضاً عبر MailKit.",
    prerequisites: [
      ".NET 6+",
      "مفتاح API بصلاحية email:send",
    ],
    sections: {
      'httpclient': { title: "HttpClient" },
      'smtp': { title: "SMTP (MailKit)" },
    },
  },
  'smtp': {
    label: "SMTP",
    description: "اربط أي عميل SMTP — Laravel وNodemailer وWordPress وDjango — بمفتاح API ككلمة المرور.",
    prerequisites: [
      "مفتاح API بصلاحية email:send",
      "نطاق موثّق ومُرسِل مصرّح لعنوان From",
    ],
    sections: {
      'credentials': { title: "بيانات الاعتماد" },
      'nodemailer': { title: "Nodemailer" },
      'laravel': { title: "Laravel" },
      'wordpress': { title: "WordPress", description: "استخدم أي إضافة SMTP (WP Mail SMTP وFluentSMTP وغيرها) بالبيانات أعلاه." },
    },
  },
  'cli': {
    label: "CLI",
    description: "أرسل وتحقق من الحالة عبر curl أو سكربتات shell دون SDK.",
    prerequisites: [
      "curl 7.x+",
      "مفتاح API بصلاحية email:send (وemail:read للحالة)",
    ],
    sections: {
      'send': { title: "إرسال" },
      'status': { title: "تحقق من الحالة" },
      'env': { title: "مساعد Shell" },
    },
  },
};

export const emailSendChromeCopy: Localized<{
  prerequisites: string;
  beforeSendTitle: string;
  beforeSendBefore: string;
  beforeSendLink: string;
  beforeSendAfter: string;
  sendingExamples: string;
  indexTitle: string;
  indexDescription: string;
  indexToc: string;
  indexMetaTitle: string;
  indexMetaDescription: string;
  prevMessages: string;
}> = {
  en: {
    prerequisites: "Prerequisites",
    beforeSendTitle: "Before you send",
    beforeSendBefore: "Verify your domain and authorize a sender in the",
    beforeSendLink: "developer portal",
    beforeSendAfter: ". Live sends require an Idempotency-Key on REST requests (SMTP uses Message-ID).",
    sendingExamples: "Sending examples",
    indexTitle: "Sending examples",
    indexDescription: "Pick your language or integration method. Every example uses the same verified senders, quotas, and delivery pipeline — REST or SMTP.",
    indexToc: "Choose your stack",
    indexMetaTitle: "Sending examples — Email API | Rukny Documentation",
    indexMetaDescription: "Send email with Node.js, Python, PHP, Go, Rust, SMTP, and more using the Rukny Email API.",
    prevMessages: "Messages",
  },
  ar: {
    prerequisites: "المتطلبات السابقة",
    beforeSendTitle: "قبل الإرسال",
    beforeSendBefore: "وثّق نطاقك وصرّح بمُرسِل في",
    beforeSendLink: "بوابة المطوّرين",
    beforeSendAfter: ". الإرسال الحي يتطلب Idempotency-Key على طلبات REST (SMTP يستخدم Message-ID).",
    sendingExamples: "أمثلة الإرسال",
    indexTitle: "أمثلة الإرسال",
    indexDescription: "اختر لغتك أو طريقة التكامل. كل مثال يستخدم نفس المُرسِلين الموثّقين والحصص ومسار التوصيل — REST أو SMTP.",
    indexToc: "اختر منصتك",
    indexMetaTitle: "أمثلة الإرسال — Email API | توثيق رُكني",
    indexMetaDescription: "أرسل بريداً بـ Node.js وPython وPHP وGo وRust وSMTP والمزيد عبر Rukny Email API.",
    prevMessages: "الرسائل",
  },
};

export function localizeSendExample(
  example: SendExample,
  locale: Locale,
): SendExample {
  if (locale !== 'ar') return example;
  const overlay = AR_OVERLAY[example.id];
  if (!overlay) return example;
  return {
    ...example,
    label: overlay.label,
    description: overlay.description,
    prerequisites: overlay.prerequisites,
    sections: example.sections.map((section) => {
      const s = overlay.sections[section.id];
      if (!s) return section;
      return {
        ...section,
        title: s.title,
        description: s.description ?? section.description,
      };
    }),
  };
}

export function getLocalizedSendExample(
  id: SendExampleId,
  locale: Locale,
): SendExample | undefined {
  const example = getSendExample(id);
  if (!example) return undefined;
  return localizeSendExample(example, locale);
}

export function getLocalizedSendExamples(locale: Locale): SendExample[] {
  return SEND_EXAMPLES.map((example) => localizeSendExample(example, locale));
}

export function getLocalizedSendExamplePager(
  id: SendExampleId,
  locale: Locale,
) {
  const pager = getSendExamplePager(id);
  const chrome = emailSendChromeCopy[locale] ?? emailSendChromeCopy.en;
  const localizeLabel = (label: string) => {
    const match = SEND_EXAMPLES.find((item) => item.label === label);
    if (!match) {
      if (label === 'Sending examples') return chrome.sendingExamples;
      return label;
    }
    return localizeSendExample(match, locale).label;
  };
  return {
    prev: pager.prev
      ? { ...pager.prev, label: localizeLabel(pager.prev.label) }
      : undefined,
    next: pager.next
      ? { ...pager.next, label: localizeLabel(pager.next.label) }
      : undefined,
  };
}
