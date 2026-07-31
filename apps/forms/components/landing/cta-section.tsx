'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Zap,
  BarChart3,
  Layers,
  Check,
  HelpCircle,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import { APP_BASE } from '@/components/app/nav-config';
import { AnimatedNumber } from './animated-number';
import { cn } from '@/lib/utils';

/* ── Tab data ── */

interface CtaTab {
  id: string;
  label: string;
  icon: LucideIcon;
  title: string;
  description: string;
  highlights: string[];
  preview: {
    src: string;
    alt: string;
  };
}

const TABS: CtaTab[] = [
  {
    id: 'builder',
    label: 'بناء سريع',
    icon: Sparkles,
    title: 'صمّم نماذجك بدقائق',
    description:
      'محرّر بصري بالسحب والإفلات، حقول جاهزة، ومعاينة فورية قبل النشر.',
    highlights: [
      'حقول متعددة الأنواع',
      'نماذج متعددة الخطوات',
      'تخصيص الألوان والشعار',
      'معاينة حية على الجوال',
    ],
    preview: {
      src: '/hero/creating.png',
      alt: 'معاينة إنشاء نموذج في ركني Forms',
    },
  },
  {
    id: 'integrations',
    label: 'تكاملات ذكية',
    icon: Zap,
    title: 'اربط أدواتك المفضّلة',
    description:
      'أرسل الاستجابات تلقائياً إلى Google Sheets وGmail وأدوات الأتمتة.',
    highlights: [
      'Google Sheets و Drive',
      'تنبيهات Gmail فورية',
      'Zapier و Make و n8n',
      'Webhooks مخصّصة',
    ],
    preview: {
      src: '/hero/integrations.png',
      alt: 'معاينة تكاملات ركني Forms',
    },
  },
  {
    id: 'analytics',
    label: 'تحليلات فورية',
    icon: BarChart3,
    title: 'افهم جمهورك بعمق',
    description:
      'لوحة تحليلات شاملة: معدلات الإكمال، المصادر، والأجهزة.',
    highlights: [
      'قمع الإكمال',
      'تحليل جغرافي',
      'تصدير CSV',
      'تقارير قابلة للمشاركة',
    ],
    preview: {
      src: '/hero/templates.png',
      alt: 'معاينة قوالب وتحليلات ركني Forms',
    },
  },
  {
    id: 'scale',
    label: 'قابل للتوسع',
    icon: Layers,
    title: 'انمُ مع فريقك',
    description:
      'إدارة الفريق، صلاحيات متدرجة، ونماذج غير محدودة للأعمال المتنامية.',
    highlights: [
      'دعوة أعضاء الفريق',
      'صلاحيات مرنة',
      'مساحات عمل متعددة',
      'أمان على مستوى المؤسسات',
    ],
    preview: {
      src: '/hero/Team.png',
      alt: 'معاينة إدارة الفريق في ركني Forms',
    },
  },
];

const AVATARS = [
  { initials: 'س', color: 'bg-[#6366f1]' },
  { initials: 'م', color: 'bg-[#0ea5e9]' },
  { initials: 'ر', color: 'bg-[#10b981]' },
  { initials: 'ل', color: 'bg-[#f59e0b]' },
  { initials: 'ن', color: 'bg-[#ec4899]' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] as const },
  },
};

const panelVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2 },
  },
};

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M15.9959 10.0005L3 10.0005"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.73389 16.3179L15.6318 9.99866L9.73389 3.67945"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TabPreview({ tab }: { tab: CtaTab }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tab.id}
        variants={panelVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        className="relative min-h-[240px] overflow-hidden bg-[var(--surface-secondary)]/40 min-[720px]:min-h-[360px]"
      >
        <Image
          src={tab.preview.src}
          alt={tab.preview.alt}
          fill
          priority={tab.id === 'builder'}
          sizes="(max-width: 960px) 100vw, 640px"
          className="object-cover object-top transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        />
        <div
          aria-hidden
          className="landing-preview-fade pointer-events-none absolute inset-x-0 bottom-0 h-16"
        />
      </motion.div>
    </AnimatePresence>
  );
}

