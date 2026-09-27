"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@heroui/react";
import { MailReveal } from "@/components/marketing/mail-reveal";
import { cfLayout } from "@/lib/mail-cloudflare-theme";

type PricingTab = "mailboxes" | "sending" | "workspace";

const TABS: { id: PricingTab; label: string }[] = [
  { id: "mailboxes", label: "Mailboxes" },
  { id: "sending", label: "Sending" },
  { id: "workspace", label: "Workspace" },
];

const DELIVERY_STEPS = [
  { label: "Sender", detail: "you@yourdomain.com" },
  { label: "SPF", detail: "Authorized" },
  { label: "DKIM", detail: "Signed" },
  { label: "Inbox", detail: "Delivered" },
] as const;

function DeliveryDiagram() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="mt-10 rounded-2xl border border-[#E4E4E7] bg-[#F6F6F4] p-6 sm:p-8"
      aria-label="How mail reaches the inbox"
    >
      <p className="mb-6 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6B6F76]">
        Same trusted path at every tier
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {DELIVERY_STEPS.map((step, index) => (
          <div key={step.label} className="flex flex-1 items-center gap-3 sm:flex-col sm:gap-2">
            <div className="flex w-full flex-col items-start sm:items-center">
              <div className="flex h-12 w-full max-w-[9rem] items-center justify-center rounded-xl bg-white text-[13px] font-semibold shadow-sm sm:max-w-none">
                {step.label}
              </div>
              <p className="mt-2 text-[12px] text-[#6B6F76] sm:text-center">
                {step.detail}
              </p>
            </div>
            {index < DELIVERY_STEPS.length - 1 ? (
              reduceMotion ? (
                <span className="hidden text-[#D4D4D8] sm:inline" aria-hidden>
                  →
                </span>
              ) : (
                <motion.span
                  className="hidden text-[#F6821F] sm:inline"
                  aria-hidden
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.35,
                  }}
                >
                  →
                </motion.span>
              )
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function TabPanel({ tab }: { tab: PricingTab }) {
  if (tab === "mailboxes") {
    return (
      <div className={cn(cfLayout.card, "p-6 sm:p-8")}>
        <h3 className="text-[16px] font-semibold">Free · Growth · Enterprise</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-[#6B6F76]">
          One monthly plan covers hosted mailboxes, transactional API sends, domains,
          and automations. Start free with 3,000 emails per month.
        </p>
        <Link
          href="/pricing"
          className="mt-6 inline-flex items-center gap-1 text-[14px] font-semibold text-[#F6821F]"
        >
          View unified pricing
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    );
  }

  if (tab === "sending") {
    return (
      <div className={cn(cfLayout.card, "p-6 sm:p-8")}>
        <h3 className="text-[16px] font-semibold">Shared email quota</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-[#6B6F76]">
          Mailbox sends and transactional API calls draw from the same monthly
          pool — from 3,000 on Free up to 100,000+ on paid tiers.
        </p>
        <Link
          href="/pricing"
          className="mt-6 inline-flex items-center gap-1 text-[14px] font-semibold text-[#F6821F]"
        >
          See sending tiers
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className={cn(cfLayout.card, "p-6 sm:p-8")}>
      <h3 className="text-[16px] font-semibold">Workspace limits by tier</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-[#6B6F76]">
        Free includes 1 mailbox and 3 domains. Growth adds team seats and more
        mailboxes. Enterprise unlocks premium delivery and advanced security.
      </p>
      <Link
        href="/pricing"
        className="mt-6 inline-flex items-center gap-1 text-[14px] font-semibold text-[#F6821F]"
      >
        Compare workspace limits
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}

export function MailHomePricingHub() {
  const [tab, setTab] = useState<PricingTab>("mailboxes");

  return (
    <section
      id="pricing"
      className="scroll-mt-24 bg-white"
      aria-labelledby="pricing-hub-heading"
    >
      <div className={`${cfLayout.container} ${cfLayout.section}`}>
        <MailReveal>
          <h2 id="pricing-hub-heading" className={`${cfLayout.sectionTitle} max-w-[16ch]`}>
            Pay only for the mail you need
          </h2>
          <p className={`${cfLayout.lead} mt-4 max-w-[40rem]`}>
            (Not to keep shared inboxes warm.)
          </p>
          <p className="mt-3 max-w-[40rem] text-[15px] leading-relaxed text-[#6B6F76]">
            Simple monthly billing in IQD — same delivery path on every plan,
            more depth as you grow.
          </p>
        </MailReveal>

        <MailReveal delay={0.06}>
          <div
            className="mt-8 inline-flex flex-wrap gap-1 rounded-full border border-[#E4E4E7] bg-[#F6F6F4] p-1"
            role="tablist"
            aria-label="Pricing categories"
          >
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium transition-colors",
                  tab === item.id
                    ? "bg-white text-[#1D1D1D] shadow-sm"
                    : "text-[#6B6F76] hover:text-[#1D1D1D]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </MailReveal>

        <div className="mt-8" role="tabpanel">
          <TabPanel tab={tab} />
        </div>

        <DeliveryDiagram />

        <MailReveal delay={0.08}>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {[
              "Anti-spam on every plan",
              "2FA per mailbox",
              "Free after DNS verification",
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 text-[13px] text-[#6B6F76]"
              >
                <Check className="size-3.5 shrink-0 text-[#F6821F]" aria-hidden />
                {item}
              </span>
            ))}
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#F6821F] transition-opacity hover:opacity-80"
            >
              Full comparison
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </MailReveal>
      </div>
    </section>
  );
}
