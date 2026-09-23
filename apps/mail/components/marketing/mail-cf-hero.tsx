"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { MailSplitWords } from "@/components/marketing/mail-motion-kit";
import { MailHeroSignal } from "@/components/marketing/mail-hero-signal";
import { cfLayout } from "@/lib/mail-cloudflare-theme";

export function MailCfHero({
  primaryHref,
  primaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="relative isolate min-h-[100svh] overflow-hidden bg-[#0B0D0E] text-white"
      aria-labelledby="cf-hero-title"
    >
      {/* Mesh gradients — Cloudflare video fallback */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {!reduceMotion ? (
          <>
            <motion.div
              className="absolute -top-24 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(246,130,31,0.22),transparent_62%)] blur-3xl"
              animate={{ opacity: [0.45, 0.7, 0.45], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-0 left-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(120,180,255,0.16),transparent_65%)] blur-3xl"
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-1/3 right-0 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(246,130,31,0.12),transparent_65%)] blur-3xl"
              animate={{ x: [0, -24, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(246,130,31,0.15),transparent_60%)]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,#0B0D0E_100%)]" />
      </div>

      {/* Globe — centered behind copy like Cloudflare Region hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[38%] z-0 mx-auto max-w-[900px] opacity-90 md:top-[32%]"
      >
        <MailHeroSignal className="mx-auto scale-[1.08] md:scale-[1.2]" />
      </div>

      <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-5 pb-20 pt-[7.5rem] text-center sm:px-8">
        <p className="mb-5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[12px] font-medium tracking-[0.02em] text-white/75 backdrop-blur-sm">
          Rukny Mail · Business email on your domain
        </p>

        <MailSplitWords
          as="h1"
          text="Everything we learned from running mail at scale—yours by default"
          className={`${cfLayout.heroTitle} mx-auto max-w-[14ch] sm:max-w-[16ch] md:max-w-[18ch]`}
        />
        <span id="cf-hero-title" className="sr-only">
          Rukny Mail hero
        </span>

        <p className="mx-auto mt-6 max-w-[42rem] text-balance text-[16px] leading-[1.65] text-white/70 sm:text-[18px]">
          One workspace for your team, your domain, and your brand. Send,
          receive, and grow without juggling shared inboxes.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href={primaryHref} className={cfLayout.btnPrimary}>
            {primaryLabel}
          </Link>
          <Link href="/pricing" className={cfLayout.btnSecondary}>
            View pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
