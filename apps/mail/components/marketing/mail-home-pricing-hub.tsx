"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@heroui/react";
import { MailReveal, MailRevealItem } from "@/components/marketing/mail-reveal";
import {
  formatMailIqD,
  listMailPlans,
  type MailPlanDefinition,
} from "@/lib/mail-plans";
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

function PlanCard({
  plan,
  highlight,
}: {
  plan: MailPlanDefinition;
  highlight?: string;
}) {
  return (
    <div
      className={cn(
        cfLayout.card,
        "flex h-full flex-col",
        plan.popular && "border-[#F6821F] ring-2 ring-[#F6821F]/20",
      )}
    >
      {plan.popular ? (
        <p className="mb-3 inline-flex w-fit rounded-full bg-[#FFF4EB] px-2.5 py-0.5 text-[11px] font-semibold text-[#C2410C]">
          Most popular
        </p>
      ) : (
        <span className="mb-3 block h-5" aria-hidden />
      )}
      <h3 className="text-[16px] font-semibold">{plan.name}</h3>
      <p className="mt-1 text-[13px] text-[#6B6F76]">{plan.bestFor}</p>
      <p className="mt-5 text-[2rem] font-semibold tabular-nums tracking-[-0.04em]">
        {formatMailIqD(plan.priceMonthly)}
        <span className="text-[14px] font-medium text-[#6B6F76]">/mo</span>
      </p>
      {highlight ? (
        <p className="mt-3 text-[14px] leading-relaxed text-[#6B6F76]">
          {highlight}
        </p>
      ) : null}
      <Link
        href="/pricing"
        className="mt-auto inline-flex items-center gap-1 pt-6 text-[14px] font-semibold text-[#F6821F] transition-opacity hover:opacity-80"
      >
        View plan
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}

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

function TabPanel({
  tab,
  plans,
}: {
  tab: PricingTab;
  plans: MailPlanDefinition[];
}) {
  if (tab === "mailboxes") {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <MailRevealItem key={plan.id}>
            <PlanCard
              plan={plan}
              highlight={`${plan.limits.mailboxesIncluded} mailbox${plan.limits.mailboxesIncluded > 1 ? "es" : ""} · ${plan.limits.storageGbPerMailbox} GB each`}
            />
          </MailRevealItem>
        ))}
      </div>
    );
  }

  if (tab === "sending") {
    const sending = [
      { plan: plans[0], volume: "5,000 outbound / mo" },
      { plan: plans[1], volume: "25,000 outbound / mo" },
      { plan: plans[2], volume: "100,000 outbound / mo" },
    ];
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {sending.map(({ plan, volume }) => (
          <MailRevealItem key={plan.id}>
            <PlanCard plan={plan} highlight={volume} />
          </MailRevealItem>
        ))}
      </div>
    );
  }

  const workspace = [
    { plan: plans[0], highlight: "Solo inbox · 10 aliases · Agentic drafts" },
    { plan: plans[1], highlight: "3 seats · Open tracking · Smart replies" },
    {
      plan: plans[2],
      highlight: "5 seats · Premium delivery · Unlimited aliases",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {workspace.map(({ plan, highlight }) => (
        <MailRevealItem key={plan.id}>
          <PlanCard plan={plan} highlight={highlight} />
        </MailRevealItem>
      ))}
    </div>
  );
}

export function MailHomePricingHub() {
  const [tab, setTab] = useState<PricingTab>("mailboxes");
  const plans = listMailPlans();

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
          <TabPanel tab={tab} plans={plans} />
        </div>

        <DeliveryDiagram />

        <MailReveal delay={0.08}>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {[
              "Anti-spam on every plan",
              "2FA per mailbox",
              "No credit card for Starter",
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
