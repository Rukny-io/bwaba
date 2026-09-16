import {
  ClipboardList,
  Code2,
  Cookie,
  Database,
  Eye,
  FileText,
  Globe,
  Key,
  Layers,
  Lock,
  Mail,
  Mails,
  RefreshCw,
  Share2,
  ShieldCheck,
  UserCheck,
} from "lucide-react"
import type { LegalDocumentContent } from "./types"

export const privacyContentAr: LegalDocumentContent = {
  title: "سياسة الخصوصية",
  description:
    "هذه الصفحة تشرح ماذا نعرف عنك عندما تستخدم ركني، ولماذا نحتاجه، ومع من نشاركه. نكتبها بوضوح قدر الإمكان — بدون مفاجآت.",
  lastUpdated: "سبتمبر 2026",
  sections: [
    {
      id: "intro",
      title: "قبل أن تبدأ",
      icon: ShieldCheck,
      paragraphs: [
        "ركني (Rukny.io) منصة للحسابات والنماذج والبريد وواجهة المطورين. هذه السياسة تغطّي كل ذلك عندما تستخدم منتجاتنا التي تشير إليها.",
        "ما لا تغطّيه: المحتوى الذي يضعه عملاؤنا داخل خدماتهم (مثل إجابات نموذج يملكونه، أو رسائل داخل صندوق بريدهم). لذلك قواعده يحددها صاحب الحساب، ونحن نشغّل البنية التقنية فقط.",
        "إذا لم توافق على هذه السياسة، لا تستخدم ركني.",
      ],
    },
    {
      id: "platform",
      title: "ما الذي تشمله ركني؟",
      icon: Layers,
      paragraphs: [
        "حساب واحد يفتح لك أكثر من منتج. قد تنتقل بياناتك بين هذه المنتجات فقط لأنك طلبت الخدمة — بنفس ضوابط الأمان تقريباً في كل مكان.",
      ],
      subsections: [
        {
          title: "الحسابات",
          text: "تسجيل الدخول، الملف، الجلسات، الأمان، والفوترة المشتركة إن وُجدت.",
        },
        {
          title: "النماذج",
          text: "إنشاء النماذج، الإجابات، التحليلات، وفرق العمل.",
        },
        {
          title: "البريد",
          text: "مساحات العمل، النطاقات، الصناديق، والويب ميل المرتبط بحسابك.",
        },
        {
          title: "المطورون",
          text: "التطبيقات، مفاتيح API، السجلات، والتكاملات.",
        },
      ],
    },
    {
      id: "collection",
      title: "ماذا نجمع؟",
      icon: Database,
      paragraphs: [
        "نجمع معلومات أثناء تقديم الخدمة. الأنواع الأساسية:",
      ],
      subsections: [
        {
          title: "ما تعطيه لنا",
          text: "مثل البريد، الاسم، صورة الملف، رقم الهاتف إن أضفته، وكلمة المرور (نخزّنها مشفّرة ولا نراها كنص واضح).",
        },
        {
          title: "تسجيل الدخول عبر طرف ثالث",
          text: "إذا دخلت عبر Google أو GitHub أو LinkedIn أو Facebook، نستلم ما يسمح لك المزود بمشاركته — غالباً البريد والاسم والصورة.",
        },
        {
          title: "ما يُجمع تلقائياً",
          text: "عنوان IP تقريبي، نوع المتصفح والجهاز، أوقات تسجيل الدخول، وسجلات الجلسات والأمان لاكتشاف النشاط الغريب ومنع الإساءة.",
        },
        {
          title: "كيف تستخدم المنتج",
          text: "صفحات تزورها داخل ركني، تغييرات إعدادات الأمان، واستخدام الميزات في الحسابات والنماذج والبريد وبوابة المطورين — بشكل عام، وليس قراءة رسائلك الخاصة حرفياً لأغراض تسويق.",
        },
      ],
    },
    {
      id: "forms-data",
      title: "النماذج",
      icon: ClipboardList,
      paragraphs: [
        "إذا أنشأت نموذجاً أو انضممت لفريق، نعالج بيانات النموذج نيابةً عنك. إذا ملأ شخص نموذجاً عاماً، تذهب إجاباته إلى منشئ النموذج.",
      ],
      subsections: [
        {
          title: "منشئ النموذج والفريق",
          text: "عناوين النماذج، الحقول، الصلاحيات، المشاركة، والتحليلات المرتبطة بحسابك.",
        },
        {
          title: "إجابات المشاركين",
          text: "ما يكتبه المشاركون أو يرفعونه، وأحياناً وقت الإرسال أو عنوان IP إذا احتجنا ذلك للأمان أو منع الإساءة.",
        },
        {
          title: "من المسؤول؟",
          text: "أنت تتحكم في بيانات المشاركين التي تجمعها. أخبرهم لماذا تجمعها كما يطلب القانون. نحن نوفر الأدوات والتخزين؛ نحن لسنا من يقرر محتوى نموذجك.",
        },
      ],
    },
    {
      id: "mail-data",
      title: "البريد",
      icon: Mails,
      paragraphs: [
        "عندما تستخدم ركني ميل، نعالج بيانات مساحة العمل والصناديق حتى يعمل الإرسال والاستقبال والويب ميل.",
      ],
      subsections: [
        {
          title: "مساحة العمل والنطاق",
          text: "اسم المساحة، النطاق، سجلات DNS التي تنشرها، وحالة التحقق.",
        },
        {
          title: "الصناديق والجلسات",
          text: "عناوين الصناديق، إعدادات مثل الأسماء المستعارة والموجّهات، وجلسات الويب ميل بعد تسجيل الدخول.",
        },
        {
          title: "محتوى الرسائل",
          text: "نخزّن الرسائل والمرفقات داخل صندوقك لتقديم الخدمة. لا نبيع محتوى بريدك. قد نمسح أو نقيّد الوصول عند إساءة الاستخدام أو طلب قانوني واضح.",
        },
      ],
    },
    {
      id: "developer-data",
      title: "بوابة المطورين",
      icon: Code2,
      paragraphs: [
        "إذا بنيت تطبيقاً على ركني، نحتاج بيانات التشغيل التالية:",
      ],
      bullets: [
        "معلومات التطبيق: الاسم، الوصف، الأيقونة، الحالة، وإعدادات OAuth.",
        "بيانات الاعتماد: معرّفات التطبيق ومفاتيح API (تُحفظ بأمان ولا تُعرض كاملة بعد إنشائها).",
        "سجلات الاستخدام: طلبات API والأخطاء وإشارات الأمان لاكتشاف الإساءة.",
        "التكاملات: webhooks والمنتجات المرتبطة عند تفعيلها.",
      ],
    },
    {
      id: "usage",
      title: "لماذا نستخدم هذه البيانات؟",
      icon: Eye,
      paragraphs: [
        "نستخدمها لتشغيل ركني وإبقائها آمنة. بالأخص:",
      ],
      bullets: [
        "تشغيل تسجيل الدخول والجلسات والحساب الموحّد.",
        "تشغيل النماذج والبريد وواجهات API التي طلبتها.",
        "إرسال تنبيهات أمنية مهمة (مثل دخول جديد أو تغيير كلمة المرور).",
        "إصلاح الأعطال وتحسين الاستقرار ومنع الاحتيال والإساءة.",
        "الرد على طلب قانوني رسمي عندما يلزم ذلك.",
      ],
    },
    {
      id: "oauth",
      title: "مزودو تسجيل الدخول",
      icon: Key,
      paragraphs: [
        "عند الدخول عبر مزود خارجي، نستلم فقط ما يشاركونه معنا حسب أذوناتك.",
        "سياساتهم ليست سياساتنا. راجع صفحة الخصوصية لديهم إن أردت تفاصيل أكثر عن بياناتهم.",
      ],
    },
    {
      id: "sharing",
      title: "هل نشارك بياناتك؟",
      icon: Share2,
      paragraphs: [
        "لا نبيع معلوماتك الشخصية. نشاركها فقط في حالات محدودة:",
      ],
      bullets: [
        "مع مزودين يساعدوننا على تشغيل المنصة (استضافة، بريد، مراقبة) — ويحصلون فقط على ما يحتاجونه لعملهم.",
        "بين تطبيقات ركني التي تدخلها بنفس الحساب، حتى تعمل الخدمة التي طلبتها.",
        "مع منشئ النموذج عندما تملأ نموذجاً عاماً — إجاباتك تذهب إليه وفق مسؤوليته.",
        "إذا طلب القانون ذلك، أو لحماية المستخدمين والمنصة من ضرر واضح.",
      ],
    },
    {
      id: "security",
      title: "كيف نحمي المعلومات؟",
      icon: Lock,
      paragraphs: [
        "نصمّم الأنظمة مع اعتبار الأمان: اتصالات مشفّرة، إدارة جلسات، تحقق بخطوتين اختياري، ومراقبة لمحاولات الدخول المشبوهة.",
        "لا يوجد نظام مضمون 100% على الإنترنت. استخدم كلمة مرور قوية وفعّل التحقق الإضافي إن استطعت.",
      ],
    },
    {
      id: "cookies",
      title: "ملفات تعريف الارتباط",
      icon: Cookie,
      paragraphs: [
        "نستخدم ملفات تعريف الارتباط والتخزين المحلي لإبقاء جلستك، وتذكّر اللغة أو المظهر، وحماية طلبات تسجيل الدخول.",
        "يمكنك تقييد بعض الملفات من المتصفح، لكن قد يتوقف تسجيل الدخول أو جزء من الميزات.",
      ],
    },
    {
      id: "retention",
      title: "كم نحتفظ بالبيانات؟",
      icon: Database,
      paragraphs: [
        "نحتفظ بما نحتاجه طالما حسابك نشط، أو طالما يلزم لتقديم الخدمة والالتزامات القانونية والأمنية.",
        "إجابات النماذج ورسائل البريد وسجلات API تعتمد على إعداداتك وخطتك. قد نحتفظ بسجلات أمنية لفترة محدودة بعد إغلاق الحساب إذا لزم الأمر.",
      ],
    },
    {
      id: "rights",
      title: "خياراتك وحقوقك",
      icon: UserCheck,
      paragraphs: [
        "يمكنك عادةً عرض أو تحديث أو حذف كثير من بيانات حسابك من الإعدادات.",
        "بحسب بلدك، قد يكون لك أيضاً طلب الوصول أو التصحيح أو الحذف أو تقييد المعالجة. راسلنا وسنساعدك قدر الإمكان.",
        "إذا ملأت نموذجاً لشخص آخر، تواصل معه بخصوص إجاباتك — هو من يتحكم فيها غالباً.",
      ],
    },
    {
      id: "children",
      title: "الأطفال",
      icon: FileText,
      paragraphs: [
        "ركني ليست للاستخدام من قبل الأطفال دون السن القانوني لإنشاء حساب بدون موافقة ولي الأمر حيث يطلب القانون ذلك.",
        "إذا عرفنا أن طفلاً أنشأ حساباً بلا أساس قانوني مناسب، نحذف البيانات بعد التحقق.",
      ],
    },
    {
      id: "international",
      title: "أين تُحفظ البيانات؟",
      icon: Globe,
      paragraphs: [
        "قد تُعالَج بياناتك أو تُخزَّن على خوادم خارج بلدك عبر مزودين نستخدمهم لتشغيل الخدمة. عندما يحدث ذلك، نحرص على نقلها بطريقة مسموحة قانوناً وبحد أدنى من التعريض.",
      ],
    },
    {
      id: "changes",
      title: "إذا حدّثنا هذه الصفحة",
      icon: RefreshCw,
      paragraphs: [
        "قد نغيّر السياسة عندما تتغير المنتجات أو القانون. للتغييرات المهمة نحاول إشعارك.",
        "استمرارك في استخدام ركني بعد سريان التحديث يعني أنك قرأت النسخة الجديدة.",
      ],
    },
    {
      id: "contact",
      title: "تواصل معنا",
      icon: Mail,
      paragraphs: [
        "أسئلة الخصوصية أو طلبات الحقوق: support@rukny.io أو من داخل حسابك عبر الدعم.",
      ],
      tocIgnore: true,
    },
  ],
}

