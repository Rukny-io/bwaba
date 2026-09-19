/**
 * شروط الاستخدام — ركني (Rukny.io)
 *
 * ملاحظة للمطور (لا تُعرض للمستخدم):
 * 1) القانون الحاكم مضبوط على «المملكة العربية السعودية» — راجع محامياً محلياً إن كان التأسيس/المقر في دولة أخرى
 *    (خصوصاً مع تسعير IQD). غيّر الدولة وقانون النزاعات قبل الإنتاج إن لزم.
 * 2) سقف المسؤولية = المبالغ المدفوعة خلال 12 شهراً — شائع في SaaS؛ قد يقيّده القانون المحلي لعقود المستهلك.
 * 3) الاسترداد: الصياغة حذرة (لا استرداد تلقائي بعد التفعيل إلا ما يفرضه القانون أو نوافق عليه كتابةً).
 * 4) ركني ميل: المحتوى يُعالَج عبر بنية سحابية (S3 / Redis / قواعد تشغيل) — لا تدّعِ «لا نخزّن البريد» إن وُجدت
 *    نسخ تشغيلية لازمة للخدمة؛ الصياغة القانونية تفرق الملكية عن التخزين التشغيلي.
 * 5) مدة الاحتفاظ بعد الحذف: 30 يوماً — طابقها مع مسار الحذف الفعلي في المنتج/البنية.
 */
import {
  Ban,
  Blocks,
  ClipboardList,
  Code2,
  CreditCard,
  FileText,
  Globe,
  Key,
  Layers,
  Mail,
  Mails,
  RefreshCw,
  Scale,
  ShieldCheck,
} from "lucide-react"
import type { LegalDocumentContent } from "./types"

