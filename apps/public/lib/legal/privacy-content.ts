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
  RefreshCw,
  Share2,
  ShieldCheck,
  UserCheck,
} from "lucide-react"
import type { LegalDocumentContent } from "./types"

export const privacyContentAr: LegalDocumentContent = {
  title: "سياسة الخصوصية",
  description:
    "توضّح هذه السياسة كيف تجمع ركني بياناتك الشخصية وتستخدمها وتخزّنها وتحميها عند استخدامك لمنصة ركني بأكملها: الحسابات، تطبيق النماذج (Forms)، بوابة المطورين (Developer)، وأي خدمات مرتبطة بحسابك.",
  lastUpdated: "يوليو 2026",
  sections: [
    {
      id: "intro",
      title: "مقدمة",
      icon: ShieldCheck,
      paragraphs: [
        "نلتزم في ركني (Rukny.io) بحماية خصوصيتك. تشرح هذه السياسة أنواع البيانات التي نجمعها عند استخدام حسابك ومنتجات المنصة، ولماذا نجمعها، ومع من نشاركها، وما هي حقوقك.",
        "تنطبق هذه السياسة على تطبيق الحسابات، وتطبيق النماذج، وبوابة المطورين، وخدمات المصادقة الموحّدة التي تربط حسابك ببقية المنتجات.",
      ],
    },
    {
      id: "platform",
      title: "نطاق المنصة",
      icon: Layers,
      paragraphs: [
        "تعمل منتجات ركني تحت حساب موحّد. قد تُعالَج بياناتك عبر أكثر من تطبيق لتقديم الخدمة التي طلبتها، مع تطبيق ضوابط أمنية متسقة عبر المنصة.",
      ],
      subsections: [
        {
          title: "الحسابات",
          text: "بيانات الهوية والأمان والجلسات والفوترة المشتركة.",
        },
        {
          title: "النماذج",
          text: "بيانات النماذج والإجابات والتحليلات وعضوية الفريق.",
        },
        {
          title: "المطورون",
          text: "بيانات التطبيقات ومفاتيح API وسجلات الاستخدام والتكاملات.",
        },
      ],
    },
    {
      id: "collection",
      title: "البيانات التي نجمعها",
      icon: Database,
      subsections: [
        {
          title: "بيانات الحساب",
          text: "مثل البريد الإلكتروني، واسم العرض، وصورة الملف الشخصي، ورقم الهاتف عند إضافته، ومعلومات إكمال الملف الشخصي.",
        },
        {
          title: "بيانات المصادقة",
          text: "مثل معرّفات مزودي OAuth المرتبطة (Google وGitHub وLinkedIn وFacebook)، وحالة التحقق من البريد، وإعدادات التحقق الثنائي.",
        },
        {
          title: "بيانات تقنية وأمنية",
          text: "مثل عنوان IP، ونوع المتصفح والجهاز، وسجلات تسجيل الدخول والجلسات، وسجلات الأمان لاكتشاف النشاط المشبوه ومنع إساءة الاستخدام.",
        },
        {
          title: "بيانات الاستخدام",
          text: "معلومات عامة عن تفاعلك مع خدمات المنصة، مثل الصفحات التي تزورها وإعدادات الأمان التي تغيّرها واستخدام الميزات داخل الحسابات والنماذج وبوابة المطورين.",
        },
      ],
    },
    {
      id: "forms-data",
      title: "بيانات تطبيق النماذج",
      icon: ClipboardList,
      paragraphs: [
        "عند استخدامك لتطبيق النماذج، قد نعالج البيانات التالية نيابةً عنك كمنشئ نموذج، أو كعضو في فريق، أو — عند ملء نموذج عام — كمشارك.",
      ],
      subsections: [
        {
          title: "بيانات المنشئ والفريق",
          text: "مثل عناوين النماذج وإعداداتها وحقولها وصلاحيات الفريق وإعدادات المشاركة والتحليلات المرتبطة بحسابك.",
        },
        {
          title: "إجابات المشاركين",
          text: "البيانات التي يقدّمها المشاركون عند ملء النماذج، بما في ذلك الإجابات النصية والملفات المرفوعة عند تفعيلها، وبيانات تقنية مثل وقت الإرسال وعنوان IP عند الحاجة للأمان أو منع الإساءة.",
        },
        {
          title: "مسؤولية منشئ النموذج",
          text: "إذا كنت منشئ نموذج، فأنت المتحكم في بيانات المشاركين التي تجمعها. يجب أن تُعلِم المشاركين بكيفية استخدام بياناتهم وفق القوانين المعمول بها، بينما نوفّر لك البنية التقنية لجمعها وتخزينها.",
        },
      ],
    },
    {
      id: "developer-data",
      title: "بيانات بوابة المطورين",
      icon: Code2,
      paragraphs: [
        "عند استخدام بوابة المطورين، قد نجمع ونعالج البيانات التالية المتعلقة بتطبيقاتك وتكاملاتك:",
      ],
      bullets: [
        "معلومات التطبيق: الاسم والوصف والأيقونة والحالة وإعدادات OAuth والنطاقات المسموحة.",
        "بيانات الاعتماد: معرّفات التطبيق ومفاتيح API (مخزّنة بشكل آمن ولا تُعرض كاملة بعد الإنشاء).",
        "سجلات الاستخدام: طلبات API والأخطاء ومؤشرات الأمان لاكتشاف إساءة الاستخدام وحماية المنصة.",
        "بيانات التكامل: إعدادات webhooks والمنتجات المرتبطة بالتطبيق عند تفعيلها.",
      ],
    },
    {
      id: "usage",
      title: "كيف نستخدم بياناتك",
      icon: Eye,
      paragraphs: [
        "نستخدم بياناتك لتقديم خدمات المنصة — الحسابات والنماذج وبوابة المطورين — والتحقق من هويتك وإدارة جلساتك وحماية حسابك من الوصول غير المصرّح به.",
      ],
      bullets: [
        "تفعيل تسجيل الدخول عبر البريد أو الروابط السحرية أو مزودي OAuth.",
        "تشغيل النماذج وجمع الإجابات وعرض التحليلات وإدارة فرق العمل.",
        "تشغيل تطبيقات المطورين وواجهات API والتكاملات المصرّح بها.",
        "إرسال إشعارات أمنية مهمة، مثل تنبيهات تسجيل دخول جديد أو تغييرات في إعدادات الأمان.",
        "تحسين موثوقية المنصة واكتشاف الاحتيال وإساءة الاستخدام.",
        "الامتثال للالتزامات القانونية والرد على الطلبات الرسمية عند الضرورة.",
      ],
    },
    {
      id: "oauth",
      title: "مزودو OAuth والخدمات الخارجية",
      icon: Key,
      paragraphs: [
        "عند تسجيل الدخول عبر مزود خارجي، نتلقى البيانات التي يشاركها ذلك المزود وفق أذوناتك، مثل البريد الإلكتروني والاسم وصورة الملف الشخصي.",
        "لا نتحكم في سياسات الخصوصية الخاصة بمزودي OAuth. ننصحك بمراجعة سياساتهم لفهم كيفية تعاملهم مع بياناتك.",
      ],
    },
    {
      id: "sharing",
      title: "مشاركة البيانات",
      icon: Share2,
      paragraphs: [
        "لا نبيع بياناتك الشخصية. قد نشارك بيانات محدودة فقط في الحالات التالية:",
      ],
      bullets: [
        "مع مزودي بنية تحتية موثوقين يساعدوننا في تشغيل المنصة (مثل الاستضافة والبريد والمراقبة)، وذلك بموجب التزامات تعاقدية وضوابط أمنية.",
        "عند الضرورة القانونية أو لحماية حقوق المستخدمين والمنصة والامتثال لأمر قضائي أو طلب رسمي.",
        "مع تطبيقات ركني الأخرى التي تسجّل دخولك إليها عبر حسابك الموحّد (مثل النماذج وبوابة المطورين)، وذلك لتقديم الخدمة التي طلبتها.",
        "مع منشئ النموذج عندما تملأ نموذجًا عامًا — تُشارك إجاباتك مع منشئ ذلك النموذج وفق إعداداته ومسؤوليته القانونية.",
      ],
    },
    {
      id: "security",
      title: "أمن البيانات",
      icon: Lock,
      paragraphs: [
        "نطبّق ضوابط أمنية تقنية وتنظيمية مناسبة، بما في ذلك الاتصالات المشفرة، وإدارة الجلسات، وخيارات التحقق الثنائي، ومراقبة محاولات الدخول المشبوهة.",
        "مع ذلك، لا يمكن ضمان أمان مطلق عبر الإنترنت. ننصحك باستخدام كلمة مرور قوية وتفعيل التحقق الإضافي المتاح.",
      ],
    },
    {
      id: "cookies",
      title: "ملفات تعريف الارتباط والتخزين المحلي",
      icon: Cookie,
      paragraphs: [
        "نستخدم ملفات تعريف الارتباط والتخزين المحلي لتشغيل الجلسات، وتذكّر تفضيلاتك (مثل اللغة)، وحماية طلبات المصادقة.",
        "يمكنك التحكم في بعض ملفات تعريف الارتباط من إعدادات المتصفح، لكن تعطيلها قد يؤثر على قدرتك على تسجيل الدخول أو استخدام بعض الميزات.",
      ],
    },
    {
      id: "retention",
      title: "الاحتفاظ بالبيانات",
      icon: Database,
      paragraphs: [
        "نحتفظ ببياناتك طالما كان حسابك نشطًا أو حسب الحاجة لتقديم الخدمة والامتثال للالتزامات القانونية والأمنية.",
        "قد نحتفظ بإجابات النماذج وسجلات API وفق إعداداتك وخطتك أو للامتثال القانوني. قد نحتفظ بسجلات أمنية لفترة محدودة بعد إغلاق الحساب عند الضرورة.",
      ],
    },
    {
      id: "rights",
      title: "حقوقك",
      icon: UserCheck,
      paragraphs: [
        "بحسب القوانين المعمول بها، قد يكون لك الحق في الوصول إلى بياناتك أو تصحيحها أو حذفها أو تقييد معالجتها أو الاعتراض على بعض الاستخدامات.",
        "يمكنك إدارة جزء كبير من بياناتك من إعدادات حسابك. إذا ملأت نموذجًا عامًا، فقد تحتاج للتواصل مع منشئ النموذج لممارسة بعض الحقوق المتعلقة بإجاباتك.",
      ],
    },
    {
      id: "children",
      title: "خصوصية الأطفال",
      icon: FileText,
      paragraphs: [
        "لا تستهدف خدمات ركني الأطفال دون السن القانوني لإنشاء حساب دون موافقة ولي الأمر حيث يقتضي القانون ذلك.",
        "إذا علمنا بجمع بيانات طفل دون الأساس القانوني المناسب، سنتخذ خطوات لحذفها عند التحقق من الأمر.",
      ],
    },
    {
      id: "international",
      title: "النقل الدولي للبيانات",
      icon: Globe,
      paragraphs: [
        "قد تُعالَج بياناتك أو تُخزَّن على خوادم خارج بلد إقامتك من خلال مزودي خدمات موثوقين. نطبّق ضمانات مناسبة لحماية بياناتك عند النقل أو المعالجة الدولية.",
      ],
    },
    {
      id: "changes",
      title: "تحديثات السياسة",
      icon: RefreshCw,
      paragraphs: [
        "قد نحدّث هذه السياسة لتعكس تغييرات في خدماتنا أو المتطلبات القانونية. عند التغييرات الجوهرية، سنبذل جهدًا معقولًا لإشعارك.",
        "يُعد استمرارك في استخدام الخدمة بعد نفاذ التحديث موافقة على السياسة المحدّثة.",
      ],
    },
    {
      id: "contact",
      title: "التواصل",
      icon: Mail,
      paragraphs: [
        "لأي استفسار حول الخصوصية أو لممارسة حقوقك، تواصل معنا عبر قنوات الدعم الرسمية داخل حسابك في ركني.",
      ],
      tocIgnore: true,
    },
  ],
}

