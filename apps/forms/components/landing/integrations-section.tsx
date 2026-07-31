'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface Integration {
  src: string;
  name: string;
}

const INTEGRATIONS: Integration[] = [
  { src: '/logo-rukny/Google Sheets.svg', name: 'Google Sheets' },
  { src: '/logo-rukny/Google Drive.svg', name: 'Google Drive' },
  { src: '/logo-rukny/gmail.svg', name: 'Gmail' },
  { src: '/logo-rukny/google calendar.svg', name: 'Google Calendar' },
  { src: '/logo-rukny/Slack.svg', name: 'Slack' },
  { src: '/logo-rukny/Zapier.svg', name: 'Zapier' },
  { src: '/logo-rukny/n8n.svg', name: 'n8n' },
  { src: '/logo-rukny/Make.svg', name: 'Make' },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] as const },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] as const },
  },
};

export function IntegrationsSection() {
  return (
    <section
      id="integrations"
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
          التكاملات
        </span>
        <h2 className="mt-5 max-w-[620px] text-center text-3xl font-bold leading-tight tracking-tight text-[var(--foreground)] min-[720px]:text-[44px] min-[720px]:leading-[1.12]">
          متصل بالأدوات التي تعمل عليها كل يوم
        </h2>
        <p className="mt-4 max-w-[520px] text-center text-[15px] leading-relaxed text-[var(--muted-foreground)] min-[720px]:text-lg">
          أرسل بياناتك تلقائياً إلى جداولك وبريدك وأدوات الأتمتة المفضّلة لديك.
        </p>
      </motion.div>

      <motion.ul
        className="mx-auto mt-12 grid max-w-[920px] grid-cols-2 gap-4 min-[720px]:mt-16 min-[720px]:grid-cols-4"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        {INTEGRATIONS.map((item) => (
          <motion.li key={item.name} variants={scaleIn}>
            <div className="group flex h-full flex-col items-center justify-center gap-3 rounded-[24px] bg-[var(--surface)] p-6 ring-1 ring-[var(--border)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[var(--card-shadow-hover)]">
              <div className="flex size-12 items-center justify-center">
                <Image
                  src={item.src}
                  alt={item.name}
                  width={48}
                  height={48}
                  className="max-h-10 max-w-10 object-contain transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110"
                />
              </div>
              <span
                className="text-[13px] font-medium text-[var(--muted-foreground)]"
                lang="en"
                dir="ltr"
              >
                {item.name}
              </span>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
