"use client";

import Link from "next/link";
import { ArrowRight, FileText, Scale, ShieldCheck, Ban, RefreshCw, Mail, Blocks, Key, Globe } from "lucide-react";
import { DynamicIslandTOC } from "@/components/ui/dynamic-island-toc";
import { motion } from "motion/react";
import { useLocale } from "next-intl";

const sectionsAr = [
  {
    id: "intro",
    title: "مقدمة",
    icon: FileText,
    paragraphs: [
      "تنظّم هذه الشروط استخدامك لمنصة ركني (Rukny.io) بجميع مشاريعها وتطبيقاتها، بما في ذلك نظام تسجيل الدخول الموحد والمكونات المرتبطة به.",
      "نوصي بقراءتها بعناية قبل متابعة الاستخدام، لأنها توضّح حقوقك والتزاماتك بشكل واضح تجاه جميع خدمات المنصة.",
    ],
  },
  {
    id: "acceptance",
    title: "قبول الشروط ونطاق التطبيق",
    icon: Scale,
    paragraphs: [
      "بإنشائك حسابًا، أو تسجيل دخولك، أو استخدامك لأي من تطبيقات ومكونات ركني، فأنت توافق توافقاً تاماً على هذه الشروط وعلى جميع السياسات المشار إليها.",
      "تطبق هذه الشروط على جميع طرق الوصول إلى المنصة، سواء عبر تسجيل الدخول المباشر أو عبر مزودي الخدمات الخارجية.",
    ],
  },
  {
    id: "account",
    title: "الحساب وتسجيل الدخول",
    icon: Key,
    subsections: [
      {
        title: "هوية موحدة",
        text: "يوفر لك حساب ركني وصولاً موحداً وآمناً لجميع مشاريع وتطبيقات المنصة باستخدام بيانات دخول واحدة.",
      },
      {
        title: "الأمان وحماية الحساب",
        text: "تلتزم باستخدام كلمة مرور قوية وتفعيل وسائل التحقق الإضافية المتاحة لضمان أقصى درجات الحماية لحسابك والبيانات المرتبطة به في كافة التطبيقات.",
      },
      {
        title: "مسؤولية النشاط",
        text: "أنت المسؤول الوحيد عن الحفاظ على سرية بياناتك، وعن أي نشاط يتم عبر حسابك في أي من مشاريع ركني. يجب إبلاغنا فوراً عند رصد أي دخول غير مصرح به.",
      },
    ],
  },
  {
    id: "usage",
    title: "الاستخدام ومكونات المشاريع",
    icon: Blocks,
    paragraphs: [
      "توفر ركني مجموعة من المكونات والتطبيقات المتكاملة. يجب استخدام هذه الموارد للأغراض المشروعة فقط وبما يتوافق مع أهداف كل مشروع.",
    ],
    bullets: [
      "يُمنع إساءة استخدام واجهات برمجة التطبيقات (APIs) أو تجاوز حدود الاستخدام المسموحة.",
      "يُمنع استخدام أي من مكونات أو خدمات المنصة لأغراض ضارة، أو غير قانونية، أو تنتهك خصوصية الآخرين.",
      "يجب احترام سياسات وشروط كل مشروع أو مكون إضافي تستخدمه داخل المنصة.",
    ],
  },
  {
    id: "availability",
    title: "توفر الخدمة والتحديثات",
    icon: Globe,
    paragraphs: [
      "نسعى جاهدين لضمان عمل نظام تسجيل الدخول وجميع مكونات ركني بأعلى كفاءة وعلى مدار الساعة.",
      "قد نقوم بإجراء تحديثات، أو إضافة ميزات، أو تعليق بعض المكونات لتحسين الأداء أو لأغراض الصيانة الدورية، وذلك لضمان تجربة مستخدم آمنة ومستقرة.",
    ],
  },
  {
    id: "ip",
    title: "الملكية الفكرية",
    icon: ShieldCheck,
    paragraphs: [
      "جميع الحقوق المتعلقة بمنصة ركني، من تصاميم، وبرمجيات، ومكونات، وهوية بصرية، مملوكة حصرياً للمنصة. لا يُسمح بإعادة استخدامها، أو نسخها، أو تعديلها خارج النطاق المسموح به دون إذن كتابي.",
    ],
  },
  {
    id: "suspension",
    title: "تعليق وإلغاء الوصول",
    icon: Ban,
    paragraphs: [
      "نحتفظ بالحق في تعليق أو إنهاء وصولك إلى حسابك أو أي من مشاريع ومكونات المنصة في حال رصد أي انتهاك جوهري لهذه الشروط، وذلك لحماية بيئة المنصة ومستخدميها.",
    ],
  },
  {
    id: "updates",
    title: "التعديل على الشروط",
    icon: RefreshCw,
    paragraphs: [
      "قد تخضع هذه الشروط للتحديث بناءً على تطور المشاريع والمكونات في ركني. سيتم إشعارك بالتغييرات الجوهرية، ويُعتبر استمرارك في الاستخدام موافقة صريحة على الشروط المحدثة.",
    ],
  },
  {
    id: "contact",
    title: "التواصل والدعم",
    icon: Mail,
    paragraphs: ["نحن هنا لمساعدتك. لأي استفسار يخص حسابك، أو الشروط، أو استخدام المكونات، يمكنك التواصل مع فريق الدعم الفني عبر القنوات المتاحة في منصتنا."],
    tocIgnore: true,
  },
];