export const termsContentAr: LegalDocumentContent = {
  title: "شروط الاستخدام",
  description:
    "تنظّم هذه الشروط علاقتك التعاقدية مع ركني (Rukny.io) عند استخدام الحسابات الموحّدة، والنماذج، وركني ميل، وبوابة المطورين، وأي خدمة مرتبطة بحسابك. باستخدامك للمنصة فإنك توافق على هذه الشروط وعلى سياسة الخصوصية.",
  lastUpdated: "سبتمبر 2026",
  sections: [
    {
      id: "acceptance",
      title: "قبول الشروط",
      icon: Scale,
      paragraphs: [
        "تشكّل هذه الوثيقة اتفاقية ملزمة بينك وبين ركني. يُعد إنشاء حساب، أو تسجيل الدخول، أو استخدام أي منتج من منتجات ركني، أو الاستمرار في الاستخدام بعد إشعار بتحديث الشروط، قبولاً صريحاً لهذه الشروط ولسياسة الخصوصية.",
        "إذا كنت تستخدم الخدمة نيابةً عن منشأة، فإنك تقرّ بأن لديك صلاحية إلزام تلك المنشأة بهذه الشروط. إن لم توافق، يجب عليك التوقف فوراً عن استخدام الخدمة.",
        "قد تُضاف شروط خاصة بمنتج معيّن (مثل حدود الخطة في ركني ميل أو بوابة المطورين). عند التعارض، تسري الشروط الخاصة بالمنتج على ذلك المنتج فقط، مع بقاء بقية هذه الشروط نافذة.",
      ],
    },
    {
      id: "platform",
      title: "نطاق المنصة والمنتجات",
      icon: Layers,
      paragraphs: [
        "ركني منصة حسابات موحّدة تتيح الوصول إلى منتجات مترابطة. تختلف الميزات والحدود والأسعار حسب المنتج والخطة.",
      ],
      subsections: [
        {
          title: "الحسابات",
          text: "الهوية الموحّدة، الملف، الجلسات، الأمان، والفوترة المرتبطة بالحساب عند توفرها.",
        },
        {
          title: "النماذج (Forms)",
          text: "إنشاء النماذج، جمع الإجابات، التحليلات، والفرق والمشاركة.",
        },
        {
          title: "ركني ميل (Rukny Mail)",
          text: "مساحات عمل بريدية على نطاقك الخاص: صناديق بريد، إعدادات DNS، توجيه، فرق عمل، ويب ميل، وواجهات إرسال مرتبطة بالمنتج عند تفعيلها.",
        },
        {
          title: "بوابة المطورين",
          text: "التطبيقات، مفاتيح API، التكاملات، وإرسال البريد المعاملات عبر واجهة المطورين عند الاشتراك في ذلك المنتج.",
        },
      ],
    },
    {
      id: "account",
      title: "الحسابات والأمان",
      icon: Key,
      paragraphs: [
        "أنت مسؤول عن دقة بيانات التسجيل وتحديثها، وعن سرية بيانات الدخول الخاصة بك، وعن كل نشاط يتم عبر حسابك ما لم يُثبت أن الوصول غير المصرّح به نتج عن خلل في أنظمتنا.",
      ],
      subsections: [
        {
          title: "حماية بيانات الدخول",
          text: "يجب استخدام كلمة مرور قوية وعدم مشاركتها. عند توفر المصادقة الثنائية (2FA) أو عوامل تحقق إضافية للحساب أو لصناديق البريد، يُنصح بتفعيلها؛ وقد نطلبها لصلاحيات حساسة أو خطط معيّنة.",
        },
        {
          title: "الإبلاغ عن الاختراق",
          text: "تلتزم بإبلاغنا دون تأخير معقول عند اشتباهك في وصول غير مصرّح به إلى حسابك أو صناديقك أو مفاتيحك.",
        },
        {
          title: "الفريق والصلاحيات",
          text: "إذا دعوت أعضاءً إلى مساحة عمل (مثل ركني ميل)، فأنت مسؤول عن منح الحد الأدنى المناسب من الصلاحيات وعن سلوك من تدعوه ضمن تلك المساحة.",
        },
      ],
    },
    {
      id: "mail",
      title: "ركني ميل — نطاق الخدمة",
      icon: Mails,
      paragraphs: [
        "ركني ميل خدمة بريد على نطاق مخصص (Custom Domain Email). أنت تظل مسؤولاً عن ملكية النطاق وصلاحية نشر سجلات DNS لدى مسجّل النطاق، وعن قانونية عناوين الإرسال والاستقبال ومحتوى المراسلات.",
        "تعمل الخدمة عبر بنية سحابية ومزوّدي توصيل (بما في ذلك خدمات أمازون السحابية لتوصيل البريد وتخزين الكائنات عند الاقتضاء). قد تتأثر إمكانية الإرسال/الاستقبال بإعدادات DNS، وسمعة النطاق، وسياسات مزوّدي الطرف الثالث، وعوامل خارجة عن سيطرتنا الكاملة.",
      ],
      subsections: [
        {
          title: "محتوى البريد والملكية",
          text: "تظل ملكية محتوى رسائلك ومرفقاتك لك (أو لجهة عملك حسب اتفاقك الداخلي). بمنحك استخدام الخدمة، تمنح ركني ترخيصاً محدوداً غير حصري وقابلاً للإلغاء لتشغيل الخدمة فقط: بما في ذلك الاستلام، والنقل، والمعالجة، والتخزين التشغيلي، والعرض في الويب ميل، والنسخ الاحتياطي التشغيلي بالقدر اللازم لتقديم الخدمة وحمايتها. لا يشمل هذا الترخيص بيع المحتوى أو استخدامه لأغراض تسويق.",
        },
        {
          title: "التخزين التشغيلي",
          text: "يُعالَج محتوى البريد ويُحفظ ضمن بنية تشغيل الخدمة السحابية (بما في ذلك تخزين الكائنات مثل Amazon S3 للنسخ الواردة الخام عند الاقتضاء، وذاكرة Redis للجلسات والتخزين المؤقت التشغيلي، ومكوّنات قواعد البيانات اللازمة لتشغيل الصندوق والويب ميل). هذا تخزين تشغيلي لتقديم الخدمة، وليس تنازلاً عن ملكيتك للمحتوى.",
        },
        {
          title: "حدود تقنية",
          text: "تخضع الصناديق والتخزين والمقاعد والميزات لحدود الخطة والمساحات. تجاوز الحدود أو إساءة الاستخدام قد يؤدي إلى تقييد الإرسال أو الاستقبال أو الوصول إلى حين التسوية.",
        },
      ],
    },
    {
      id: "forms",
      title: "تطبيق النماذج (Forms)",
      icon: ClipboardList,
      paragraphs: [
        "عند استخدام النماذج كمنشئ أو مدير، فأنت المسؤول عن قانونية المحتوى وجمع البيانات وموافقات المشاركين عند الاقتضاء.",
      ],
      subsections: [
        {
          title: "مسؤولية المنشئ",
          text: "تتحمّل مسؤولية ما تنشره في النموذج وما تجمعه من المشاركين، وإبلاغهم عند اللزوم بكيفية استخدام بياناتهم.",
        },
        {
          title: "المشاركون",
          text: "قد يملأ المشاركون النماذج دون حساب ركني. تبقى مسؤولية بيانات المشاركين على منشئ النموذج، مع التزامك بسياسة الخصوصية العامة لركني فيما يخص تشغيل المنصة.",
        },
      ],
    },
    {
      id: "developer",
      title: "بوابة المطورين وواجهات البرمجة",
      icon: Code2,
      paragraphs: [
        "أنت مسؤول عن سرية مفاتيح API والرموز، وعن طلب الحد الأدنى من الأذونات، وعن سلوك تطبيقاتك تجاه المستخدمين النهائيين. يُحظر تضمين الأسرار في مستودعات عامة أو تجاوز حدود الخطة أو التحايل على قيود الأمان.",
      ],
    },
    {
      id: "aup",
      title: "الاستخدام المقبول",
      icon: Blocks,
      paragraphs: [
        "يُسمح باستخدام ركني للأغراض المشروعة فقط. دون حصر، يُحظر:",
      ],
      bullets: [
        "إرسال البريد المزعج (Spam)، أو الحملات غير المرغوب فيها، أو شراء قوائم عناوين دون أساس قانوني واضح.",
        "التصيّد (Phishing)، أو انتحال الهوية، أو التحايل، أو توزيع برمجيات خبيثة أو روابط ضارة.",
        "انتهاك خصوصية الغير أو حقوق الملكية الفكرية أو أي نشاط مخالف للقانون المعمول به.",
        "محاولة اختراق الأنظمة، أو تجاوز حدود الاستخدام، أو تعطيل الخدمة، أو إعادة بيع الوصول دون إذن.",
        "استخدام ركني ميل أو واجهات الإرسال بطريقة تضر بسمعة البنية أو شبكات التوصيل أو مستخدمي المنصة الآخرين.",
      ],
      subsections: [
        {
          title: "التعليق الفوري",
          text: "نحتفظ بالحق في تعليق الحساب أو المساحة أو مفاتيح الإرسال فوراً ودون إشعار مسبق عند الاشتباه المعقول في إخلال جوهري بهذه القواعد، أو نشاط يهدد أمن المنصة أو الغير، مع إمكانية الإنهاء وفق قسم إنهاء الخدمة.",
        },
      ],
    },
    {
      id: "availability",
      title: "نطاق الخدمة وحدود الضمان",
      icon: Globe,
      paragraphs: [
        "تُقدَّم الخدمة «كما هي» و«كما هي متاحة» (As-Is / As-Available) في الحدود التي يسمح بها القانون. نسعى لمعقولية التوافر والأمان، لكننا لا نضمن خلو الخدمة من الأخطاء أو الانقطاع بنسبة 100%، ولا نضمن أن الخدمة ستلبي كل غرض خاص بك دون انقطاع.",
        "قد نجري صيانة، أو تحديثات، أو تغييرات في الميزات، أو نقيّد وظائف معيّنة لأسباب أمنية أو تشغيلية أو قانونية. نبذل جهداً معقولاً للإشعار بالتغييرات الجوهرية عند الإمكان.",
        "لا نتحمّل مسؤولية تعطل ناتج عن إعدادات DNS لدى طرف ثالث، أو حظر مزوّدي البريد، أو انقطاع مزوّدي السحابة/التوصيل، أو أحداث قوة قاهرة.",
      ],
    },
    {
      id: "billing",
      title: "الفوترة والتجديد والاسترداد",
      icon: CreditCard,
      paragraphs: [
        "تُعرض الأسعار والعملة وحدود الخطة داخل المنتج (وقد تكون بالدينار العراقي IQD أو أي عملة نعلنها). باشتراكك في خطة مدفوعة فإنك توافق على الرسوم المعروضة وقت الطلب أو التجديد.",
      ],
      subsections: [
        {
          title: "التجديد",
          text: "ما لم يُذكر خلاف ذلك في واجهة الفوترة، قد تُجدَّد الاشتراكات تلقائياً لنفس المدة عند تفعيل التجديد التلقائي. يمكنك إدارة الإلغاء وفق الخيارات المتاحة قبل نهاية الدورة الحالية.",
        },
        {
          title: "الدفع والتأخر",
          text: "عدم سداد الرسوم المستحقة قد يؤدي إلى تقييد الميزات المدفوعة أو تعليق المساحة ذات الصلة إلى حين التسوية، مع بقاء التزاماتك عن الفترات السابقة.",
        },
        {
          title: "سياسة الاسترداد",
          text: "ما لم يفرض القانون خلافاً ذلك أو نوافق كتابةً، لا تُسترد الرسوم المدفوعة عن فترات اشتراك فُعّلت أو استُهلكت. إن وُجد عرض استرداد خاص، يسري وفق شروط ذلك العرض فقط.",
        },
      ],
    },
    {
      id: "ip",
      title: "الملكية الفكرية",
      icon: ShieldCheck,
      paragraphs: [
        "تبقى جميع حقوق منصة ركني (البرمجيات، الواجهات، العلامات، والوثائق) ملكاً لركني أو لمرخّصيها. لا يمنحك الاستخدام ملكية فيها، بل ترخيص استخدام محدود وفق هذه الشروط.",
        "تحتفظ بملكية محتواك (بما في ذلك محتوى البريد والنماذج والتطبيقات التي تنشئها)، مع الترخيص التشغيلي المحدود الممنوح لنا لتشغيل الخدمة كما هو مبيّن في قسم ركني ميل وقسم النماذج.",
      ],
    },
    {
      id: "liability",
      title: "تحديد المسؤولية",
      icon: Scale,
      paragraphs: [
        "إلى أقصى حد يسمح به القانون المعمول به: لا تتحمل ركني المسؤولية عن الأضرار غير المباشرة أو التبعية أو الفوات في الأرباح أو فقدان البيانات أو انقطاع الأعمال الناشئة عن استخدام الخدمة أو تعذر استخدامها، حتى لو أُخطرنا بإمكانية وقوعها.",
        "في جميع الأحوال، لا تتجاوز المسؤولية الإجمالية لركني تجاهك عن أي مطالبات ناشئة عن هذه الشروط أو الخدمة مجموع المبالغ التي دفعتها فعلياً لركني عن الخدمة المعنية خلال الاثني عشر (12) شهراً السابقة مباشرةً لنشوء المطالبة. إن لم تكن هناك مبالغ مدفوعة، تكون المسؤولية محدودة بأقصى قدر يسمح به القانون للحد الأدنى غير القابل للإعفاء.",
        "لا يُقصد بهذا القسم استبعاد المسؤولية عن الغش أو الإهمال الجسيم أو أي مسؤولية لا يجوز استبعادها قانوناً.",
      ],
    },
    {
      id: "termination",
      title: "إنهاء الخدمة ومصير البيانات",
      icon: Ban,
      paragraphs: [
        "يمكنك التوقف عن استخدام الخدمة وطلب إغلاق الحساب أو أرشفة/حذف مساحة عمل وفق الأدوات المتاحة في المنتج.",
        "يجوز لنا إنهاء أو تعليق الوصول مع إشعار مسبق معقول عند التوقف عن تقديم منتج، أو عند الإخلال بالشروط، أو لأسباب قانونية/أمنية. في حالات الإخلال الجسيم أو الضرر الوشيك، يجوز التعليق الفوري كما في قسم الاستخدام المقبول.",
        "بعد إغلاق الحساب أو حذف المساحة، نسعى لحذف أو تعطيل الوصول إلى بيانات المحتوى المرتبطة ضمن مدة احتفاظ تشغيلية لا تتجاوز عادةً ثلاثين (30) يوماً، ما لم يلزم الاحتفاظ لفترة أطول للامتثال القانوني أو حل النزاعات أو الأمن، أو ما بقى لدى مزوّدي البنية كنسخ احتياطية دورية تُمحى وفق دوراتهم. تفاصيل المعالجة في سياسة الخصوصية.",
      ],
    },
    {
      id: "governing-law",
      title: "القانون الحاكم وحل النزاعات",
      icon: Globe,
      paragraphs: [
        "تخضع هذه الشروط وتُفسَّر وفقاً لأنظمة المملكة العربية السعودية، دون إعمال لقواعد تنازع القوانين التي تؤدي إلى تطبيق قانون دولة أخرى، وذلك في الحدود التي يسمح بها القانون.",
        "يُسعى أولاً إلى حل أي نزاع ودياً عبر التواصل على support@rukny.io. إن تعذّر الحل الودي، تكون الجهة القضائية المختصة في المملكة العربية السعودية صاحبة الاختصاص، ما لم يفرض قانون حماية المستهلك أو نظام آخر اختصاصاً إلزامياً مختلفاً.",
      ],
    },
    {
      id: "updates",
      title: "تعديل الشروط",
      icon: RefreshCw,
      paragraphs: [
        "قد نحدّث هذه الشروط لتعكس تطور المنتج أو المتطلبات النظامية. عند التغييرات الجوهرية نبذل جهداً معقولاً للإشعار عبر المنصة أو البريد المرتبط بالحساب.",
        "استمرارك في الاستخدام بعد سريان التعديل يُعد قبولاً للنسخة المحدّثة. إن لم توافق، يجب التوقف عن الاستخدام وإغلاق الحساب وفق الإجراءات المتاحة.",
      ],
    },
    {
      id: "contact",
      title: "التواصل",
      icon: Mail,
      paragraphs: [
        "للاستفسارات القانونية أو المتعلقة بهذه الشروط: support@rukny.io، أو عبر قنوات الدعم داخل حسابك.",
      ],
      tocIgnore: true,
    },
  ],
}