export function CtaSection() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const TabIcon = tab.icon;

  return (
    <section className="mx-auto w-full max-w-[var(--max-content-width)] px-5 py-20 min-[720px]:px-6 min-[720px]:py-28 min-[1280px]:px-0">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="flex flex-col gap-8"
      >
        {/* Header */}
        <div className="text-center">
          <p className="mx-auto max-w-[640px] text-[15px] leading-relaxed text-[var(--muted-foreground)] min-[720px]:text-base">
            أنشئ نماذجك، أدر استجاباتك، واربط أدواتك — كل ذلك من لوحة تحكم
            واحدة سهلة وقابلة للتخصيص.
          </p>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="مميزات المنصة"
          className="flex flex-wrap justify-center gap-2"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all duration-200',
                  active
                    ? 'landing-tab-active'
                    : 'text-[var(--muted-foreground)] landing-tab-inactive',
                )}
              >
                <Icon className="size-4" strokeWidth={2} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab panel: preview + content */}
        <div
          role="tabpanel"
          className="landing-panel grid overflow-hidden rounded-[32px] min-[960px]:grid-cols-2"
        >
          {/* Preview */}
          <div className="border-b border-[var(--border)]/60 bg-[var(--surface)] min-[960px]:border-b-0 min-[960px]:border-e">
            <div className="flex items-center gap-2 border-b border-[var(--border)]/50 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                <span className="size-2.5 rounded-full bg-[#febc2e]" />
                <span className="size-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
                ركني Forms
              </span>
            </div>
            <TabPreview tab={tab} />
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={panelVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-col justify-between gap-8 p-8 min-[720px]:p-10"
            >
              <div>
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--primary)]">
                  <TabIcon className="size-4" strokeWidth={2} />
                  {tab.label}
                </div>
                <h3 className="mt-3 text-2xl font-bold tracking-tight text-[var(--foreground)] min-[720px]:text-3xl">
                  {tab.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--muted-foreground)]">
                  {tab.description}
                </p>
                <ul className="mt-6 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
                  {tab.highlights.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-[13px] font-medium text-[var(--foreground)]"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                        <Check className="size-3" strokeWidth={2.5} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`${APP_BASE}/help`}
                  className="landing-surface-btn inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors"
                >
                  <HelpCircle className="size-4 text-[var(--muted-foreground)]" />
                  مركز المساعدة
                </Link>
                <Link
                  href={APP_BASE}
                  className="landing-invert-btn group inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-opacity hover:opacity-90"
                >
                  <span>افتح لوحة التحكم</span>
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Community CTA + social proof */}
        <div className="grid gap-4 min-[960px]:grid-cols-[1.35fr_1fr]">
          {/* Main CTA card */}
          <div className="landing-panel relative overflow-hidden rounded-[28px] p-8 min-[720px]:p-10">
            <div className="relative">
              <div className="inline-flex items-center gap-3">
                <span className="landing-surface-btn rounded-full px-3.5 py-1 text-[11px] font-semibold">
                  ابدأ اليوم
                </span>
                <span className="h-px w-12 bg-[var(--border)]" aria-hidden />
              </div>

              <h2 className="mt-5 max-w-md text-2xl font-bold leading-tight tracking-tight text-[var(--foreground)] min-[720px]:text-[34px] min-[720px]:leading-[1.15]">
                جاهز لإطلاق نموذجك الأول؟
              </h2>
              <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-[var(--muted-foreground)]">
                ابدأ مجاناً بدون بطاقة ائتمان. أنشئ، شارك، واجمع الاستجابات خلال
                دقائق.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={APP_BASE}
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary)]/20 transition-[transform,opacity] hover:opacity-95 active:scale-[0.98]"
                >
                  <span>ابدأ مجاناً</span>
                  <span className="flex size-8 items-center justify-center rounded-full bg-[var(--primary-foreground)]/15 transition-transform group-hover:-translate-x-0.5">
                    <ArrowIcon className="size-4 rotate-180" />
                  </span>
                </Link>
                <Link
                  href="#pricing"
                  className="landing-surface-btn inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors"
                >
                  استعراض الباقات
                </Link>
              </div>

              <p className="mt-5 text-[12px] text-[var(--muted-foreground)]">
                لديك أسئلة؟{' '}
                <Link
                  href={`${APP_BASE}/help`}
                  className="font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
                >
                  تواصل مع فريق الدعم
                </Link>
              </p>
            </div>
          </div>

          {/* Stats cards */}
          <div className="flex flex-col gap-4">
            <div className="landing-panel relative flex flex-1 flex-col justify-between overflow-hidden rounded-[28px] p-7">
              <div>
                <p className="text-4xl font-bold tracking-tight text-[var(--foreground)] min-[720px]:text-5xl">
                  <AnimatedNumber value={8500} />
                  <span>+</span>
                </p>
                <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">
                  نموذج منشور على المنصة
                </p>
              </div>
              <svg
                aria-hidden
                className="mt-4 h-8 w-full text-[var(--primary)] opacity-40"
                viewBox="0 0 200 32"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 24 Q50 8 100 20 T200 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>

            <div className="landing-panel rounded-[28px] p-7">
              <div className="flex -space-x-2 space-x-reverse">
                {AVATARS.map((a) => (
                  <div
                    key={a.initials}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-full text-[11px] font-bold text-white ring-2 ring-[var(--surface-secondary)]',
                      a.color,
                    )}
                  >
                    {a.initials}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[13px] font-semibold text-[var(--foreground)]">
                <span className="text-lg font-bold">250k+</span> استجابة مجمّعة
              </p>
              <p className="mt-1 text-[12px] text-[var(--muted-foreground)]">
                تقييم 4.8 من 5 من مستخدمي المنصة
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
