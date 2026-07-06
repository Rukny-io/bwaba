"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { DynamicIslandTOC } from "@/components/ui/dynamic-island-toc";
import { useLocale } from "next-intl";

export default function PrivacyPolicyPage() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const dir = isEn ? "ltr" : "rtl";

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/20" dir={dir}>
      <DynamicIslandTOC />

      <main className="mx-auto w-full max-w-4xl px-6 pb-40 pt-16 sm:pt-24">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground group"
          >
            <ArrowRight className={`h-4 w-4 transition-transform ${isEn ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
            {isEn ? "Back to Login" : "العودة لتسجيل الدخول"}
          </Link>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            {isEn ? "Last updated: May 2026" : "آخر تحديث: مايو 2026"}
          </span>
        </div>

        <article className={`prose prose-zinc mx-auto max-w-none ${isEn ? 'text-left' : 'text-right'} dark:prose-invert`}>
          <h1 className="mb-4 flex items-center justify-start gap-3 text-4xl font-bold tracking-tight sm:text-5xl">
            <ShieldCheck className="h-9 w-9" />
            {isEn ? "Privacy Policy" : "سياسة الخصوصية"}
          </h1>
          <p className="text-muted-foreground">
            {isEn
              ? "This policy explains how we collect, use, and protect your data when you use the Rukny accounts service and related login services."
              : "توضح هذه السياسة كيف نجمع بياناتك ونستخدمها ونحميها عند استخدامك لخدمة حسابات ركني وخدمات تسجيل الدخول ذات الصلة."}
          </p>

          <img
            src="https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1700&q=80"
            alt={isEn ? "Data Protection Concept" : "مفهوم حماية البيانات"}
            className="my-8 h-72 w-full rounded-2xl border border-border object-cover"
          />

          <h2>{isEn ? "1. Information We Collect" : "1. المعلومات التي نجمعها"}</h2>
          <p>
            {isEn
              ? "We collect basic account data for identity verification, technical security logs, and profile data you optionally choose to add."
              : "نجمع بيانات الحساب الأساسية للتحقق من الهوية، وسجلات أمان تقنية، وبيانات الملف الشخصي التي تختار إضافتها اختياريًا."}
          </p>

          <h2>{isEn ? "2. How We Use Information" : "2. كيفية استخدام المعلومات"}</h2>
          <p>
            {isEn
              ? "We use the information to secure login, prevent abuse, detect suspicious attempts, and improve the platform's performance and reliability."
              : "نستخدم المعلومات لتأمين تسجيل الدخول، منع إساءة الاستخدام، كشف المحاولات المشبوهة، وتحسين أداء وموثوقية المنصة."}
          </p>

          <h2>{isEn ? "3. Data Sharing" : "3. مشاركة البيانات"}</h2>
          <p>
            {isEn
              ? "We do not share your data except when operationally or legally necessary, and with trusted service providers who support the system's operation, under strict security controls and contractual obligations."
              : "لا نشارك بياناتك إلا عند الحاجة التشغيلية أو القانونية، ومع مزودي خدمات موثوقين يدعمون تشغيل النظام، وفق ضوابط أمان والتزامات تعاقدية."}
          </p>

          <h2>{isEn ? "4. Data Security" : "4. أمن البيانات"}</h2>
          <p>
            {isEn
              ? "We implement appropriate access controls, encrypted communications, and multi-layered verification mechanisms, including two-factor authentication options, to protect your account and associated data."
              : "نطبق ضوابط وصول مناسبة، واتصالات مشفرة، وآليات تحقق متعددة الطبقات، بما في ذلك خيارات التحقق الثنائي لحماية حسابك والبيانات المرتبطة به."}
          </p>

          <h2>{isEn ? "5. Data Retention and Deletion" : "5. الاحتفاظ بالبيانات وحذفها"}</h2>
          <p>
            {isEn
              ? "We retain data for the period necessary for security, operational, and legal reasons. You can request deletion when permitted by the system and applicable laws."
              : "نحتفظ بالبيانات للمدة اللازمة لأسباب أمنية وتشغيلية وقانونية، ويمكنك طلب الحذف عندما يسمح النظام والقوانين المعمول بها."}
          </p>

          <h2 data-toc-ignore>{isEn ? "Contact" : "التواصل"}</h2>
          <p>
            {isEn
              ? "For any inquiries regarding the privacy policy, you can contact us through the official support channels within your Rukny account."
              : "لأي استفسار حول سياسة الخصوصية، يمكنك التواصل عبر قنوات الدعم الرسمية داخل حسابك في ركني."}
          </p>
        </article>
      </main>
    </div>
  );
}
