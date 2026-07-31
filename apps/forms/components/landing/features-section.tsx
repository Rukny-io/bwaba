'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/* ── Ultra-light line icons (1.5px stroke, rounded) ── */

type IconProps = { className?: string };

function svgProps(className?: string) {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };
}

function BuilderIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <rect x="3" y="4" width="18" height="4" rx="1.5" />
      <rect x="3" y="12" width="11" height="4" rx="1.5" />
      <rect x="3" y="20" width="7" height="0.01" />
      <path d="M17 13.5h4M19 11.5v4" />
    </svg>
  );
}

function StepsIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M4 19h4v-4H4z" />
      <path d="M10 15h4V9h-4z" />
      <path d="M16 9h4V5h-4z" />
    </svg>
  );
}

function LogicIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <circle cx="6" cy="6" r="2.25" />
      <circle cx="18" cy="6" r="2.25" />
      <circle cx="12" cy="18" r="2.25" />
      <path d="M6 8.25v3a2 2 0 0 0 2 2h2.5M18 8.25v3a2 2 0 0 1-2 2h-2.5" />
    </svg>
  );
}

function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9.25 12l2 2 3.75-4" />
    </svg>
  );
}

function AnalyticsIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M4 19h16" />
      <path d="M7 19v-6M12 19V7M17 19v-9" />
    </svg>
  );
}

function PaletteIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-3.9-4-6-9-6z" />
      <circle cx="7.5" cy="10.5" r="1" />
      <circle cx="12" cy="7.5" r="1" />
      <circle cx="16.5" cy="10.5" r="1" />
    </svg>
  );
}

/* ── Feature data ── */

interface Feature {
  icon: (props: IconProps) => ReactNode;
  title: string;
  description: string;
  /** Tailwind col-span for the bento grid (desktop) */
  span: string;
}

const FEATURES: Feature[] = [
  {
    icon: BuilderIcon,
    title: 'محرّر سحب وإفلات',
    description:
      'ابنِ نماذجك بصرياً خلال دقائق — أكثر من ٢٠ نوع حقل جاهز، بدون أي كود.',
    span: 'min-[900px]:col-span-3',
  },
  {
    icon: StepsIcon,
    title: 'نماذج متعددة الخطوات',
    description:
      'قسّم الأسئلة على خطوات أنيقة مع شريط تقدّم يرفع نسبة إكمال النموذج.',
    span: 'min-[900px]:col-span-3',
  },
  {
    icon: LogicIcon,
    title: 'منطق شرطي ذكي',
    description:
      'أظهر الحقول واطرح الأسئلة بناءً على إجابات الزائر لتجربة مخصّصة.',
    span: 'min-[900px]:col-span-2',
  },
  {
    icon: ShieldIcon,
    title: 'تحقّق وحماية',
    description:
      'تحقّق من البريد والهاتف عبر OTP، وكشف النشاط المشبوه والأجهزة الموثوقة.',
    span: 'min-[900px]:col-span-2',
  },
  {
    icon: AnalyticsIcon,
    title: 'تحليلات فورية',
    description:
      'تابع الاستجابات ومعدلات الإكمال لحظياً، وصدّر بياناتك بصيغة CSV و PDF.',
    span: 'min-[900px]:col-span-2',
  },
  {
    icon: PaletteIcon,
    title: 'تصميم بهويتك',
    description:
      'خصّص الألوان والخطوط والشعار وصفحة الغلاف لتطابق النموذج علامتك التجارية.',
    span: 'min-[900px]:col-span-6',
  },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] as const },
  },
};

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <motion.article
      variants={fadeUp}
      className={`group relative flex flex-col rounded-[28px] bg-[var(--surface)]/5 p-1.5 ring-1 ring-[var(--border)] transition-shadow duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[var(--card-shadow-hover)] ${feature.span}`}
    >
      <div className="landing-feature-inner flex h-full flex-col rounded-[22px] bg-[var(--surface)] p-6 min-[720px]:p-7">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--secondary-foreground)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:scale-105">
          <Icon className="size-6" />
        </div>
        <h3 className="mt-5 text-lg font-bold tracking-tight text-[var(--foreground)]">
          {feature.title}
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted-foreground)]">
          {feature.description}
        </p>
      </div>
    </motion.article>
  );
}

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="mx-auto w-full max-w-[var(--max-content-width)] scroll-mt-24 px-5 py-20 min-[720px]:px-6 min-[720px]:py-28 min-[1280px]:px-0"
    >
      <motion.div
        className="grid place-items-center"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] shadow-sm">
          المميزات
        </span>
        <h2 className="mt-5 max-w-[640px] text-center text-3xl font-bold leading-tight tracking-tight text-[var(--foreground)] min-[720px]:text-[44px] min-[720px]:leading-[1.12]">
          كل ما تحتاجه لبناء نماذج تُنجز المهمة
        </h2>
        <p className="mt-4 max-w-[540px] text-center text-[15px] leading-relaxed text-[var(--muted-foreground)] min-[720px]:text-lg">
          أدوات قوية بواجهة بسيطة — من أول حقل حتى آخر تحليل، كل شيء في منصة
          واحدة مصمّمة للعربية.
        </p>
      </motion.div>

      <motion.div
        className="mt-12 grid grid-cols-1 gap-4 min-[900px]:mt-16 min-[900px]:grid-cols-6"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </motion.div>
    </section>
  );
}
