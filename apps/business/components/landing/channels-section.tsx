'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const CHANNELS = [
  {
    name: 'Instagram',
    status: 'متاح الآن',
    description: 'ربط حسابات Professional، استقبال DMs والتعليقات.',
    badgeClass: 'bg-gradient-to-r from-[#f09433]/15 via-[#e6683c]/15 to-[#bc1888]/15 text-[#bc1888]',
  },
  {
    name: 'Messenger',
    status: 'قريباً',
    description: 'ربط صفحات Facebook ورسائل Messenger في نفس الصندوق.',
    badgeClass: 'bg-[#0084ff]/10 text-[#0084ff]',
  },
];

export function ChannelsSection() {
  return (
    <section id="channels" className="scroll-mt-24 py-16 min-[720px]:py-24">
      <div className="mx-auto max-w-6xl px-5 min-[720px]:px-6">
        <div className="landing-panel rounded-[1.75rem] p-6 min-[720px]:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                قنوات Meta في مكان واحد
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted-foreground)]">
                ابدأ بـ Instagram اليوم، وستصل Messenger بنفس تجربة الربط والواجهة.
              </p>

              <div className="mt-8 space-y-4">
                {CHANNELS.map((channel) => (
                  <motion.div
                    key={channel.name}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-[var(--foreground)]">{channel.name}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${channel.badgeClass}`}>
                        {channel.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      {channel.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <Image
              src="/meta.svg"
              alt="Meta"
              width={140}
              height={48}
              className="mx-auto opacity-90 lg:mx-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
