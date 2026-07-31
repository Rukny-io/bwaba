'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AppLogoStack } from './app-logo-stack';
import { HeroTrustLogos } from './hero-trust-logos';

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M15.9959 10.0005L3 10.0005"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="nonScalingStroke"
      />
      <path
        d="M9.73389 16.3179L15.6318 9.99866L9.73389 3.67945"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="nonScalingStroke"
      />
    </svg>
  );
}

/* ── Orchestrated stagger container ── */
const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] },
  },
};

export function HeroSection() {
  return (
    <motion.section
      className="grid place-items-center px-5 pt-10 pb-12 min-[720px]:px-6 min-[720px]:pt-24 min-[720px]:pb-16 min-[1280px]:px-0 min-[1280px]:pt-28 min-[1280px]:pb-20"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div className="rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-4 py-2 text-sm font-semibold text-[var(--foreground)] shadow-sm min-[720px]:text-base" variants={fadeUp}>
        منصة ركني لإنشاء النماذج العربية بسرعة وبدون تعقيد
      </motion.div>

      {/* Logo icon */}
      <motion.div variants={scaleIn}>
        <AppLogoStack />
      </motion.div>

      {/* Headline + subtitle */}
      <motion.div className="grid place-items-center" variants={fadeUp}>
        <h1 className="max-w-[280px] pt-6 text-center text-3xl font-bold leading-tight tracking-tight text-[var(--foreground)] min-[720px]:max-w-[480px] min-[720px]:pt-7 min-[720px]:text-[44px] min-[720px]:leading-[1.12] min-[1280px]:max-w-[640px] min-[1280px]:text-[52px] min-[1280px]:leading-[1.08]">
          أطلق نماذجك الاحترافية مع ركني
        </h1>

        <p className="max-w-[300px] pt-3 text-center text-[15px] leading-relaxed text-[var(--muted-foreground)] min-[720px]:max-w-[420px] min-[720px]:pt-4 min-[720px]:text-base min-[1280px]:max-w-[540px] min-[1280px]:text-lg">
          نماذج متعددة الخطوات، متابعة البريد وإدارة متكاملة في لوحة تحكم واحدة
        </p>
      </motion.div>

      {/* CTAs */}
      <motion.div className="pt-6 min-[720px]:pt-8" variants={fadeUp}>
        <div
          id="hero-section-ctas"
          className="flex items-center justify-center gap-3"
        >
          {/* Primary CTA */}
          <div className="relative overflow-hidden rounded-full">
            <Link
              href="/app"
              className="landing-invert-btn relative flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-opacity hover:opacity-90"
            >
              ابدأ مجاناً
            </Link>
            <div
              className="hero-btn-shine pointer-events-none absolute inset-y-0 left-[-120%] hidden w-1/2 -skew-x-12 bg-[var(--background)]/25 mix-blend-hard-light min-[720px]:block"
              aria-hidden
            />
          </div>

          {/* Secondary CTA */}
          <Link
            href="#pricing"
            className="landing-outline-btn relative flex h-11 items-center justify-center rounded-full bg-transparent px-5 text-sm font-semibold text-[var(--foreground)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <span>خطط الأسعار</span>
              <span className="-me-1 rounded-full bg-[var(--landing-subtle-hover)] p-1">
                <ArrowRightIcon className="size-4 rotate-180" />
              </span>
            </span>
          </Link>
        </div>
      </motion.div>

      {/* Trust logos */}
      <motion.div className="grid place-items-center" variants={fadeUp}>
        <p className="pt-10 text-xs text-[var(--muted-foreground)] min-[720px]:pt-14 min-[720px]:text-sm">
          يثق بنا فرق المنتجات والتصميم
        </p>
        <div className="pt-5 min-[720px]:pt-6">
          <HeroTrustLogos />
        </div>
      </motion.div>
    </motion.section>
  );
}
