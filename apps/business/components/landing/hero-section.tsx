'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Inbox, Instagram, MessageCircle } from 'lucide-react';

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
        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-medium text-[var(--muted-foreground)]"
        variants={reduceMotion ? undefined : fadeUp}
      >
        <Inbox className="size-3.5 text-[var(--primary)]" />
        صندوق وارد موحّد للمحادثات
      </motion.div>

      <motion.div
        className="mt-7 grid max-w-3xl place-items-center text-center min-[720px]:mt-8"
        variants={reduceMotion ? undefined : fadeUp}
      >
        <h1 className="text-[2rem] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--foreground)] min-[720px]:text-[3.25rem]">
          أدر محادثات{' '}
          <span className="text-[var(--primary)]">Instagram</span> و{' '}
          <span className="text-[var(--primary)]">Messenger</span> من مكان واحد
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--muted-foreground)] min-[720px]:mt-5 min-[720px]:text-lg">
          ركني Business يربط قنوات Meta في لوحة عربية أنيقة — رد أسرع، متابعة
          أفضل، وفريق واحد لكل المحادثات.
        </p>
      </motion.div>

      <motion.div
        className="mt-7 flex flex-wrap items-center justify-center gap-3 min-[720px]:mt-9"
        variants={reduceMotion ? undefined : fadeUp}
      >
        <Link
          href="/login"
          className="landing-invert-btn inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold"
        >
          افتح صندوق الوارد
        </Link>
        <a
          href="#features"
          className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--landing-subtle-hover)]"
        >
          استكشف المميزات
          <ArrowLeft className="size-4 opacity-70" strokeWidth={2} />
        </a>
      </motion.div>

      <motion.div
        className="landing-glass mt-12 w-full max-w-4xl rounded-[1.75rem] p-4 min-[720px]:mt-16 min-[720px]:p-6"
        variants={reduceMotion ? undefined : fadeUp}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Instagram, label: 'Instagram DMs', value: 'متصل' },
            { icon: MessageCircle, label: 'Messenger', value: 'قريباً' },
            { icon: Inbox, label: 'صندوق موحّد', value: 'جاهز' },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center"
            >
              <Icon className="mx-auto size-5 text-[var(--primary)]" />
              <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">{label}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}