const sectionsEn = [
  {
    id: "intro",
    title: "Introduction",
    icon: FileText,
    paragraphs: [
      "These terms govern your use of the Rukny platform (Rukny.io), including all its projects, applications, unified login system, and associated components.",
      "We recommend reading them carefully before continuing, as they clearly outline your rights and obligations regarding all platform services.",
    ],
  },
  {
    id: "acceptance",
    title: "Acceptance of Terms and Scope",
    icon: Scale,
    paragraphs: [
      "By creating an account, logging in, or using any of Rukny's applications and components, you fully agree to these terms and all referenced policies.",
      "These terms apply to all methods of accessing the platform, whether through direct login or external service providers.",
    ],
  },
  {
    id: "account",
    title: "Account and Login",
    icon: Key,
    subsections: [
      {
        title: "Unified Identity",
        text: "A Rukny account provides you with unified, secure access to all platform projects and applications using a single set of login credentials.",
      },
      {
        title: "Security and Account Protection",
        text: "You are committed to using a strong password and enabling available secondary verification methods to ensure maximum protection for your account and associated data across all applications.",
      },
      {
        title: "Activity Responsibility",
        text: "You are solely responsible for maintaining the confidentiality of your data and for any activity that occurs under your account across any Rukny project. You must notify us immediately upon detecting any unauthorized access.",
      },
    ],
  },
  {
    id: "usage",
    title: "Usage and Project Components",
    icon: Blocks,
    paragraphs: [
      "Rukny provides a set of integrated components and applications. These resources must be used for legitimate purposes only and in accordance with the goals of each project.",
    ],
    bullets: [
      "Abuse of APIs or exceeding permitted usage limits is prohibited.",
      "Using any of the platform's components or services for malicious, illegal purposes, or to violate others' privacy is prohibited.",
      "You must respect the policies and terms of each project or additional component you use within the platform.",
    ],
  },
  {
    id: "availability",
    title: "Service Availability and Updates",
    icon: Globe,
    paragraphs: [
      "We strive to ensure the login system and all Rukny components operate at peak efficiency around the clock.",
      "We may perform updates, add features, or suspend some components to improve performance or for routine maintenance purposes, ensuring a secure and stable user experience.",
    ],
  },
  {
    id: "ip",
    title: "Intellectual Property",
    icon: ShieldCheck,
    paragraphs: [
      "All rights related to the Rukny platform, including designs, software, components, and visual identity, are exclusively owned by the platform. It is not permitted to reuse, copy, or modify them outside the allowed scope without written permission.",
    ],
  },
  {
    id: "suspension",
    title: "Suspension and Termination of Access",
    icon: Ban,
    paragraphs: [
      "We reserve the right to suspend or terminate your access to your account or any of the platform's projects and components if a material breach of these terms is detected, to protect the platform environment and its users.",
    ],
  },
  {
    id: "updates",
    title: "Amendments to Terms",
    icon: RefreshCw,
    paragraphs: [
      "These terms may be updated based on the evolution of projects and components in Rukny. You will be notified of material changes, and your continued use constitutes explicit acceptance of the updated terms.",
    ],
  },
  {
    id: "contact",
    title: "Contact and Support",
    icon: Mail,
    paragraphs: ["We are here to help. For any inquiries regarding your account, the terms, or the use of components, you can contact the technical support team via the available channels on our platform."],
    tocIgnore: true,
  },
];