export const privacyContentEn: LegalDocumentContent = {
  title: "Privacy Policy",
  description:
    "This page explains what we know about you when you use Rukny, why we need it, and who we share it with. We try to keep it plain — no surprises.",
  lastUpdated: "September 2026",
  sections: [
    {
      id: "intro",
      title: "Before you start",
      icon: ShieldCheck,
      paragraphs: [
        "Rukny (Rukny.io) is a platform for accounts, forms, mail, and developer tools. This notice covers those products when they point to this page.",
        "It does not cover “content” our customers put inside their own services — for example answers on a form they own, or messages in a mailbox they control. That content is governed by the account owner; we run the infrastructure.",
        "If you don’t agree with this policy, please don’t use Rukny.",
      ],
    },
    {
      id: "platform",
      title: "What Rukny includes",
      icon: Layers,
      paragraphs: [
        "One account can open more than one product. Your data may move between those products only because you asked for that service — with similar security controls across the platform.",
      ],
      subsections: [
        {
          title: "Accounts",
          text: "Sign-in, profile, sessions, security, and shared billing when available.",
        },
        {
          title: "Forms",
          text: "Form building, responses, analytics, and team access.",
        },
        {
          title: "Mail",
          text: "Workspaces, domains, mailboxes, and webmail tied to your account.",
        },
        {
          title: "Developer",
          text: "Apps, API keys, usage logs, and integrations.",
        },
      ],
    },
    {
      id: "collection",
      title: "What we collect",
      icon: Database,
      paragraphs: [
        "We collect information while providing the service. The main types:",
      ],
      subsections: [
        {
          title: "Information you give us",
          text: "Email, display name, profile photo, phone number if you add one, and your password (stored hashed — we don’t keep it in plain text).",
        },
        {
          title: "Sign-in with a third party",
          text: "If you sign in with Google, GitHub, LinkedIn, or Facebook, we receive what that provider is allowed to share — usually email, name, and photo.",
        },
        {
          title: "Information collected automatically",
          text: "Approximate IP address, browser and device type, sign-in times, and session or security logs so we can spot odd activity and stop abuse.",
        },
        {
          title: "How you use the product",
          text: "Pages you visit in Rukny, security setting changes, and feature use across Accounts, Forms, Mail, and Developer — in aggregate. We don’t read your private mail for marketing.",
        },
      ],
    },
    {
      id: "forms-data",
      title: "Forms",
      icon: ClipboardList,
      paragraphs: [
        "If you create a form or join a team, we process form data for you. If someone fills a public form, their answers go to the form owner.",
      ],
      subsections: [
        {
          title: "Creator and team",
          text: "Form titles, fields, permissions, sharing, and analytics linked to your account.",
        },
        {
          title: "Participant responses",
          text: "What people type or upload, and sometimes submission time or IP when we need it for security or abuse prevention.",
        },
        {
          title: "Who is responsible?",
          text: "You control the participant data you collect. Tell people why you collect it when the law requires it. We provide the tools and storage — we don’t decide what your form asks.",
        },
      ],
    },
    {
      id: "mail-data",
      title: "Mail",
      icon: Mails,
      paragraphs: [
        "When you use Rukny Mail, we process workspace and mailbox data so send, receive, and webmail work.",
      ],
      subsections: [
        {
          title: "Workspace and domain",
          text: "Workspace name, domain, DNS records you publish, and verification status.",
        },
        {
          title: "Mailboxes and sessions",
          text: "Mailbox addresses, settings like aliases and forwarders, and webmail sessions after you sign in.",
        },
        {
          title: "Message content",
          text: "We store messages and attachments in your mailbox to provide the service. We don’t sell your email content. We may delete or restrict access if there’s clear abuse or a lawful request.",
        },
      ],
    },
    {
      id: "developer-data",
      title: "Developer portal",
      icon: Code2,
      paragraphs: [
        "If you build on Rukny, we need this operating data:",
      ],
      bullets: [
        "App details: name, description, icon, status, and OAuth settings.",
        "Credentials: app IDs and API keys (stored securely and not shown in full after creation).",
        "Usage logs: API requests, errors, and security signals to catch abuse.",
        "Integrations: webhooks and linked products when you enable them.",
      ],
    },
    {
      id: "usage",
      title: "How we use it",
      icon: Eye,
      paragraphs: [
        "We use this information to run Rukny and keep it safe. In particular:",
      ],
      bullets: [
        "Sign-in, sessions, and your unified account.",
        "Forms, Mail, and APIs you asked for.",
        "Important security alerts (new login, password change, and similar).",
        "Fixing outages, improving reliability, and stopping fraud or abuse.",
        "Responding to a formal legal request when we have to.",
      ],
    },
    {
      id: "oauth",
      title: "Sign-in providers",
      icon: Key,
      paragraphs: [
        "When you sign in with an external provider, we only get what they share based on your permissions.",
        "Their policies aren’t ours. Read their privacy pages if you want more detail about their side.",
      ],
    },
    {
      id: "sharing",
      title: "Do we share your data?",
      icon: Share2,
      paragraphs: [
        "We don’t sell your personal information. We share it only in limited cases:",
      ],
      bullets: [
        "With vendors who help us run the platform (hosting, email delivery, monitoring) — they get only what they need for that job.",
        "Across Rukny apps you open with the same account, so the service you asked for actually works.",
        "With a form creator when you submit a public form — your answers go to them under their responsibility.",
        "When the law requires it, or to protect users and the platform from clear harm.",
      ],
    },
    {
      id: "security",
      title: "How we protect information",
      icon: Lock,
      paragraphs: [
        "We design systems with security in mind: encrypted connections, session controls, optional two-factor authentication, and monitoring for suspicious sign-ins.",
        "Nothing online is 100% guaranteed. Use a strong password and turn on extra verification when you can.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies",
      icon: Cookie,
      paragraphs: [
        "We use cookies and local storage to keep you signed in, remember language or theme, and protect sign-in requests.",
        "You can block some cookies in your browser, but sign-in or parts of the product may stop working.",
      ],
    },
    {
      id: "retention",
      title: "How long we keep it",
      icon: Database,
      paragraphs: [
        "We keep what we need while your account is active, or as long as required to provide the service and meet legal or security duties.",
        "Form answers, mailbox mail, and API logs follow your settings and plan. We may keep security logs for a limited time after you close an account when needed.",
      ],
    },
    {
      id: "rights",
      title: "Your choices and rights",
      icon: UserCheck,
      paragraphs: [
        "You can usually view, update, or delete a lot of account data in settings.",
        "Depending on where you live, you may also ask to access, correct, delete, or limit processing. Email us and we’ll help where we can.",
        "If you filled someone else’s form, contact them about those answers — they usually control that data.",
      ],
    },
    {
      id: "children",
      title: "Children",
      icon: FileText,
      paragraphs: [
        "Rukny isn’t meant for children under the age required to create an account without a parent or guardian where the law says so.",
        "If we learn a child created an account without a proper legal basis, we’ll delete the data after we verify.",
      ],
    },
    {
      id: "international",
      title: "Where data lives",
      icon: Globe,
      paragraphs: [
        "Your data may be processed or stored on servers outside your country through providers we use to run the service. When that happens, we transfer it in ways the law allows and with as little exposure as practical.",
      ],
    },
    {
      id: "changes",
      title: "If we update this page",
      icon: RefreshCw,
      paragraphs: [
        "We may change this policy when products or the law change. For important updates, we’ll try to notify you.",
        "Keeping using Rukny after an update takes effect means you’ve seen the new version.",
      ],
    },
    {
      id: "contact",
      title: "Contact us",
      icon: Mail,
      paragraphs: [
        "Privacy questions or rights requests: support@rukny.io, or support from inside your Rukny account.",
      ],
      tocIgnore: true,
    },
  ],
}