export const termsContentEn: LegalDocumentContent = {
  title: "Terms of Service",
  description:
    "These terms govern your contract with Rukny (Rukny.io) when you use unified accounts, Forms, Rukny Mail, the Developer portal, and related services. By using the platform you agree to these Terms and the Privacy Policy.",
  lastUpdated: "September 2026",
  sections: [
    {
      id: "acceptance",
      title: "Acceptance of terms",
      icon: Scale,
      paragraphs: [
        "These Terms are a binding agreement between you and Rukny. Creating an account, signing in, using any Rukny product, or continuing after notice of updated Terms constitutes acceptance of these Terms and the Privacy Policy.",
        "If you use the service for an organization, you represent that you can bind that organization. If you do not agree, stop using the service immediately.",
        "Product-specific terms (for example plan limits in Rukny Mail or Developer) may apply. On conflict, product-specific terms control for that product only.",
      ],
    },
    {
      id: "platform",
      title: "Platform and products",
      icon: Layers,
      paragraphs: [
        "Rukny is a unified-account platform for connected products. Features, limits, and pricing vary by product and plan.",
      ],
      subsections: [
        {
          title: "Accounts",
          text: "Unified identity, profile, sessions, security, and related billing when available.",
        },
        {
          title: "Forms",
          text: "Form building, responses, analytics, teams, and sharing.",
        },
        {
          title: "Rukny Mail",
          text: "Custom-domain mail workspaces: mailboxes, DNS setup, routing, teams, webmail, and related sending interfaces when enabled.",
        },
        {
          title: "Developer",
          text: "Apps, API keys, integrations, and transactional email APIs when subscribed.",
        },
      ],
    },
    {
      id: "account",
      title: "Accounts and security",
      icon: Key,
      paragraphs: [
        "You are responsible for accurate registration data, keeping credentials confidential, and activity on your account unless unauthorized access results from a defect in our systems.",
      ],
      subsections: [
        {
          title: "Credential protection",
          text: "Use a strong password and do not share it. Where two-factor authentication (2FA) or extra factors are available for the account or mailboxes, you should enable them; we may require them for sensitive actions or certain plans.",
        },
        {
          title: "Breach notice",
          text: "You must notify us without unreasonable delay if you suspect unauthorized access to your account, mailboxes, or keys.",
        },
        {
          title: "Team access",
          text: "If you invite members to a workspace (including Rukny Mail), you are responsible for least-privilege roles and for invitees’ conduct in that workspace.",
        },
      ],
    },
    {
      id: "mail",
      title: "Rukny Mail — service scope",
      icon: Mails,
      paragraphs: [
        "Rukny Mail is custom-domain email. You remain responsible for domain ownership, publishing DNS at your registrar, and the lawfulness of addresses and message content.",
        "The service runs on cloud infrastructure and delivery providers (including Amazon cloud services for mail delivery and object storage where applicable). Deliverability may depend on DNS, domain reputation, third-party policies, and factors outside our full control.",
      ],
      subsections: [
        {
          title: "Mail content and ownership",
          text: "You (or your organization under your internal arrangements) retain ownership of message content and attachments. By using the service you grant Rukny a limited, non-exclusive, revocable license solely to operate the service: receive, transmit, process, operationally store, display in webmail, and keep operational backups as needed to provide and protect the service. This license does not include selling content or using it for marketing.",
        },
        {
          title: "Operational storage",
          text: "Mail content is processed and stored in the cloud infrastructure we operate for the service (including object storage such as Amazon S3 for inbound raw copies where applicable, Redis for sessions and operational cache, and database components needed to run mailboxes and webmail). That is operational storage to deliver the product — not a transfer of ownership.",
        },
        {
          title: "Technical limits",
          text: "Mailboxes, storage, seats, and features follow plan and workspace limits. Exceeding limits or abuse may restrict send, receive, or access until resolved.",
        },
      ],
    },
    {
      id: "forms",
      title: "Forms",
      icon: ClipboardList,
      paragraphs: [
        "As a form creator or admin, you are responsible for lawful content, collection, and participant notices/consents when required.",
      ],
      subsections: [
        {
          title: "Creator responsibility",
          text: "You are responsible for what your form asks and what you collect, and for informing participants when required.",
        },
        {
          title: "Participants",
          text: "Participants may submit without a Rukny account. Participant data remains primarily the form owner’s responsibility, subject to Rukny’s Privacy Policy for platform operations.",
        },
      ],
    },
    {
      id: "developer",
      title: "Developer portal and APIs",
      icon: Code2,
      paragraphs: [
        "You are responsible for API key secrecy, least-privilege scopes, and your apps’ conduct toward end users. Publishing secrets, bypassing plan limits, or circumventing security controls is prohibited.",
      ],
    },
    {
      id: "aup",
      title: "Acceptable use",
      icon: Blocks,
      paragraphs: [
        "Rukny may only be used for lawful purposes. Without limitation, you must not:",
      ],
      bullets: [
        "Send spam, unsolicited bulk mail, or use purchased lists without a clear lawful basis.",
        "Engage in phishing, impersonation, fraud, or distribute malware or harmful links.",
        "Violate others’ privacy or intellectual property, or break applicable law.",
        "Attempt intrusion, exceed usage limits, disrupt the service, or resell access without permission.",
        "Use Rukny Mail or sending APIs in ways that harm infrastructure reputation, delivery networks, or other users.",
      ],
      subsections: [
        {
          title: "Immediate suspension",
          text: "We may suspend an account, workspace, or sending keys immediately without prior notice on reasonable suspicion of material breach or activity that threatens the platform or others, with termination governed by the termination section.",
        },
      ],
    },
    {
      id: "availability",
      title: "Service scope and warranty limits",
      icon: Globe,
      paragraphs: [
        "The service is provided “as is” and “as available” to the extent permitted by law. We aim for reasonable availability and security, but we do not warrant 100% error-free or uninterrupted service, or that it will meet every particular purpose without interruption.",
        "We may perform maintenance, updates, feature changes, or restrict functions for security, operational, or legal reasons. We will use reasonable efforts to notify material changes when practicable.",
        "We are not liable for outages caused by third-party DNS, provider blocking, cloud/delivery provider downtime, or force majeure.",
      ],
    },
    {
      id: "billing",
      title: "Billing, renewal, and refunds",
      icon: CreditCard,
      paragraphs: [
        "Prices, currency, and plan limits are shown in-product (including IQD or another currency we announce). Subscribing to a paid plan means you agree to the fees shown at purchase or renewal.",
      ],
      subsections: [
        {
          title: "Renewal",
          text: "Unless stated otherwise in billing UI, subscriptions may auto-renew for the same term when auto-renew is enabled. You may cancel under available options before the current term ends.",
        },
        {
          title: "Non-payment",
          text: "Failure to pay may restrict paid features or suspend the related workspace until settled, without waiving amounts already owed.",
        },
        {
          title: "Refunds",
          text: "Unless required by law or agreed in writing, fees for activated or consumed subscription periods are non-refundable. Special refund offers apply only on their stated terms.",
        },
      ],
    },
    {
      id: "ip",
      title: "Intellectual property",
      icon: ShieldCheck,
      paragraphs: [
        "Rukny’s platform (software, UI, marks, documentation) remains owned by Rukny or its licensors. Use grants a limited license only.",
        "You retain ownership of your content (including mail, forms, and apps you create), subject to the limited operational license described for Mail and Forms.",
      ],
    },
    {
      id: "liability",
      title: "Limitation of liability",
      icon: Scale,
      paragraphs: [
        "To the maximum extent permitted by law: Rukny is not liable for indirect, consequential, lost profits, data loss, or business interruption arising from use of or inability to use the service, even if advised of the possibility.",
        "Rukny’s aggregate liability for claims arising from these Terms or the service will not exceed the amounts you actually paid Rukny for the relevant service in the twelve (12) months immediately before the claim arose. If no amounts were paid, liability is limited to the minimum non-excludable amount required by law.",
        "Nothing in this section excludes liability for fraud, willful misconduct, or liability that cannot be limited by law.",
      ],
    },
    {
      id: "termination",
      title: "Termination and data fate",
      icon: Ban,
      paragraphs: [
        "You may stop using the service and request account closure or workspace archive/deletion using in-product tools.",
        "We may terminate or suspend access with reasonable prior notice when discontinuing a product, for breach, or for legal/security reasons. For material breach or imminent harm, immediate suspension may apply as in Acceptable Use.",
        "After account closure or workspace deletion, we aim to delete or disable access to related content within an operational retention window that typically does not exceed thirty (30) days, unless longer retention is required for legal compliance, disputes, or security, or residual copies remain in provider backups purged on their cycles. Processing details are in the Privacy Policy.",
      ],
    },
    {
      id: "governing-law",
      title: "Governing law and disputes",
      icon: Globe,
      paragraphs: [
        "These Terms are governed by the laws of the Kingdom of Saudi Arabia, excluding conflict-of-law rules that would apply another jurisdiction, to the extent permitted by law.",
        "Parties should first attempt amicable resolution via support@rukny.io. If unresolved, courts in the Kingdom of Saudi Arabia have jurisdiction, unless mandatory consumer or other law requires a different forum.",
      ],
    },
    {
      id: "updates",
      title: "Changes to these Terms",
      icon: RefreshCw,
      paragraphs: [
        "We may update these Terms for product or legal changes. For material updates we will use reasonable efforts to notify you in-product or via the account email.",
        "Continued use after an update takes effect constitutes acceptance. If you disagree, stop using the service and close the account under available procedures.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      icon: Mail,
      paragraphs: [
        "Legal or Terms questions: support@rukny.io, or support channels inside your account.",
      ],
      tocIgnore: true,
    },
  ],
}
