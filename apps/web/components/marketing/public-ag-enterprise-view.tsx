'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Building2,
  Check,
  Globe,
  Headphones,
  Plug,
  ShieldCheck,
  Users,
  Webhook,
  type LucideIcon,
} from 'lucide-react';
import { agLayout } from '@/lib/public-antigravity-theme';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;
const CONTACT_EMAIL = 'support@rukny.io';
const ENTERPRISE_TINT = 'bg-[#F5F3FF]';

type EnterpriseFeature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type DetailSection = {
  eyebrow: string;
  title: string;
  titleMuted: string;
  items: EnterpriseFeature[];
};

const HERO_PILLS = [
  'فرق وصلاحيات',
  'تكاملات وWebhooks',
  'دعم أسرع',
  'تحليلات متقدمة',
] as const;

const SHOWCASE_FEATURES: EnterpriseFeature[] = [
  {
    title: 'إعداد للفرق',
    description: 'حسابات متعددة، صلاحيات، ومساحات عمل منظمة.',
    icon: Users,
  },
  {
    title: 'تكاملات مخصصة',
    description: 'واجهات برمجية، Webhooks، وربط مع أنظمتك.',
    icon: Plug,
  },
  {
    title: 'دعم مباشر',
    description: 'قناة تواصل مخصصة واستجابة أسرع.',
    icon: Headphones,
  },
];

const DETAIL_SECTIONS: DetailSection[] = [
  {
    eyebrow: 'الفرق',
    title: 'اعمل',
    titleMuted: ' مع فريقك',
    items: [
      {
        title: 'صلاحيات واضحة',
        description:
          'أدوار مختلفة لأعضاء الفريق — من الإدارة إلى التحرير — مع تحكم دقيق بما يمكن لكل شخص فعله.',
        icon: Users,
      },
      {
        title: 'فريق النماذج',
        description:
          'شارك النماذج مع زملائك — إدارة مشتركة للاستجابات، Webhooks، والتحليلات.',
        icon: Building2,
      },
      {
        title: 'مساحات منظمة',
        description:
          'متجر، نماذج، ملف شخصي، وتحليلات — كل فريق يرى ما يحتاجه في لوحة واحدة.',
        icon: BarChart3,
      },
    ],
  },
  {
    eyebrow: 'التكامل',
    title: 'اربط',
    titleMuted: ' ركني بأنظمتك',
    items: [
      {
        title: 'Webhooks وواجهات',
        description:
          'أرسل أحداث الطلبات والاستجابات إلى CRM أو ERP أو أي نظام تستخدمه.',
        icon: Webhook,
      },
      {
        title: 'Google ووسائل التواصل',
        description:
          'Sheets، Drive، Calendar، Instagram، YouTube — تكاملات جاهزة للفرق النشطة.',
        icon: Plug,
      },
      {
        title: 'نطاقات مخصصة',
        description:
          'اربط نطاقك الخاص — حضور احترافي يعكس علامتك أمام العملاء.',
        icon: Globe,
      },
    ],
  },
  {
    eyebrow: 'الثقة',
    title: 'أمان',
    titleMuted: ' ودعم أولوية',
    items: [
      {
        title: 'أمان متقدم',
        description:
          'مصادقة ثنائية، سجل أمان، كشف نشاط مشبوه، وضوابط وصول أوضح للفرق.',
        icon: ShieldCheck,
      },
      {
        title: 'تحليلات كاملة',
        description:
          'مبيعات، استجابات، وزيارات — مع تصدير CSV وPDF ومقارنة الفترات.',
        icon: BarChart3,
      },
      {
        title: 'دعم مباشر',
        description:
          'قناة تواصل مخصصة، استجابة أسرع، ومساعدة في الإعداد والتشغيل.',
        icon: Headphones,
      },
    ],
  },
];

