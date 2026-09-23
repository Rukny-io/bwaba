"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MailReveal } from "@/components/marketing/mail-reveal";
import { cfLayout } from "@/lib/mail-cloudflare-theme";

const LINES = [
  { prompt: "$", text: "rukny mail init --domain yourbrand.com" },
  { prompt: "→", text: "Workspace created" },
  { prompt: "→", text: "Copy these DNS records to your registrar" },
  { prompt: "  ", text: "TXT  @  v=spf1 include:amazonses.com ~all" },
  { prompt: "  ", text: "CNAME  rukny._domainkey  …" },
  { prompt: "✓", text: "sara@yourbrand.com is live" },
  { prompt: "✓", text: "First message sent" },
] as const;

export function MailHomeSetupTerminal() {
  const reduceMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(
    reduceMotion ? LINES.length : 0,
  );

  useEffect(() => {
    if (reduceMotion) {
      setVisibleCount(LINES.length);
      return;
    }

    setVisibleCount(0);
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setVisibleCount(index);
      if (index >= LINES.length) window.clearInterval(interval);
    }, 520);

    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  return (
    <section
      className="bg-[#0B0D0E] text-white"
      aria-labelledby="terminal-heading"
    >
      <div className={`${cfLayout.container} ${cfLayout.section}`}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <MailReveal>
            <p className="text-[13px] font-medium text-white/55">
              Setup in minutes
            </p>
            <h2
              id="terminal-heading"
              className={`${cfLayout.sectionTitleOnDark} mt-3 max-w-[14ch]`}
            >
              From domain to first send
            </h2>
            <p className={`${cfLayout.leadOnDark} mt-4 max-w-md`}>
              Follow the checklist, copy DNS records, invite your team. No
              separate tools for routing or verification.
            </p>
          </MailReveal>

          <MailReveal delay={0.08}>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#14181A] shadow-[0_24px_80px_-40px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span className="size-2.5 rounded-full bg-[#FF5F57]" />
                <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
                <span className="size-2.5 rounded-full bg-[#28C840]" />
                <span className="ms-2 text-[12px] text-white/45">
                  rukny — setup
                </span>
              </div>
              <div className="min-h-[220px] p-5 font-mono text-[12px] leading-[1.75] sm:text-[13px]">
                {LINES.slice(0, visibleCount).map((line, index) => (
                  <motion.div
                    key={`${line.text}-${index}`}
                    initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex gap-2"
                  >
                    <span
                      className={
                        line.prompt === "✓"
                          ? "shrink-0 text-[#F6821F]"
                          : "shrink-0 text-white/35"
                      }
                    >
                      {line.prompt}
                    </span>
                    <span
                      className={
                        line.prompt === "✓"
                          ? "text-white/90"
                          : "text-white/65"
                      }
                    >
                      {line.text}
                    </span>
                  </motion.div>
                ))}
                {!reduceMotion && visibleCount < LINES.length ? (
                  <span
                    className="mt-1 inline-block h-4 w-2 animate-pulse bg-[#F6821F]"
                    aria-hidden
                  />
                ) : null}
              </div>
            </div>
          </MailReveal>
        </div>
      </div>
    </section>
  );
}
