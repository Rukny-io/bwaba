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
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] as const },
  },
};

export function IntegrationsSection() {
  return (
    <section
      id="integrations"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-16 min-[720px]:px-6 min-[720px]:py-24"
    >
      <motion.div
        className="grid place-items-center text-center"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >
        <span className="landing-section-eyebrow">التكاملات</span>
        <h2 className="mt-5 max-w-[620px] text-3xl font-bold leading-tight tracking-tight text-[var(--foreground)] min-[720px]:text-[2.75rem] min-[720px]:leading-[1.15]">
          متصل بالأدوات التي تعمل عليها كل يوم
        </h2>
        <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-[var(--muted-foreground)] min-[720px]:text-lg">
          أرسل بياناتك تلقائياً إلى جداولك وبريدك وأدوات الأتمتة المفضّلة لديك.
        </p>
      </motion.div>

      <motion.ul
        className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 min-[720px]:mt-14 min-[720px]:grid-cols-4 min-[720px]:gap-4"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        {INTEGRATIONS.map((item) => (
          <motion.li key={item.name} variants={fadeUp}>
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-5 transition-shadow duration-300 hover:shadow-[var(--card-shadow)]">
              <div className="flex size-11 items-center justify-center">
                <Image
                  src={item.src}
                  alt={item.name}
                  width={44}
                  height={44}
                  className="max-h-9 max-w-9 object-contain"
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
