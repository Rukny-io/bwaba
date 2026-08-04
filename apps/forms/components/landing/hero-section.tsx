'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { AppLogoStack } from './app-logo-stack';
import { HeroTrustLogos } from './hero-trust-logos';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.32, 0.72, 0, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.04,
    },
  },
};

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className="mx-auto grid w-full max-w-6xl place-items-center px-5 pb-14 pt-10 min-[720px]:px-6 min-[720px]:pb-20 min-[720px]:pt-16"
      variants={reduceMotion ? undefined : stagger}
      initial={reduceMotion ? undefined : 'hidden'}
      animate={reduceMotion ? undefined : 'show'}
    >

      <motion.div
        className="mt-7 grid max-w-3xl place-items-center text-center min-[720px]:mt-8"
        variants={reduceMotion ? undefined : fadeUp}
      >
        <h1 className="text-[2rem] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--foreground)] min-[720px]:text-[3.25rem] min-[1100px]:text-[4rem]">
          أطلق نماذجك الاحترافية مع{' '}
          <span className="text-[var(--primary)]">ركني</span>
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--muted-foreground)] min-[720px]:mt-5 min-[720px]:text-lg">
          نماذج متعددة الخطوات، متابعة البريد وإدارة متكاملة في لوحة تحكم واحدة
          مصمّمة للعربية.
        </p>
      </motion.div>

      <motion.div
        className="mt-7 flex flex-wrap items-center justify-center gap-3 min-[720px]:mt-9"
        variants={reduceMotion ? undefined : fadeUp}
      >
        <Link
          href="/app"
          className="landing-invert-btn inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold"
        >
          ابدأ مجاناً
        </Link>
        <Link
          href="#pricing"
          className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--landing-subtle-hover)]"
        >
          خطط الأسعار
          <ArrowLeft className="size-4 opacity-70" strokeWidth={2} />
        </Link>
      </motion.div>

      <motion.div
        className="mt-12 grid place-items-center min-[720px]:mt-16"
        variants={reduceMotion ? undefined : fadeUp}
      >
        <p className="text-xs text-[var(--muted-foreground)] min-[720px]:text-sm">
          يثق بنا فرق المنتجات والتصميم
        </p>
        <div className="mt-5 min-[720px]:mt-6">
          <HeroTrustLogos />
        </div>
      </motion.div>
    </motion.section>
  );
}
