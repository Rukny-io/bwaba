"use client";

import { Check } from "lucide-react";
import { MailReveal, MailRevealItem, MailStagger } from "@/components/marketing/mail-reveal";
import { MailWebmailPreview } from "@/components/marketing/mail-webmail-preview";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

const POINTS = [
  "Manage mail from any device with secure webmail — send as you@yourdomain.",
  "Multiply your output with Agentic Mail for faster, smarter drafts.",
  "Fix routing before it costs you: aliases, forwarders, and catch-all in one console.",
] as const;

export function MailProductivitySection() {
  return (
    <section
      id="benefits"
      className={L.sectionMist}
      aria-labelledby="productivity-heading"
    >
      <div className={L.container}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <MailReveal className="lg:order-2">
            <p className={L.eyebrow}>Productive</p>
            <h2 id="productivity-heading" className={L.sectionTitle}>
              Productive to the core
            </h2>
            <MailStagger as="ul" className="mt-6 flex flex-col gap-4 sm:mt-8" stagger={0.1}>
              {POINTS.map((point) => (
                <MailRevealItem key={point} as="li" className="flex gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center border border-[#d7ebea] bg-white text-[#02797E]">
                    <Check className="size-3.5" strokeWidth={2.4} aria-hidden />
                  </span>
                  <p className="text-[15px] leading-[1.75] text-[#4a5c5a] sm:text-base">
                    {point}
                  </p>
                </MailRevealItem>
              ))}
            </MailStagger>
          </MailReveal>

          <MailReveal delay={0.12} className="lg:order-1" y={28}>
            <MailWebmailPreview />
          </MailReveal>
        </div>
      </div>
    </section>
  );
}
