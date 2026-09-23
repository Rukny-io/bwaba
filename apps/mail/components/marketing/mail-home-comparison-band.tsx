"use client";

import { X } from "lucide-react";
import { MailReveal, MailStagger, MailRevealItem } from "@/components/marketing/mail-reveal";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

const WITHOUT = [
  "Shared Gmail or Yahoo address",
  "Manual DNS guesswork",
  "Aliases scattered across tools",
  "Looks temporary to clients",
] as const;

const WITH = [
  "you@yourdomain on every message",
  "Step-by-step DNS checklist",
  "Mailboxes, aliases, forwards in one place",
  "Professional from day one",
] as const;

export function MailHomeComparisonBand() {
  return (
    <section
      className="scroll-mt-24 border-t border-[#e8e8e8] bg-[#fafafa]"
      aria-labelledby="comparison-heading"
    >
      <div className={L.container}>
        <div className="py-14 md:py-20">
          <MailReveal>
            <p className={L.eyebrow}>Why choose Rukny</p>
            <h2
              id="comparison-heading"
              className="max-w-2xl text-[1.75rem] font-bold leading-[1.1] tracking-[-0.035em] text-[#111111] sm:text-[2.25rem]"
            >
              Stop fighting shared inboxes. Start shipping as yourself.
            </h2>
          </MailReveal>

          <div className="mt-10 grid gap-px overflow-hidden border border-[#e8e8e8] bg-[#e8e8e8] md:grid-cols-2">
            <MailReveal delay={0.05}>
              <div className="h-full bg-white p-6 sm:p-8">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#888888] uppercase">
                  Without Rukny
                </p>
                <MailStagger as="ul" className="mt-6 space-y-4" stagger={0.06}>
                  {WITHOUT.map((item) => (
                    <MailRevealItem key={item} as="li" className="flex gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-[#999999]">
                        <X className="size-3" strokeWidth={2.5} aria-hidden />
                      </span>
                      <span className="text-[14px] leading-relaxed text-[#666666]">
                        {item}
                      </span>
                    </MailRevealItem>
                  ))}
                </MailStagger>
              </div>
            </MailReveal>

            <MailReveal delay={0.1}>
              <div className="h-full bg-[#111111] p-6 text-white sm:p-8">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-white/45 uppercase">
                  With Rukny Mail
                </p>
                <MailStagger as="ul" className="mt-6 space-y-4" stagger={0.06}>
                  {WITH.map((item) => (
                    <MailRevealItem key={item} as="li" className="flex gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                        <span className="text-[11px] font-bold" aria-hidden>
                          ✓
                        </span>
                      </span>
                      <span className="text-[14px] leading-relaxed text-[#d4d4d4]">
                        {item}
                      </span>
                    </MailRevealItem>
                  ))}
                </MailStagger>
              </div>
            </MailReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
