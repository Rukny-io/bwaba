"use client";

import { MailReveal, MailStagger, MailRevealItem } from "@/components/marketing/mail-reveal";
import { cfLayout } from "@/lib/mail-cloudflare-theme";

const REASONS = [
  {
    title: "Fits into your workflow",
    body: "Webmail, aliases, and forwards — no proprietary lock-in or extra apps to learn.",
  },
  {
    title: "One workspace for your team",
    body: "Mailboxes, DNS checklist, and billing in one console you control.",
  },
  {
    title: "Secure by default",
    body: "SPF, DKIM, anti-spam, and optional 2FA on every mailbox from day one.",
  },
  {
    title: "Fast path to professional mail",
    body: "Agentic drafts and smart replies when you need to send faster.",
  },
] as const;

export function MailHomeWhyBand() {
  return (
    <section
      className="border-t border-[#E4E4E7] bg-[#F6F6F4]"
      aria-labelledby="why-heading"
    >
      <div className={`${cfLayout.container} ${cfLayout.section}`}>
        <MailReveal>
          <h2 id="why-heading" className={`${cfLayout.sectionTitle} max-w-[14ch]`}>
            Why choose Rukny Mail
          </h2>
          <p className={`${cfLayout.lead} mt-4 max-w-[40rem]`}>
            Everything needed to look professional and stay in control of your
            domain.
          </p>
        </MailReveal>

        <MailStagger
          as="ul"
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          stagger={0.08}
        >
          {REASONS.map((item) => (
            <MailRevealItem key={item.title} as="li" className={cfLayout.card}>
              <h3 className="text-[16px] font-semibold tracking-[-0.02em]">
                {item.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B6F76]">
                {item.body}
              </p>
            </MailRevealItem>
          ))}
        </MailStagger>
      </div>
    </section>
  );
}