export const privacyContentEn: LegalDocumentContent = {
  title: "Privacy Policy",
  description:
    "This policy explains how Rukny collects, uses, stores, and protects your personal data when you use the full platform: Accounts, Forms, the Developer portal, and any services linked to your account.",
  lastUpdated: "July 2026",
  sections: [
    {
      id: "intro",
      title: "Introduction",
      icon: ShieldCheck,
      paragraphs: [
        "At Rukny (Rukny.io), we are committed to protecting your privacy. This policy describes what data we collect when you use your account and platform products, why we collect it, who we share it with, and your rights.",
        "This policy applies to the accounts application, Forms, the Developer portal, and unified authentication services that connect your account to other products.",
      ],
    },
    {
      id: "platform",
      title: "Platform Scope",
      icon: Layers,
      paragraphs: [
        "Rukny products operate under a unified account. Your data may be processed across applications to deliver the service you requested, with consistent security controls across the platform.",
      ],
      subsections: [
        {
          title: "Accounts",
          text: "Identity, security, sessions, and shared billing data.",
        },
        {
          title: "Forms",
          text: "Form data, responses, analytics, and team membership.",
        },
        {
          title: "Developer",
          text: "App data, API keys, usage logs, and integrations.",
        },
      ],
    },
    {
      id: "collection",
      title: "Data We Collect",
      icon: Database,
      subsections: [
        {
          title: "Account data",
          text: "Such as email address, display name, profile photo, phone number when provided, and profile completion information.",
        },
        {
          title: "Authentication data",
          text: "Such as linked OAuth provider identifiers (Google, GitHub, LinkedIn, Facebook), email verification status, and two-factor settings.",
        },
        {
          title: "Technical and security data",
          text: "Such as IP address, browser and device type, login and session records, and security logs to detect suspicious activity and prevent abuse.",
        },
        {
          title: "Usage data",
          text: "General information about your interaction with platform services, such as pages visited, security settings changed, and feature usage across Accounts, Forms, and the Developer portal.",
        },
      ],
    },
    {
      id: "forms-data",
      title: "Forms Application Data",
      icon: ClipboardList,
      paragraphs: [
        "When you use Forms, we may process the following data on your behalf as a form creator, team member, or — when completing a public form — as a participant.",
      ],
      subsections: [
        {
          title: "Creator and team data",
          text: "Such as form titles, settings, fields, team permissions, sharing settings, and analytics linked to your account.",
        },
        {
          title: "Participant responses",
          text: "Data submitted when participants complete forms, including text answers and uploaded files when enabled, plus technical data such as submission time and IP address when needed for security or abuse prevention.",
        },
        {
          title: "Form creator responsibility",
          text: "If you are a form creator, you control participant data you collect. You must inform participants how their data will be used under applicable laws, while we provide the technical infrastructure to collect and store it.",
        },
      ],
    },
    {
      id: "developer-data",
      title: "Developer Portal Data",
      icon: Code2,
      paragraphs: [
        "When you use the Developer portal, we may collect and process the following data related to your apps and integrations:",
      ],
      bullets: [
        "App information: name, description, icon, status, OAuth settings, and allowed domains.",
        "Credentials: app identifiers and API keys (stored securely and not shown in full after creation).",
        "Usage logs: API requests, errors, and security signals to detect abuse and protect the platform.",
        "Integration data: webhook settings and products linked to the app when enabled.",
      ],
    },
    {
      id: "usage",
      title: "How We Use Your Data",
      icon: Eye,
      paragraphs: [
        "We use your data to provide platform services — Accounts, Forms, and the Developer portal — verify your identity, manage sessions, and protect your account from unauthorized access.",
      ],
      bullets: [
        "Enable sign-in via email, magic links, or OAuth providers.",
        "Operate forms, collect responses, display analytics, and manage teams.",
        "Operate developer apps, APIs, and authorized integrations.",
        "Send important security notifications, such as new login alerts or security setting changes.",
        "Improve platform reliability and detect fraud and abuse.",
        "Comply with legal obligations and respond to official requests when required.",
      ],
    },
    {
      id: "oauth",
      title: "OAuth Providers and Third Parties",
      icon: Key,
      paragraphs: [
        "When you sign in through an external provider, we receive data that provider shares according to your permissions, such as email, name, and profile photo.",
        "We do not control OAuth providers' privacy policies. We encourage you to review their policies to understand how they handle your data.",
      ],
    },
    {
      id: "sharing",
      title: "Data Sharing",
      icon: Share2,
      paragraphs: [
        "We do not sell your personal data. We may share limited data only in the following cases:",
      ],
      bullets: [
        "With trusted infrastructure providers that help operate the platform (such as hosting, email, and monitoring), under contractual obligations and security controls.",
        "When legally required or to protect users, the platform, and comply with court orders or official requests.",
        "With other Rukny applications you sign into using your unified account (such as Forms and the Developer portal), to deliver the service you requested.",
        "With the form creator when you complete a public form — your responses are shared with that form's creator according to their settings and legal responsibilities.",
      ],
    },
    {
      id: "security",
      title: "Data Security",
      icon: Lock,
      paragraphs: [
        "We apply appropriate technical and organizational security controls, including encrypted communications, session management, two-factor options, and monitoring of suspicious sign-in attempts.",
        "However, absolute security cannot be guaranteed over the internet. We recommend a strong password and enabling available additional verification.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and Local Storage",
      icon: Cookie,
      paragraphs: [
        "We use cookies and local storage to run sessions, remember preferences (such as language), and protect authentication requests.",
        "You can control some cookies through browser settings, but disabling them may affect your ability to sign in or use certain features.",
      ],
    },
    {
      id: "retention",
      title: "Data Retention",
      icon: Database,
      paragraphs: [
        "We retain your data while your account is active or as needed to provide the service and meet legal and security obligations.",
        "We may retain form responses and API logs according to your settings and plan or for legal compliance. We may retain security logs for a limited period after account closure when necessary.",
      ],
    },
    {
      id: "rights",
      title: "Your Rights",
      icon: UserCheck,
      paragraphs: [
        "Depending on applicable law, you may have the right to access, correct, delete, or restrict processing of your data, or object to certain uses.",
        "You can manage much of your data from account settings. If you completed a public form, you may need to contact the form creator to exercise some rights related to your responses.",
      ],
    },
    {
      id: "children",
      title: "Children's Privacy",
      icon: FileText,
      paragraphs: [
        "Rukny services are not directed at children below the legal age to create an account without parental consent where required by law.",
        "If we learn we collected a child's data without appropriate legal basis, we will take steps to delete it after verification.",
      ],
    },
    {
      id: "international",
      title: "International Data Transfers",
      icon: Globe,
      paragraphs: [
        "Your data may be processed or stored on servers outside your country of residence through trusted service providers. We apply appropriate safeguards when data is transferred or processed internationally.",
      ],
    },
    {
      id: "changes",
      title: "Policy Updates",
      icon: RefreshCw,
      paragraphs: [
        "We may update this policy to reflect changes in our services or legal requirements. For material changes, we will make reasonable efforts to notify you.",
        "Continued use after updates take effect constitutes acceptance of the updated policy.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      icon: Mail,
      paragraphs: [
        "For privacy questions or to exercise your rights, contact us through official support channels in your Rukny account.",
      ],
      tocIgnore: true,
    },
  ],
}