const HIGHLIGHTS = [
  'فرق حتى 10 أعضاء في باقة الأعمال',
  'صلاحيات وأدوار لكل عضو',
  'Webhooks وواجهات برمجية',
  'تكامل Google Sheets و Drive',
  'تحليلات كاملة وتصدير PDF',
  'نطاق مخصص لعلامتك',
  'مصادقة ثنائية وسجل أمان',
  'دعم أولوية واستجابة أسرع',
  'حلول حسب القطاع: تجارة، تعليم، خدمات',
] as const;

const STEPS = [
  {
    title: 'شاركنا احتياجك',
    description: 'أخبرنا عن فريقك، حجم العمليات، والتكاملات التي تحتاجها.',
  },
  {
    title: 'نصمم الحل',
    description: 'نقترح الباقة، الإعداد، والجدول الزمني — بدون التزام مسبق.',
  },
  {
    title: 'نطلق معك',
    description: 'إعداد، تدريب، ودعم مباشر حتى يعمل فريقك بثقة.',
  },
] as const;

function FeatureCard({
  feature,
  index,
  reduceMotion,
  surface = 'muted',
}: {
  feature: EnterpriseFeature;
  index: number;
  reduceMotion: boolean | null;
  surface?: 'muted' | 'white';
}) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: EASE }}
      className={cn(
        'rounded-[2rem] p-7 sm:p-8',
        surface === 'white' ? 'bg-white' : 'bg-[#FAFAFA]',
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-[1rem] bg-white/80">
        <Icon className="size-5 text-[#1D1D1D]/70" strokeWidth={1.5} />
      </div>
      <h3 className="mt-5 text-[1.05rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
        {feature.title}
      </h3>
      <p className="mt-2 text-[14px] leading-[1.8] text-[#6B6F76]">{feature.description}</p>
    </motion.div>
  );
}

