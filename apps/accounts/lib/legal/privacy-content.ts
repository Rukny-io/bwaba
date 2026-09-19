/**
 * سياسة الخصوصية — ركني (Rukny.io)
 *
 * ملاحظة للمطور (لا تُعرض للمستخدم):
 * 1) التخزين: لا تكتب «لا نخزّن البريد». الواقع التشغيلي = معالجة/تخزين عبر بنية سحابية تشمل S3 (خام وارد)،
 *    Redis (جلسات/كاش)، وقواعد بيانات لازمة للويب ميل. الصياغة القانونية توضح الملكية ≠ غياب التخزين.
 * 2) مزوّد التوصيل المعلن: Amazon SES (eu-north-1 / ستوكهولم) — حدّث عند تغيّر المنطقة.
 * 3) مدة ما بعد الحذف: 30 يوماً تشغيلية للنسخة الخام في S3 وبيانات الصندوق — اربط الحذف الفعلي (DB + S3 + جلسات Redis) بهذا الالتزام في الكود.
 * 3b) سلة المحذوفات موجودة؛ الحذف النهائي بلا استرجاع مضمون للمستخدم.
 * 4) التشفير at-rest: لا تدّعِ تشفير محتوى الرسائل بمفتاح عميل إن لم يُنفَّذ؛ النص يذكر TLS + hash كلمات المرور + ضوابط وصول.
 * 5) القانون/GDPR/PDPL: المبادئ مذكورة دون ادعاء شهادة ISO/SOC2. راجع محامياً محلياً قبل وعود DPA ملزمة.
 * 6) الطلبات القانونية: إشعار المستخدم «حيث يسمح القانون» — لا تعد بإشعار دائماً.
 */
