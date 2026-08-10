import {
  Ban,
  Blocks,
  ClipboardList,
  Code2,
  FileText,
  Globe,
  Key,
  Layers,
  Mail,
  RefreshCw,
  Scale,
  ShieldCheck,
} from "lucide-react"
import type { LegalDocumentContent } from "./types"

export const termsContentAr: LegalDocumentContent = {
  title: "شروط الاستخدام",
  description:
    "توضّح هذه الوثيقة القواعد المنظّمة لاستخدامك لمنصة ركني (Rukny.io) بأكملها: الحسابات، تطبيق النماذج (Forms)، بوابة المطورين (Developer)، وأي منتجات أو خدمات مرتبطة بحسابك الموحّد.",
  lastUpdated: "يوليو 2026",
  sections: [
    {
      id: "intro",
      title: "مقدمة",
      icon: FileText,
      paragraphs: [
        "تنظّم هذه الشروط علاقتك مع منصة ركني (Rukny.io) عند إنشاء حساب أو تسجيل الدخول أو استخدام أي من تطبيقاتها ومكوناتها، بما في ذلك النماذج وبوابة المطورين.",
        "باستخدامك للمنصة، فإنك تقرّ بأنك قرأت هذه الشروط وسياسة الخصوصية وفهمتهما. إذا لم توافق عليهما، يُرجى التوقف عن استخدام الخدمة.",
      ],
    },
    {
      id: "acceptance",
      title: "قبول الشروط ونطاق التطبيق",
      icon: Scale,
      paragraphs: [
        "بإنشائك حسابًا أو تسجيل دخولك أو استمرارك في استخدام ركني، فأنت توافق على هذه الشروط وعلى سياسة الخصوصية وأي سياسات إضافية مرتبطة بالخدمات التي تستخدمها.",
        "تسري هذه الشروط على جميع طرق الوصول إلى المنصة، بما في ذلك تسجيل الدخول بالبريد الإلكتروني أو الروابط السحرية أو مزودي OAuth (مثل Google وGitHub وLinkedIn وFacebook)، وعلى جميع التطبيقات التي تصل إليها عبر حسابك الموحّد.",
      ],
    },
    {
      id: "platform",
      title: "نطاق المنصة والمنتجات",
      icon: Layers,
      paragraphs: [
        "تشمل منصة ركني مجموعة منتجات مترابطة تعمل تحت هوية وحساب موحّد. قد تخضع بعض الميزات لشروط أو حدود استخدام إضافية داخل كل تطبيق.",
      ],
      subsections: [
        {
          title: "الحسابات (Accounts)",
          text: "خدمة الهوية الموحّدة وإدارة الحساب والأمان والفوترة المشتركة عند توفرها.",
        },
        {
          title: "النماذج (Forms)",
          text: "أداة إنشاء النماذج وجمع الإجابات والتحليلات وإدارة الفرق والمشاركة العامة للنماذج.",
        },
        {
          title: "المطورون (Developer)",
          text: "بوابة إنشاء التطبيقات وإدارة مفاتيح API وOAuth والتكاملات والمنتجات المطوّرة على منصة ركني.",
        },
      ],
    },
    {
      id: "account",
      title: "الحساب وتسجيل الدخول",
      icon: Key,
      subsections: [
        {
          title: "هوية موحّدة",
          text: "يوفّر حساب ركني وصولًا موحّدًا وآمنًا إلى منتجات المنصة — بما فيها النماذج وبوابة المطورين — باستخدام بيانات دخول واحدة عبر تطبيق الحسابات.",
        },
        {
          title: "دقة البيانات",
          text: "تلتزم بتقديم معلومات صحيحة ومحدّثة عند التسجيل أو إكمال الملف الشخصي، وتحديثها عند تغيّرها.",
        },
        {
          title: "أمان الحساب",
          text: "أنت مسؤول عن حماية بيانات الدخول الخاصة بك، بما في ذلك كلمة المرور وعوامل التحقق الإضافية. يجب إبلاغنا فورًا عند الاشتباه في وصول غير مصرّح به.",
        },
        {
          title: "مسؤولية النشاط",
          text: "أنت مسؤول عن أي نشاط يتم عبر حسابك في أي من تطبيقات ركني، ما لم تثبت أن الوصول تم دون تفويض منك وبسبب خلل في أنظمتنا.",
        },
      ],
    },
    {
      id: "forms",
      title: "تطبيق النماذج (Forms)",
      icon: ClipboardList,
      paragraphs: [
        "عند استخدامك لتطبيق النماذج كمنشئ أو مدير، فأنت مسؤول عن المحتوى الذي تنشره والبيانات التي تجمعها عبر نماذجك.",
      ],
      subsections: [
        {
          title: "مسؤولية منشئ النموذج",
          text: "أنت مسؤول عن قانونية النموذج وحق جمع البيانات من المشاركين، وعن الحصول على الموافقات اللازمة عند جمع بيانات شخصية أو حساسة.",
        },
        {
          title: "المشاركون والإجابات",
          text: "قد يملأ المشاركون النماذج دون حساب ركني. يجب أن تُعلِم المشاركين بكيفية استخدام بياناتهم عبر سياسة خصوصية خاصة بك عند الحاجة، مع الالتزام بسياسة الخصوصية العامة لركني.",
        },
        {
          title: "المحتوى والمشاركة",
          text: "يُحظر نشر نماذج تحتوي على محتوى احتيالي أو ضار أو ينتهك حقوق الآخرين. نحتفظ بالحق في تعطيل النماذج أو الحسابات التي تُسيء استخدام الخدمة.",
        },
        {
          title: "الفرق والصلاحيات",
          text: "عند دعوة أعضاء فريق، فأنت مسؤول عن منحهم صلاحيات مناسبة فقط. نشجّع مراجعة صلاحيات الفريق بانتظام.",
        },
      ],
    },
    {
      id: "developer",
      title: "بوابة المطورين (Developer)",
      icon: Code2,
      paragraphs: [
        "بوابة المطورين مخصّصة لبناء التطبيقات والتكاملات على منصة ركني. يخضع استخدامك لها لضوابط أمنية وحدود استخدام معقولة.",
      ],
      subsections: [
        {
          title: "التطبيقات ومفاتيح API",
          text: "أنت مسؤول عن سرية مفاتيح API والرموز السرية وأي بيانات اعتماد مرتبطة بتطبيقاتك. لا تشاركها علنًا ولا تضمّنها في مستودعات عامة.",
        },
        {
          title: "OAuth والتكاملات",
          text: "عند بناء تطبيق يستخدم تسجيل الدخول عبر ركني، يجب الالتزام بسياسات المنصة وطلب الأذونات الضرورية فقط وشرح استخدام البيانات للمستخدم النهائي.",
        },
        {
          title: "الاستخدام العادل",
          text: "يُحظر إساءة استخدام واجهات المطورين أو تجاوز حدود الخطة أو محاولة التحايل على قيود الاستخدام أو الأمان.",
        },
        {
          title: "مسؤولية التطبيقات المنشورة",
          text: "أنت مسؤول عن سلوك تطبيقاتك وتكاملاتك أمام المستخدمين النهائيين، بما في ذلك الامتثال للقوانين المعمول بها وحماية بياناتهم.",
        },
      ],
    },
    {
      id: "usage",
      title: "الاستخدام المقبول",
      icon: Blocks,
      paragraphs: [
        "يجب استخدام منصة ركني ومكوناتها للأغراض المشروعة فقط وبما يتوافق مع القوانين المعمول بها ومع سياسات كل تطبيق تستخدمه داخل المنصة.",
      ],
      bullets: [
        "يُحظر إساءة استخدام واجهات البرمجة (APIs) أو تجاوز حدود الاستخدام أو محاولة اختراق الأنظمة.",
        "يُحظر استخدام الخدمة لإرسال رسائل مزعجة أو محتوى ضار أو انتهاك خصوصية أو حقوق الآخرين.",
        "يُحظر انتحال هوية شخص آخر أو إنشاء حسابات وهمية بقصد الإضرار أو التحايل.",
        "يُحظر إعادة بيع أو إعادة توزيع الخدمة أو الوصول إليها خارج الإطار المصرّح به.",
      ],
    },
    {
      id: "availability",
      title: "توفر الخدمة والتحديثات",
      icon: Globe,
      paragraphs: [
        "نسعى لتوفير خدمة مستقرة وآمنة، لكن لا نضمن تشغيلًا دون انقطاع في جميع الأوقات.",
        "قد نقوم بإجراء صيانة دورية أو تحديثات أو إضافة ميزات أو تعليق مؤقت لبعض المكونات لتحسين الأمان والأداء. سنبذل جهدًا معقولًا لإشعارك بالتغييرات الجوهرية عند الإمكان.",
      ],
    },
    {
      id: "ip",
      title: "الملكية الفكرية",
      icon: ShieldCheck,
      paragraphs: [
        "جميع حقوق المنصة، بما في ذلك البرمجيات والتصاميم والشعارات والمحتوى المملوك لركني، محفوظة للمنصة أو لمرخّصيها.",
        "لا يمنحك استخدام الخدمة أي حق ملكية في مواد المنصة. يُسمح لك باستخدامها فقط ضمن نطاق هذه الشروط.",
        "أنت تحتفظ بحقوق المحتوى الذي تنشئه (مثل نماذجك وإجاباتك وتطبيقاتك)، مع منحنا الترخيص التشغيلي اللازم لاستضافة هذا المحتوى وتقديم الخدمة.",
      ],
    },
    {
      id: "suspension",
      title: "تعليق وإنهاء الوصول",
      icon: Ban,
      paragraphs: [
        "نحتفظ بالحق في تعليق أو إنهاء حسابك أو تقييد وصولك إلى الخدمة عند الاشتباه في انتهاك هذه الشروط أو إساءة الاستخدام أو لأسباب أمنية أو قانونية.",
        "يمكنك طلب إغلاق حسابك وفق الإجراءات المتاحة في إعدادات الحساب، مع مراعاة الالتزامات القانونية والتشغيلية المتعلقة بالاحتفاظ بالبيانات.",
      ],
    },
    {
      id: "liability",
      title: "إخلاء المسؤولية وحدودها",
      icon: Scale,
      paragraphs: [
        "تُقدَّم الخدمة «كما هي» ضمن الحدود التي يسمح بها القانون. لا نضمن خلو الخدمة من الأخطاء أو أنها ستلبي جميع احتياجاتك دون انقطاع.",
        "في أقصى حد يسمح به القانون المعمول به، لا تتحمل ركني مسؤولية عن الأضرار غير المباشرة أو التبعية الناتجة عن استخدامك للخدمة أو عدم القدرة على استخدامها.",
      ],
    },
    {
      id: "updates",
      title: "تعديل الشروط",
      icon: RefreshCw,
      paragraphs: [
        "قد نحدّث هذه الشروط من وقت لآخر لتعكس تطور المنصة أو المتطلبات القانونية. عند إجراء تغييرات جوهرية، سنبذل جهدًا معقولًا لإشعارك عبر المنصة أو البريد الإلكتروني.",
        "يُعد استمرارك في استخدام الخدمة بعد نفاذ التعديلات موافقة على الشروط المحدّثة.",
      ],
    },
    {
      id: "contact",
      title: "التواصل والدعم",
      icon: Mail,
      paragraphs: [
        "لأي استفسار حول هذه الشروط أو حسابك، يمكنك التواصل مع فريق الدعم عبر قنوات المساعدة المتاحة داخل حسابك في ركني أو عبر البريد الرسمي للدعم.",
      ],
      tocIgnore: true,
    },
  ],
}