export default function TermsPage() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const sections = isEn ? sectionsEn : sectionsAr;
  const dir = isEn ? "ltr" : "rtl";

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/20" dir={dir}>
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <DynamicIslandTOC />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-40 pt-16 sm:pt-24">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-14 flex flex-wrap items-center justify-between gap-4"
        >
          <Link
            href="/login"
            className="group flex items-center gap-2.5 rounded-full border border-border/50 bg-background/50 px-4 py-2.5 text-sm font-medium text-muted-foreground backdrop-blur-md transition-all hover:border-border hover:bg-muted/50 hover:text-foreground"
          >
            <ArrowRight className={`h-4 w-4 transition-transform ${isEn ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
            <span>{isEn ? "Back to Login" : "العودة لتسجيل الدخول"}</span>
          </Link>
          <div className="flex items-center gap-2.5 rounded-full border border-border/50 bg-background/50 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary/80"></span>
            </span>
            {isEn ? "Last updated: May 2026" : "آخر تحديث: مايو 2026"}
          </div>
        </motion.div>

        <article className={isEn ? "text-left" : "text-right"}>
          <motion.header 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="mb-16 text-center flex flex-col items-center"
          >
            <h1 className="mb-6 flex items-center justify-center gap-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              <img src="/rukny-logo.svg" alt="Rukny Logo" className="m-0 h-10 w-10 sm:h-14 sm:w-14" />
              {isEn ? "Terms of Use" : "شروط الاستخدام"}
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {isEn 
                ? "Please read these terms carefully. This document outlines the rules governing your use of all projects, applications, and components of the Rukny platform (Rukny.io)."
                : "يرجى قراءة هذه الشروط بعناية. توضح هذه الوثيقة القواعد المنظمة لاستخدامك لجميع مشاريع وتطبيقات ومكونات منصة ركني (Rukny.io)."}
            </p>
          </motion.header>

          <motion.img
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1700&q=80"
            alt={isEn ? "Terms of Use" : "شروط الاستخدام"}
            className="my-12 h-72 w-full rounded-3xl border border-border/50 object-cover shadow-sm"
          />

          <div className="space-y-12 sm:space-y-14 mt-10">
            {sections.map((section, index) => (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                key={section.id}
                id={section.id}
                className="scroll-mt-32 group"
                {...(section.tocIgnore ? { "data-toc-ignore": true } : {})}
              >
                <div className="mb-5 flex items-start gap-3 sm:gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-muted/30 shadow-sm transition-colors group-hover:bg-primary/5 group-hover:border-primary/20 sm:size-12">
                    <section.icon className="size-5 text-foreground/70 transition-colors group-hover:text-foreground" />
                  </div>
                  <div className="pt-1">
                    <span className="mb-0.5 block text-[11px] font-medium tracking-wider text-muted-foreground/60 sm:text-xs">
                      {isEn ? `Section ${String(index + 1).padStart(2, '0')}` : `القسم ${String(index + 1).padStart(2, '0')}`}
                    </span>
                    <h2 
                      id={section.id} 
                      data-toc-title={section.title}
                      className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
                    >
                      {section.title}
                    </h2>
                  </div>
                </div>

                <div className={isEn ? "pl-0 sm:pl-[3.5rem]" : "pr-0 sm:pr-[3.5rem]"}>
                  <div className="space-y-4">
                    {section.paragraphs?.map((text, i) => (
                      <p key={i} className="text-sm leading-relaxed text-muted-foreground/90 sm:text-base sm:leading-loose">
                        {text}
                      </p>
                    ))}

                    {section.subsections && section.subsections.length > 0 && (
                      <div className="mt-6 grid gap-5 sm:grid-cols-1">
                        {section.subsections.map((sub) => (
                          <div key={sub.title} className="rounded-2xl border border-border/40 bg-muted/20 p-4 transition-colors hover:bg-muted/40">
                            <h3 className="mb-2 text-sm font-semibold text-foreground sm:text-base">{sub.title}</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">{sub.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="mt-5 space-y-3 rounded-2xl border border-border/40 bg-muted/20 p-4 sm:p-5">
                        {section.bullets.map((item) => (
                          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </motion.section>
            ))}
          </div>
        </article>
      </main>
    </div>
  );
}
