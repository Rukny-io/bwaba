"use client";

import {
  MailCountUp,
  MailSplitWords,
} from "@/components/marketing/mail-motion-kit";
import {
  MailReveal,
  MailRevealItem,
  MailStagger,
} from "@/components/marketing/mail-reveal";
import { cfLayout } from "@/lib/mail-cloudflare-theme";

const STATS = [
  {
    value: 5000,
    suffix: "+",
    caption: "Outbound emails included on Starter",
  },
  {
    value: 99,
    suffix: ".9%",
    caption: "Delivery with guided SPF & DKIM setup",
  },
  {
    value: 3,
    suffix: " min",
    caption: "From domain to first live inbox",
  },
] as const;

const PILLARS = [
  {
    title: "Run everywhere",
    body: "Webmail on phone, tablet, and desktop — one inbox, any device.",
  },
  {
    title: "Run as your brand",
    body: "Every message leaves as you@yourdomain, not a shared address.",
  },
  {
    title: "Run at your pace",
    body: "Add mailboxes, aliases, and forwards without extra tools.",
  },
] as const;

export function MailHomeRegionBand() {
  return (
    <section className="bg-[#F6F6F4] text-[#1D1D1D]" aria-labelledby="region-title">
      <div className={`${cfLayout.container} ${cfLayout.section}`}>
        <MailReveal>
          <p className="text-center text-[13px] font-medium text-[#6B6F76]">
            Region: Earth
          </p>
          <MailSplitWords
            as="h2"
            mode="scroll"
            text="One smart workspace for mail and your team"
            className={`${cfLayout.sectionTitle} mx-auto mt-4 max-w-[18ch] text-center`}
          />
          <span id="region-title" className="sr-only">
            Region Earth section
          </span>
          <p className={`${cfLayout.lead} mx-auto mt-5 max-w-[40rem] text-center`}>
            Professional addresses on the domain you already own — close to your
            team, trusted by recipients.
          </p>
        </MailReveal>

        <MailStagger
          className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3"
          stagger={0.08}
        >
          {STATS.map((stat) => (
            <MailRevealItem key={stat.caption} className={cfLayout.card}>
              <p className="text-[2rem] font-semibold tabular-nums tracking-[-0.04em] text-[#1D1D1D] sm:text-[2.25rem]">
                <MailCountUp value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#6B6F76]">
                {stat.caption}
              </p>
            </MailRevealItem>
          ))}
        </MailStagger>

        <MailStagger
          as="ul"
          className="mt-16 grid gap-8 sm:grid-cols-3 sm:gap-10"
          stagger={0.09}
        >
          {PILLARS.map((pillar) => (
            <MailRevealItem key={pillar.title} as="li" className="text-center sm:text-left">
              <h3 className="text-[18px] font-semibold tracking-[-0.02em]">
                {pillar.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#6B6F76]">
                {pillar.body}
              </p>
            </MailRevealItem>
          ))}
        </MailStagger>
      </div>
    </section>
  );
}