import {
  ClipboardList,
  Code2,
  Cookie,
  Database,
  Eye,
  FileText,
  Globe,
  Key,
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
    "توضّح هذه السياسة ما البيانات التي تعالجها ركني (Rukny.io)، ولأي غرض، ومع من تُشارك، وكيف تُحفظ وتُحذف، وما هي حقوقك. تسري على الحسابات الموحّدة والنماذج وركني ميل وبوابة المطورين عند إحالة تلك المنتجات إلى هذه الصفحة.",
  lastUpdated: "سبتمبر 2026",
  sections: [
    {
      id: "intro",
      title: "نطاق السياسة وتعريفات أساسية",
      icon: ShieldCheck,
      paragraphs: [
        "ركني منصة برمجيات كخدمة (SaaS) توفّر هوية موحّدة ومنتجات تشمل النماذج وركني ميل وبوابة المطورين. عندما تستخدم منتجاً يشير إلى هذه السياسة، فإن معالجة البيانات الشخصية المرتبطة بذلك الاستخدام تخضع لها.",
        "«محتوى العميل» يعني ما تضعه أنت أو مستخدمو مساحتك داخل الخدمة (مثل نص الرسائل والمرفقات وإجابات النماذج). أنت تتحكّم في مضمون ذلك المحتوى ضمن صلاحيات مساحتك؛ ركني تعالجه لتشغيل البنية التقنية وتقديم الخدمة، ولا تبيعه ولا تستخدمه لأغراض تسويق موجّه بناءً على قراءة محتوى الرسائل.",
        "إن لم توافق على هذه السياسة، يجب عدم استخدام ركني. للاستفسارات: support@rukny.io.",
      ],
    },
    {
      id: "collection",
      title: "البيانات التي نجمعها",
      icon: Database,
      paragraphs: [
        "نفرّق بين فئات البيانات التالية لأغراض الشفافية:",
      ],
      subsections: [
        {
          title: "بيانات الحساب",
          text: "مثل الاسم أو الاسم المعروض، عنوان البريد الإلكتروني للحساب، رقم الهاتف إن أضفته، صورة الملف، بيانات تسجيل الدخول عبر مزوّد خارجي (بالقدر الذي يشاركه المزود)، ومعلومات الفوترة والاشتراك المرتبطة بالخطة عند الاشتراك في خدمة مدفوعة.",
        },
        {
          title: "البيانات التشغيلية",
          text: "مثل سجلات الدخول التقريبية، نوع المتصفح والجهاز، عناوين IP لأغراض الأمان ومنع الإساءة، سجلات إعداد وتحقق DNS للنطاقات المرتبطة بميل، سجلات التسليم (Delivery Logs) في حدود ما تعرضه لوحة التحكم (عناوين، موضوع، حالة، معرّفات مزوّد التوصيل، أخطاء)، ومعرّفات الجلسات والاستخدام على مستوى المنتج.",
        },
        {
          title: "محتوى الرسائل في ركني ميل",
          text: "يشمل حقول المراسلة اللازمة لتشغيل الصندوق والويب ميل (مثل العناوين، الموضوع، نص الرسالة، وحالة القراءة والمجلدات)، وقد يشمل نسخة واردة كاملة محفوظة كملف في تخزين سحابي (Amazon S3). لا نستخدم هذا المحتوى لبيع بيانات أو لاستهداف إعلاني.",
        },
        {
          title: "بيانات النماذج وبوابة المطورين",
          text: "عناوين النماذج والحقول والإجابات التي يجمعها منشئ النموذج؛ ومعلومات التطبيقات والمفاتيح وسجلات طلبات API بالقدر اللازم للتشغيل والأمان والفوترة.",
        },
      ],
    },
    {
      id: "mail-data",
      title: "ركني ميل — معالجة البريد والبنية",
      icon: Mails,
      paragraphs: [
        "ركني ميل خدمة بريد على نطاق مخصص: مساحات عمل، صناديق، إعدادات توجيه، فرق، ويب ميل، وربط توصيل عبر مزوّدي بنية سحابية. ملكية محتوى البريد تبقى لك (أو لمنشأتك)؛ ركني تحصل على ترخيص تشغيلي محدود لتشغيل الخدمة فقط كما في شروط الاستخدام.",
        "لا نخزّن بريدك على أجهزة شخصية للمستخدم؛ المعالجة والتخزين التشغيلي يتمان ضمن بنية سحابية نديرها لتشغيل المنتج، وتشمل على وجه الخصوص:",
      ],
      bullets: [
        "تخزين ملفات سحابي عبر Amazon S3: نحفظ فيه أحياناً نسخة كاملة من الرسالة الواردة كما وصلت، حتى نستطيع استلامها ومعالجتها.",
        "Redis: لجلسات الدخول والتخزين المؤقت أثناء تشغيل الخدمة (وليس لصندوق بريدك كأرشيف دائم).",
        "قواعد بيانات وتشغيل لازمة لعرض الرسائل وإدارة الصناديق والويب ميل ضمن حدود الخطة.",
        "Amazon SES لتوصيل الإرسال والاستقبال (منطقة ستوكهولم / أوروبا ما لم نُعلن خلاف ذلك).",
      ],
      subsections: [
        {
          title: "مساحة العمل والنطاق والصناديق",
          text: "نعالج اسم المساحة، النطاق وحالة التحقق، إعدادات DNS التي تعتمد عليها للتشغيل، عناوين الصناديق، الأسماء الظاهرة، الأسماء المستعارة والتحويل والردود التلقائية، وصلاحيات أعضاء الفريق. كلمات مرور الصناديق تُحفظ بشكل مجزوء (hash) غير قابل للاسترجاع كنص واضح.",
        },
        {
          title: "الاحتفاظ بنسخة الرسالة في S3 بعد الحذف",
          text: "عند حذف رسالة نهائياً من الصندوق أو عند إلغاء الحساب/إغلاق المساحة، نهدف إلى حذف أو قطع الوصول إلى النسخة الكاملة المحفوظة كملف في Amazon S3 وإلى بيانات الصندوق التشغيلية خلال مدة لا تتجاوز عادةً ثلاثين (30) يوماً من تاريخ الحذف النهائي أو إغلاق الحساب، ما لم يُلزم القانون أو نزاع أو متطلب أمني بالاحتفاظ لفترة أطول. قد تبقى نسخ ضمن أنظمة النسخ الاحتياطي لدى مزوّد السحابة ثم تُمحى وفق دورة النسخ الاحتياطي لديهم.",
        },
        {
          title: "هل الحذف فوري وآمن عند الطلب؟",
          text: "الحذف من واجهة المنتج يزيل الرسالة من الصندوق التشغيلي بعد الحذف النهائي. لا نعد بـ«محو فوري لكل نسخة في كل مكان» في اللحظة ذاتها؛ الحذف الآمن عملياً يتم عبر إزالة الوصول التشغيلي ثم إكمال إزالة النسخ المرتبطة (بما فيها ملفات S3 ذات الصلة وجلسات Redis عند الاقتضاء) ضمن نافذة الثلاثين يوماً المذكورة، مع مراعاة ما يبقى مؤقتاً في النسخ الاحتياطية السحابية. لطلبات حذف حقوق الخصوصية خارج أدوات المنتج، راسل support@rukny.io.",
        },
        {
          title: "سلة المحذوفات والاسترجاع",
          text: "نعم: يمكنك نقل الرسائل إلى سلة المحذوفات واسترجاعها منها طالما بقيت في السلة. بعد الحذف النهائي من الصندوق لا نوفّر استرجاعاً مضموناً للمستخدم من واجهة ركني. النسخ الاحتياطية لدى مزوّدي البنية ليست خدمة استرجاع للعميل، ولا تُستخدم كبديل لسلة المحذوفات.",
        },
        {
          title: "مزوّدو التوصيل والأطراف الثالثة (سلسلة التوريد)",
          text: "مزوّد التوصيل الأساسي لركني ميل هو Amazon SES في منطقة ستوكهولم (eu-north-1) ما لم نُعلن خلاف ذلك. نستخدم أيضاً Amazon S3 لحفظ ملف النسخة الكاملة للرسالة الواردة عند الحاجة، وRedis لجلسات الدخول والكاش المؤقت، ضمن خدمات أمازون السحابية المرتبطة بتشغيل المنصة. لا نستخدم SendGrid كمسار توصيل أساسي لركني ميل في هذه السياسة. هؤلاء المزوّدون يعالجون البيانات بالقدر اللازم للتوصيل والتخزين والتشغيل بموجب ترتيباتهم التعاقدية؛ ولا نشارك معهم محتوى بريدك بغرض بيعه أو تسويقه.",
        },
        {
          title: "مكان الاستضافة والامتثال",
          text: "مسار توصيل ميل والتخزين التشغيلي المرتبط يعمل عادةً عبر بنية أمازون في أوروبا (ستوكهولم). قد تُعالَج أجزاء من الحساب أو المنصة عبر مزوّدين آخرين لتشغيل ركني. إذا كنت تخضع لنظام حماية البيانات الشخصية في العراق أو للائحة العامة لحماية البيانات (GDPR) أو أنظمة مشابهة، فأنت المسؤول عن تقييم ملاءمة هذا التوزيع لالتزاماتك؛ ركني توضّح موقع المعالجة أعلاه ويمكنك مراسلة support@rukny.io لأسئلة مؤسسية. هذه السياسة لا تشكّل شهادة امتثال مستقلة ولا تغني عن استشارة قانونية لمؤسستك.",
        },
        {
          title: "سجلات التسليم",
          text: "تُعرض لأغراض التشخيص والتشغيل (حالة التسليم والأخطاء والمعرّفات التشغيلية)، وليست بديلاً عن فتح محتوى الرسالة في الصندوق.",
        },
        {
          title: "التمييز عن واجهة إرسال المطورين",
          text: "إرسال البريد عبر بوابة المطورين (Email API) يخضع لنموذج احتفاظ مختلف يركّز على بيانات تشغيلية عن الإرسال؛ وهو ليس صندوق بريد كامل كركني ميل.",
        },
      ],
    },
    {
      id: "forms-data",
      title: "النماذج",
      icon: ClipboardList,
      paragraphs: [
        "إذا أنشأت نموذجاً أو أدرت فريقاً، نعالج بيانات النموذج نيابةً عنك كجزء من تشغيل الخدمة. إجابات المشاركين في نموذج عام تُوجَّه إلى منشئ النموذج وهو المسؤول الأول عنها تجاه المشاركين، مع التزامك بالقوانين المعمول بها.",
      ],
    },
    {
      id: "developer-data",
      title: "بوابة المطورين",
      icon: Code2,
      paragraphs: [
        "نعالج بيانات التطبيق وبيانات الاعتماد (مع إخفاء المفاتيح بعد الإنشاء) وسجلات الاستخدام والأخطاء وإشارات الأمان بالقدر اللازم للتشغيل ومنع الإساءة والفوترة.",
      ],
    },
    {
      id: "usage",
      title: "كيف نستخدم البيانات",
      icon: Eye,
      paragraphs: [
        "نستخدم البيانات للأغراض التالية فقط بقدر الحاجة:",
      ],
      bullets: [
        "تشغيل الحساب والجلسات والمنتجات التي طلبتها، بما في ذلك ركني ميل والنماذج وواجهات المطورين.",
        "الدعم الفني وتشخيص الأعطال وتحسين الاستقرار.",
        "الفوترة وإدارة الاشتراكات والمقاعد والحدود.",
        "الأمان: كشف الإساءة والاحتيال ومحاولات الدخول غير المصرّح بها وحماية البنية.",
        "الامتثال للالتزامات النظامية والرد على الطلبات القانونية الملزمة.",
      ],
      subsections: [
        {
          title: "ما لا نفعله",
          text: "لا نبيع بياناتك الشخصية، ولا نقرأ محتوى رسائل ركني ميل لأغراض تسويق أو بيع إعلانات مبنية على مضمون المراسلات.",
        },
      ],
    },
    {
      id: "sharing",
      title: "مشاركة البيانات مع أطراف ثالثة",
      icon: Share2,
      paragraphs: [
        "لا نبيع المعلومات الشخصية. نشارك البيانات فقط في الحالات التالية وبأقل قدر لازم:",
      ],
      bullets: [
        "Amazon SES: توصيل إرسال واستقبال ركني ميل (ستوكهولم / eu-north-1 ما لم يُعلن خلاف ذلك).",
        "Amazon S3: حفظ ملف النسخة الكاملة للرسالة الواردة عند الحاجة لمعالجة الاستقبال.",
        "Redis وخدمات الحوسبة السحابية المرتبطة بتشغيل الجلسات والكاش والمنصة، ضمن ترتيبات تشغيل سحابية تحدّ الغرض من المعالجة.",
        "أعضاء الفريق الذين تدعوهم إلى مساحتك وبالأدوار التي تختارها.",
        "منشئ النموذج عند إرسال إجابة على نموذج عام — وفق مسؤوليته.",
        "عند طلب قانوني ملزم أو لحماية حقوق ركني أو المستخدمين أو الأمن العام ضمن ما يسمح به القانون.",
      ],
      subsections: [
        {
          title: "الإشعار عند الطلب القانوني",
          text: "حيث يسمح القانون بذلك، نسعى لإشعارك قبل الإفصاح عن بيانات مرتبطة بحسابك أو بعده بوقت معقول. قد يُحظر الإشعار بأمر الجهة المختصة أو بحكم النظام؛ وعندها نلتزم بالحظر.",
        },
      ],
    },
    {
      id: "retention",
      title: "الاحتفاظ بالبيانات وحذفها",
      icon: Database,
      paragraphs: [
        "نحتفظ بالبيانات طالما لزم تقديم الخدمة أو الوفاء بالالتزامات النظامية أو الأمنية أو المحاسبية.",
        "في ركني ميل: تبقى الرسائل في الصندوق حتى تحذفها أو تُغلق المساحة. سلة المحذوفات تتيح الاسترجاع طالما بقيت الرسالة فيها. الحذف النهائي يزيل الرسالة من الصندوق التشغيلي.",
        "النسخة المحفوظة كملف في Amazon S3 والبيانات التشغيلية المرتبطة: نهدف إلى حذفها أو قطع الوصول إليها خلال مدة لا تتجاوز عادةً ثلاثين (30) يوماً بعد الحذف النهائي أو إلغاء الحساب/إغلاق المساحة، ما لم يُلزم القانون أو النزاع أو الأمن بالاحتفاظ أطول، أو ما بقي ضمن نسخ احتياطية سحابية تُمحى وفق دورة المزوّد.",
        "الحذف عند الطلب عبر الدعم يخضع للتحقق من الهوية ولنفس النوافذ التشغيلية أعلاه؛ وليس بالضرورة محواً لحظياً لكل وسيط في الثانية ذاتها.",
        "إجابات النماذج وسجلات واجهات المطورين تتبع استخدامك وخطتك وأدوات الحذف في المنتج، مع إمكانية الاحتفاظ بسجلات أمان لفترة محدودة بعد إغلاق الحساب إن لزم.",
      ],
    },
    {
      id: "security",
      title: "أمان البيانات",
      icon: Lock,
      paragraphs: [
        "نتخذ تدابير تقنية وتنظيمية معقولة لحماية البيانات، منها على سبيل المثال لا الحصر:",
      ],
      bullets: [
        "تشفير الاتصال أثناء النقل (TLS) بين عملائك وخوادم الخدمة.",
        "حفظ كلمات مرور الحسابات وصناديق البريد بشكل مجزوء (hash) وليس كنص واضح.",
        "فصل صلاحيات لوحة التحكم عن جلسات صندوق البريد، وتطبيق أدوار الفريق داخل المساحة.",
        "مراقبة إشارات الأمان ومحاولات الدخول المشبوهة بقدر معقول.",
        "الاعتماد على ضوابط مزوّدي السحابة لتخزين الملفات (مثل S3) والجلسات ضمن إعدادات التشغيل المعتمدة.",
      ],
      subsections: [
        {
          title: "حدود الإفصاح",
          text: "لا يوجد نظام معلومات خالٍ من المخاطر بالكامل. هذه السياسة لا تدّعي حالياً اعتماداً معلناً مثل ISO 27001 أو SOC 2 للمنتج. لطلبات المؤسسات بشأن ترتيبات معالجة إضافية، راسل support@rukny.io.",
        },
      ],
    },
    {
      id: "rights",
      title: "حقوقك",
      icon: UserCheck,
      paragraphs: [
        "مع مراعاة القانون المعمول به (بما في ذلك مبادئ حماية البيانات الشخصية والأنظمة المحلية المشابهة لمبادئ اللائحة العامة لحماية البيانات حيث تنطبق)، يمكنك طلب الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها أو تقييد معالجتها أو نقلها بالقدر الذي يسمح به النظام وطبيعة الخدمة.",
        "يمكنك أيضاً إدارة كثير من البيانات مباشرة من الإعدادات وأدوات ركني ميل (بما في ذلك سلة المحذوفات والحذف النهائي وإدارة الصناديق وأرشفة المساحة).",
        "قد نطلب التحقق من الهوية قبل تنفيذ طلب حقوق. بعض البيانات قد تُستثنى من الحذف إن لزم الاحتفاظ بها نظاماً أو لحماية الحقوق أو الأمن. قدّم الطلبات عبر support@rukny.io.",
      ],
    },
    {
      id: "cookies",
      title: "ملفات تعريف الارتباط والتخزين المحلي",
      icon: Cookie,
      paragraphs: [
        "نستخدم ملفات تعريف الارتباط وتقنيات مشابهة والتخزين المحلي لتشغيل لوحة التحكم وويب ميل: إبقاء الجلسة، تفضيلات اللغة أو المظهر، وحماية طلبات المصادقة.",
        "تعطيل بعض هذه التقنيات من المتصفح قد يمنع تسجيل الدخول أو يعطّل أجزاء من الخدمة.",
      ],
    },
    {
      id: "oauth",
      title: "مزودو تسجيل الدخول",
      icon: Key,
      paragraphs: [
        "عند الدخول عبر مزود خارجي، نستلم فقط ما يشاركونه وفق أذوناتك. سياسات أولئك المزودين مستقلة عن سياسة ركني.",
      ],
    },
    {
      id: "international",
      title: "مكان المعالجة والنقل عبر الحدود",
      icon: Globe,
      paragraphs: [
        "تُستضاف بيانات توصيل ركني ميل والتخزين التشغيلي المرتبط بها عادةً على بنية أمازون السحابية في أوروبا — منطقة ستوكهولم (eu-north-1) — ما لم نُعلن خلاف ذلك. قد تُعالَج بيانات الحساب أو منتجات أخرى عبر مزوّدين إضافيين لتشغيل المنصة.",
        "هذا الإفصاح مهم لتقييم الامتثال لأنظمة مثل نظام حماية البيانات الشخصية في العراق واللائحة العامة لحماية البيانات (GDPR) في أوروبا. ركني تبيّن موقع المعالجة؛ تقييم الملاءمة القانونية لمؤسستك يبقى على عاتقك أو مستشارك القانوني. للاستفسارات المؤسسية: support@rukny.io.",
      ],
    },
    {
      id: "children",
      title: "الأطفال",
      icon: FileText,
      paragraphs: [
        "ركني غير موجّهة لمن هم دون سن إنشاء حساب نظامي دون ولي أمر حيث يطلب النظام ذلك. عند اكتشاف حساب بهذا الوصف دون أساس نظامي مناسب، نتخذ إجراءات الحذف بعد التحقق المعقول.",
      ],
    },
    {
      id: "changes",
      title: "تحديثات السياسة",
      icon: RefreshCw,
      paragraphs: [
        "قد نحدّث هذه السياسة عند تغيّر المنتجات أو المتطلبات النظامية أو الترتيبات التشغيلية. للتغييرات الجوهرية نبذل جهداً معقولاً للإشعار عبر المنصة أو البريد المرتبط بالحساب، مع بيان تاريخ آخر تحديث في أعلى الوثيقة.",
        "استمرار الاستخدام بعد سريان التحديث يعني الاطلاع على النسخة السارية. إن لم توافق، توقف عن الاستخدام واطلب إغلاق الحساب وفق الإجراءات المتاحة.",
      ],
    },
    {
      id: "contact",
      title: "التواصل",
      icon: Mail,
      paragraphs: [
        "أسئلة الخصوصية أو طلبات الحقوق: support@rukny.io، أو عبر الدعم داخل حساب ركني.",
      ],
      tocIgnore: true,
    },
  ],
}