export function PublicAgEnterpriseView() {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn(agLayout.container, 'pb-16 pt-10 sm:pb-20 sm:pt-14 md:pt-16')}>
      <motion.header
        className="mx-auto max-w-4xl text-start md:pt-2"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <p className={agLayout.eyebrow}>للمؤسسات</p>
        <h1 className={`${agLayout.sectionTitle} mt-4 max-w-3xl`}>
          حلول مخصصة
          <span className="text-[#9CA3AF]"> للفرق والمؤسسات</span>
        </h1>
        <p className={`${agLayout.lead} mt-5 max-w-2xl text-[15px] leading-[1.85] sm:text-[16px]`}>
          للفرق التي تحتاج أكثر من باقة جاهزة — صلاحيات، تكاملات، تحليلات متقدمة،
          ودعم مباشر على منصة ركني.
        </p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {HERO_PILLS.map((pill) => (
            <li
              key={pill}
              className="rounded-full bg-[#FAFAFA] px-3.5 py-1.5 text-[12px] font-medium text-[#6B6F76]"
            >
              {pill}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('استفسار مؤسسات — ركني')}`} className={agLayout.btnPrimary}>
            تواصل مع المبيعات
          </a>
          <Link href="/pricing" className={agLayout.btnSecondary}>
            عرض الأسعار
          </Link>
        </div>
      </motion.header>

      <motion.div
        className={cn('mt-12 overflow-hidden rounded-[2rem] sm:mt-16', ENTERPRISE_TINT)}
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
      >
        <div className="grid gap-6 p-8 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end lg:gap-10">
          <div className="text-start">
            <div className="flex size-14 items-center justify-center rounded-[1.25rem] bg-white/75">
              <Building2 className="size-7 text-[#1D1D1D]/75" strokeWidth={1.35} />
            </div>
            <h2 className="mt-6 text-[1.35rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
              ركني للمؤسسات
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-[1.85] text-[#6B6F76]">
              من الشركات الناشئة إلى الفرق الكبيرة — بنية جاهزة للنمو مع متجر،
              نماذج، وتحليلات في منصة واحدة.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {SHOWCASE_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-[1.5rem] bg-white/70 p-5 text-start"
                >
                  <Icon className="size-5 text-[#1D1D1D]/70" strokeWidth={1.5} />
                  <p className="mt-4 text-[14px] font-medium text-[#1D1D1D]">
                    {feature.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {DETAIL_SECTIONS.map((section, sectionIndex) => (
        <section
          key={section.eyebrow}
          className={cn(
            'mt-16 sm:mt-20',
            sectionIndex % 2 === 0 ? ENTERPRISE_TINT : agLayout.sectionMuted,
            'rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12',
          )}
          aria-labelledby={`enterprise-detail-${sectionIndex}`}
        >
          <div className="mb-8 grid gap-6 text-start sm:mb-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:gap-10">
            <span className={agLayout.index}>
              {String(sectionIndex + 1).padStart(2, '0')}
            </span>
            <div>
              <p className={agLayout.eyebrow}>{section.eyebrow}</p>
              <h2 id={`enterprise-detail-${sectionIndex}`} className={`${agLayout.sectionTitle} mt-4`}>
                {section.title}
                <span className="text-[#9CA3AF]">{section.titleMuted}</span>
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {section.items.map((item, index) => (
              <FeatureCard
                key={item.title}
                feature={item}
                index={index}
                reduceMotion={reduceMotion}
                surface="white"
              />
            ))}
          </div>
        </section>
      ))}

      <section className="mt-16 sm:mt-20" aria-labelledby="enterprise-highlights-heading">
        <div className="mb-8 max-w-2xl text-start sm:mb-10">
          <p className={agLayout.eyebrow}>التفاصيل</p>
          <h2 id="enterprise-highlights-heading" className={`${agLayout.sectionTitle} mt-4`}>
            كل ما
            <span className="text-[#9CA3AF]"> تحتاجه</span>
          </h2>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-[1.5rem] bg-[#FAFAFA] px-4 py-4 text-[14px] text-[#6B6F76]"
            >
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white">
                <Check className="size-3.5 text-[#1D1D1D]/55" strokeWidth={2.5} />
              </span>
              <span className="leading-[1.7]">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        className={`${agLayout.sectionMuted} mt-16 rounded-[2rem] px-6 py-10 sm:mt-20 sm:px-10 sm:py-12`}
        aria-labelledby="enterprise-steps-heading"
      >
        <div className="mb-8 grid gap-6 text-start sm:mb-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:gap-10">
          <span className={agLayout.index}>04</span>
          <div>
            <p className={agLayout.eyebrow}>كيف نبدأ</p>
            <h2 id="enterprise-steps-heading" className={`${agLayout.sectionTitle} mt-4`}>
              ثلاث خطوات
              <span className="text-[#9CA3AF]"> للانطلاق</span>
            </h2>
          </div>
        </div>

        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-[2rem] bg-white p-7 text-start sm:p-8">
              <span className="text-[13px] font-medium tabular-nums text-[#9CA3AF]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 text-[1.05rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                {step.title}
              </h3>
              <p className="mt-2 text-[14px] leading-[1.8] text-[#6B6F76]">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 sm:mt-20" aria-labelledby="enterprise-contact-heading">
        <div className="grid gap-8 rounded-[2rem] bg-[#1D1D1D] p-8 text-white sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
          <div className="text-start">
            <p className="text-[12px] font-medium tracking-[0.14em] text-white/55">
              تواصل معنا
            </p>
            <h2
              id="enterprise-contact-heading"
              className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-[-0.03em]"
            >
              لنبني الحل المناسب لفريقك
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-[1.8] text-white/70">
              أرسل لنا تفاصيل فريقك واحتياجاتك — نرد خلال يوم عمل ونقترح الخطوة
              التالية.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 inline-block text-[15px] text-white underline underline-offset-4 transition-opacity hover:opacity-80"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('استفسار مؤسسات — ركني')}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:bg-[#FAFAFA]"
            >
              تواصل مع المبيعات
            </a>
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white/10 px-6 text-[14px] font-medium text-white transition-colors hover:bg-white/15"
            >
              مقارنة الباقات
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