export const termsContentEn: LegalDocumentContent = {
  title: "Terms of Use",
  description:
    "This document explains the rules governing your use of the full Rukny platform (Rukny.io): Accounts, Forms, the Developer portal, and any products or services linked to your unified account.",
  lastUpdated: "July 2026",
  sections: [
    {
      id: "intro",
      title: "Introduction",
      icon: FileText,
      paragraphs: [
        "These terms govern your relationship with the Rukny platform (Rukny.io) when you create an account, sign in, or use any of its applications and components, including Forms and the Developer portal.",
        "By using the platform, you confirm that you have read and understood these terms and the Privacy Policy. If you do not agree, please discontinue use of the service.",
      ],
    },
    {
      id: "acceptance",
      title: "Acceptance and Scope",
      icon: Scale,
      paragraphs: [
        "By creating an account, signing in, or continuing to use Rukny, you agree to these terms, the Privacy Policy, and any additional policies tied to the services you use.",
        "These terms apply to all access methods, including email login, magic links, and OAuth providers (such as Google, GitHub, LinkedIn, and Facebook), and to all applications you access through your unified account.",
      ],
    },
    {
      id: "platform",
      title: "Platform Scope and Products",
      icon: Layers,
      paragraphs: [
        "The Rukny platform includes interconnected products under a unified identity and account. Some features may have additional terms or usage limits within each application.",
      ],
      subsections: [
        {
          title: "Accounts",
          text: "Unified identity, account management, security, and shared billing where available.",
        },
        {
          title: "Forms",
          text: "Form builder, response collection, analytics, team management, and public form sharing.",
        },
        {
          title: "Developer",
          text: "Portal for building apps, managing API keys, OAuth, integrations, and products built on Rukny.",
        },
      ],
    },
    {
      id: "account",
      title: "Account and Sign-in",
      icon: Key,
      subsections: [
        {
          title: "Unified identity",
          text: "A Rukny account provides secure, unified access to platform products — including Forms and the Developer portal — using a single set of credentials via the accounts application.",
        },
        {
          title: "Accurate information",
          text: "You agree to provide accurate, up-to-date information when registering or completing your profile, and to update it when it changes.",
        },
        {
          title: "Account security",
          text: "You are responsible for protecting your sign-in credentials, including passwords and additional verification factors. Notify us immediately if you suspect unauthorized access.",
        },
        {
          title: "Activity responsibility",
          text: "You are responsible for activity conducted through your account across Rukny applications, unless you demonstrate access occurred without your authorization due to a failure in our systems.",
        },
      ],
    },
    {
      id: "forms",
      title: "Forms Application",
      icon: ClipboardList,
      paragraphs: [
        "When you use Forms as a creator or administrator, you are responsible for the content you publish and the data you collect through your forms.",
      ],
      subsections: [
        {
          title: "Form creator responsibility",
          text: "You are responsible for the legality of your forms and your right to collect participant data, including obtaining required consents when collecting personal or sensitive data.",
        },
        {
          title: "Participants and responses",
          text: "Participants may complete forms without a Rukny account. You must inform participants how their data will be used through your own privacy notice when required, while complying with Rukny's general Privacy Policy.",
        },
        {
          title: "Content and sharing",
          text: "Publishing forms with fraudulent, harmful, or rights-infringing content is prohibited. We may disable forms or accounts that abuse the service.",
        },
        {
          title: "Teams and permissions",
          text: "When inviting team members, you are responsible for granting appropriate permissions only. We encourage regular review of team access.",
        },
      ],
    },
    {
      id: "developer",
      title: "Developer Portal",
      icon: Code2,
      paragraphs: [
        "The Developer portal is for building applications and integrations on Rukny. Your use is subject to security controls and reasonable usage limits.",
      ],
      subsections: [
        {
          title: "Apps and API keys",
          text: "You are responsible for keeping API keys, secrets, and credentials confidential. Do not share them publicly or commit them to public repositories.",
        },
        {
          title: "OAuth and integrations",
          text: "When building an app that uses Rukny sign-in, you must follow platform policies, request only necessary permissions, and explain data use to end users.",
        },
        {
          title: "Fair use",
          text: "Abuse of developer APIs, exceeding plan limits, or attempting to circumvent usage or security restrictions is prohibited.",
        },
        {
          title: "Published app responsibility",
          text: "You are responsible for your apps' and integrations' behavior toward end users, including legal compliance and protecting their data.",
        },
      ],
    },
    {
      id: "usage",
      title: "Acceptable Use",
      icon: Blocks,
      paragraphs: [
        "You must use Rukny and its components only for lawful purposes and in compliance with applicable laws and each application's policies.",
      ],
      bullets: [
        "Abuse of APIs, exceeding usage limits, or attempting to compromise systems is prohibited.",
        "Using the service to send spam, harmful content, or to violate others' privacy or rights is prohibited.",
        "Impersonation or creating fake accounts to harm or circumvent the platform is prohibited.",
        "Reselling or redistributing the service or access outside the permitted scope is prohibited.",
      ],
    },
    {
      id: "availability",
      title: "Availability and Updates",
      icon: Globe,
      paragraphs: [
        "We strive to provide a stable, secure service but do not guarantee uninterrupted operation at all times.",
        "We may perform maintenance, release updates, add features, or temporarily suspend components to improve security and performance. We will make reasonable efforts to notify you of material changes when possible.",
      ],
    },
    {
      id: "ip",
      title: "Intellectual Property",
      icon: ShieldCheck,
      paragraphs: [
        "All platform rights, including software, designs, logos, and Rukny-owned content, remain with the platform or its licensors.",
        "Use of the service does not grant you ownership of platform materials. You may use them only within the scope of these terms.",
        "You retain rights to content you create (such as your forms, responses, and apps), while granting us the operational license needed to host that content and provide the service.",
      ],
    },
    {
      id: "suspension",
      title: "Suspension and Termination",
      icon: Ban,
      paragraphs: [
        "We may suspend or terminate your account or restrict access if we suspect a breach of these terms, abuse, or for security or legal reasons.",
        "You may request account closure through available account settings, subject to legal and operational data retention obligations.",
      ],
    },
    {
      id: "liability",
      title: "Disclaimer and Limitation of Liability",
      icon: Scale,
      paragraphs: [
        "The service is provided \"as is\" to the extent permitted by law. We do not warrant error-free operation or that the service will meet every need without interruption.",
        "To the maximum extent permitted by applicable law, Rukny is not liable for indirect or consequential damages arising from your use of, or inability to use, the service.",
      ],
    },
    {
      id: "updates",
      title: "Changes to Terms",
      icon: RefreshCw,
      paragraphs: [
        "We may update these terms from time to time to reflect platform evolution or legal requirements. For material changes, we will make reasonable efforts to notify you via the platform or email.",
        "Continued use after changes take effect constitutes acceptance of the updated terms.",
      ],
    },
    {
      id: "contact",
      title: "Contact and Support",
      icon: Mail,
      paragraphs: [
        "For questions about these terms or your account, contact support through the help channels available in your Rukny account or via official support email.",
      ],
      tocIgnore: true,
    },
  ],
}