export const privacyContentEn: LegalDocumentContent = {
  title: "Privacy Policy",
  description:
    "This Policy explains what data Rukny (Rukny.io) processes, why, with whom it is shared, how it is retained and deleted, and your rights. It applies to unified accounts, Forms, Rukny Mail, and the Developer portal when those products point to this page.",
  lastUpdated: "September 2026",
  sections: [
    {
      id: "intro",
      title: "Scope and key concepts",
      icon: ShieldCheck,
      paragraphs: [
        "Rukny is a SaaS platform providing unified identity and products including Forms, Rukny Mail, and the Developer portal. When you use a product that references this Policy, personal-data processing for that use is covered here.",
        "“Customer Content” means what you or your workspace users put in the service (for example message bodies, attachments, and form answers). You control that content within workspace permissions; Rukny processes it to run infrastructure and deliver the service, and does not sell it or use it for marketing based on reading mail content.",
        "If you do not agree, do not use Rukny. Questions: support@rukny.io.",
      ],
    },
    {
      id: "collection",
      title: "Data we collect",
      icon: Database,
      paragraphs: [
        "For transparency we distinguish:",
      ],
      subsections: [
        {
          title: "Account data",
          text: "Display name, account email, phone if added, profile photo, third-party sign-in attributes the provider shares, and billing/subscription data for paid plans.",
        },
        {
          title: "Operational data",
          text: "Approximate sign-in logs, browser/device type, IP addresses for security and abuse prevention, DNS setup/verification records for Mail domains, delivery logs shown in console (addresses, subject, status, provider IDs, errors), and session/product usage identifiers.",
        },
        {
          title: "Mail content in Rukny Mail",
          text: "Messaging fields needed to run mailboxes and webmail (addresses, subject, body, read state, folders), and may include an inbound raw copy in cloud object storage. We do not use this content to sell data or for ad targeting.",
        },
        {
          title: "Forms and Developer data",
          text: "Form titles, fields, and responses collected by the form owner; app metadata, credentials, and API usage logs needed for operation, security, and billing.",
        },
      ],
    },
    {
      id: "mail-data",
      title: "Rukny Mail — processing and infrastructure",
      icon: Mails,
      paragraphs: [
        "Rukny Mail is custom-domain email: workspaces, mailboxes, routing, teams, webmail, and delivery via cloud infrastructure providers. You retain ownership of mail content (or your organization does); Rukny receives only a limited operational license as described in the Terms.",
        "We do not store your mail on end-user personal devices. Operational processing and storage run in cloud infrastructure we operate for the product, including in particular:",
      ],
      bullets: [
        "Object storage (Amazon S3) for inbound raw copies when needed to process receive.",
        "Redis for sessions and operational caching related to the service.",
        "Database and runtime components needed to display messages and run mailboxes/webmail within plan limits.",
        "Delivery via Amazon SES (Stockholm / Europe unless we announce otherwise) for send and receive.",
      ],
      subsections: [
        {
          title: "Workspace, domain, and mailboxes",
          text: "We process workspace name, domain and verification status, DNS settings relied on for operation, mailbox addresses, display names, aliases/forwarders/auto-replies, and team roles. Mailbox passwords are stored hashed, not as recoverable plain text.",
        },
        {
          title: "Raw copies in S3 after deletion",
          text: "After a message is permanently deleted from the mailbox, or after account cancellation / workspace closure, we aim to delete or cut off access to the related raw object in S3 and to operational mailbox data within an operational window that typically does not exceed thirty (30) days from permanent delete or account closure, unless longer retention is required by law, a dispute, or security. Residual copies may remain in cloud-provider backups and are purged on the provider’s backup cycle.",
        },
        {
          title: "Is deletion immediate and secure on request?",
          text: "Permanent delete in the product removes the message from the operational mailbox. We do not promise instantaneous erasure of every copy on every medium at that exact second. Secure deletion in practice means removing operational access, then completing removal of related copies (including relevant S3 objects and Redis sessions where applicable) within the thirty-day window above, subject to temporary backup residuals. For privacy-rights deletion outside product tools, email support@rukny.io.",
        },
        {
          title: "Trash and recovery",
          text: "Yes: you can move messages to Trash and restore them while they remain there. After permanent delete from the mailbox, we do not provide a guaranteed user restore in the Rukny UI. Provider backups are not a customer recovery service and are not a substitute for Trash.",
        },
        {
          title: "Delivery providers and third parties (supply chain)",
          text: "The primary delivery provider for Rukny Mail is Amazon Simple Email Service (Amazon SES) in the Stockholm region (eu-north-1) unless we announce otherwise. We also use Amazon S3 for inbound raw copies when needed, and Redis for sessions and operational cache, within Amazon cloud accounts/services used to run the platform. This Policy does not treat SendGrid as the primary Rukny Mail delivery path. These processors handle data only as needed for delivery, storage, and operations under their contractual arrangements; we do not share your mail content with them to sell or market it.",
        },
        {
          title: "Hosting location and compliance",
          text: "Rukny Mail delivery and related operational storage typically run on Amazon infrastructure in Europe (Stockholm). Other account or platform components may use additional providers to run Rukny. If you are subject to Iraq’s personal-data rules, the GDPR, or similar regimes, you are responsible for assessing whether this setup fits your obligations; Rukny discloses processing location above, and you may email support@rukny.io for institutional questions. This Policy is not a standalone compliance certificate and does not replace legal advice for your organization.",
        },
        {
          title: "Delivery logs",
          text: "Shown for diagnostics and operations (delivery status, errors, operational IDs) — not as a substitute for opening message content in the mailbox.",
        },
        {
          title: "Distinction from Developer sending APIs",
          text: "Developer Email API sending follows a different retention model focused on operational send metadata — not a full mailbox like Rukny Mail.",
        },
      ],
    },
    {
      id: "forms-data",
      title: "Forms",
      icon: ClipboardList,
      paragraphs: [
        "If you create a form or manage a team, we process form data to run the service for you. Public-form answers go to the form owner, who is primarily responsible toward participants, subject to applicable law.",
      ],
    },
    {
      id: "developer-data",
      title: "Developer portal",
      icon: Code2,
      paragraphs: [
        "We process app details, credentials (keys not shown in full after creation), usage/error logs, and security signals as needed for operation, abuse prevention, and billing.",
      ],
    },
    {
      id: "usage",
      title: "How we use data",
      icon: Eye,
      paragraphs: [
        "We use data only as needed to:",
      ],
      bullets: [
        "Operate the account, sessions, and products you requested, including Rukny Mail, Forms, and Developer interfaces.",
        "Provide support, diagnose issues, and improve reliability.",
        "Bill and manage subscriptions, seats, and limits.",
        "Secure the service: abuse/fraud detection, unauthorized access, and infrastructure protection.",
        "Meet legal duties and respond to binding legal requests.",
      ],
      subsections: [
        {
          title: "What we do not do",
          text: "We do not sell your personal data, and we do not read Rukny Mail message content for marketing or ads based on message substance.",
        },
      ],
    },
    {
      id: "sharing",
      title: "Sharing with third parties",
      icon: Share2,
      paragraphs: [
        "We do not sell personal information. We share data only in these cases, and only as needed:",
      ],
      bullets: [
        "Amazon SES: Rukny Mail send/receive delivery (Stockholm / eu-north-1 unless announced otherwise).",
        "Amazon S3: inbound raw copies when needed to process receive.",
        "Redis and related cloud compute used for sessions, cache, and platform operations, under cloud arrangements that limit processing purpose.",
        "Teammates you invite to a workspace under the roles you assign.",
        "A form owner when you submit a public form — under their responsibility.",
        "When required by binding law, or to protect Rukny, users, or security as permitted by law.",
      ],
      subsections: [
        {
          title: "Notice on legal requests",
          text: "Where the law allows, we try to notify you before disclosing account-related data or within a reasonable time after. Notice may be legally prohibited; then we comply with that prohibition.",
        },
      ],
    },
    {
      id: "retention",
      title: "Retention and deletion",
      icon: Database,
      paragraphs: [
        "We retain data as long as needed to provide the service or meet legal, security, or accounting duties.",
        "In Rukny Mail: messages stay in the mailbox until you delete them or the workspace is closed. Trash allows recovery while items remain there. Permanent delete removes the message from the operational mailbox.",
        "Raw S3 copies and related operational data: we aim to delete them or cut off access within a window that typically does not exceed thirty (30) days after permanent delete or account/workspace closure, unless longer retention is required by law, a dispute, or security, or residual cloud backups remain until purged on the provider’s cycle.",
        "Deletion on request via support is subject to identity verification and the same operational windows above; it is not necessarily instantaneous erasure on every medium at that second.",
        "Form answers and Developer API logs follow your use, plan, and in-product deletion tools, with possible limited security-log retention after account closure when needed.",
      ],
    },
    {
      id: "security",
      title: "Security measures",
      icon: Lock,
      paragraphs: [
        "We apply reasonable technical and organizational measures, including without limitation:",
      ],
      bullets: [
        "TLS encryption in transit between clients and our service endpoints.",
        "Hashed storage of account and mailbox passwords (not plain text).",
        "Separated console access from mailbox sessions, with workspace role controls.",
        "Reasonable monitoring of security signals and suspicious sign-ins.",
        "Reliance on cloud-provider controls for object storage and sessions under our operating configuration.",
      ],
      subsections: [
        {
          title: "Limits of disclosure",
          text: "No information system is risk-free. This Policy does not currently claim published ISO 27001 or SOC 2 certification for the product. For enterprise processing discussions, email support@rukny.io.",
        },
      ],
    },
    {
      id: "rights",
      title: "Your rights",
      icon: UserCheck,
      paragraphs: [
        "Subject to applicable law (including personal-data principles and local regimes similar to GDPR principles where they apply), you may request access, correction, deletion, restriction, or portability of your personal data to the extent the law and the nature of the service allow.",
        "You can also manage much data directly in settings and Rukny Mail tools (including Trash, permanent delete, mailbox management, and workspace archive).",
        "We may verify identity before fulfilling rights requests. Some data may be retained when required by law or to protect rights or security. Submit requests to support@rukny.io.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and local storage",
      icon: Cookie,
      paragraphs: [
        "We use cookies and similar technologies and local storage to run the console and webmail: sessions, language/theme preferences, and protecting authentication requests.",
        "Blocking some of these in the browser may break sign-in or parts of the product.",
      ],
    },
    {
      id: "oauth",
      title: "Sign-in providers",
      icon: Key,
      paragraphs: [
        "When you sign in with an external provider, we receive only what they share based on your permissions. Their policies are separate from Rukny’s.",
      ],
    },
    {
      id: "international",
      title: "Location and cross-border transfers",
      icon: Globe,
      paragraphs: [
        "Data may be processed or stored outside your country of residence through infrastructure providers. For Rukny Mail, delivery and related operational storage typically run on Amazon infrastructure in Europe — Stockholm (eu-north-1) — unless we announce otherwise. Account data or other products may also use additional providers to run the platform.",
        "This disclosure matters for assessing compliance with regimes such as Iraq’s personal-data rules and the GDPR in Europe. Rukny states where processing occurs; whether that fits your organization’s legal duties remains your (or your counsel’s) assessment. Institutional questions: support@rukny.io.",
      ],
    },
    {
      id: "children",
      title: "Children",
      icon: FileText,
      paragraphs: [
        "Rukny is not directed to children below the age required to create an account without a guardian where the law requires it. If we learn of such an account without a proper legal basis, we will take deletion steps after reasonable verification.",
      ],
    },
    {
      id: "changes",
      title: "Policy updates",
      icon: RefreshCw,
      paragraphs: [
        "We may update this Policy when products, legal requirements, or operations change. For material changes we will use reasonable efforts to notify you in-product or via the account email, and we show the last-updated date on the document.",
        "Continued use after an update takes effect means you have reviewed the current version. If you disagree, stop using the service and close the account under available procedures.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      icon: Mail,
      paragraphs: [
        "Privacy questions or rights requests: support@rukny.io, or support inside your Rukny account.",
      ],
      tocIgnore: true,
    },
  ],
}
