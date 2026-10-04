"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@heroui/react";
import { agLayout } from "@/lib/mail-antigravity-theme";
import {
  getMailCustomPricingPlan,
  listMailPlans,
  mailPlanHighlights,
  MAIL_ANNUAL_DISCOUNT_PERCENT,
  type MailBillingPeriod,
  type MailPlanDefinition,
} from "@/lib/mail-plans";
import {
  MailPricingPlanCard,
  type MailPricingCardPlan,
} from "./mail-pricing-plan-card";
import { MailOutboundPacksSection } from "./mail-outbound-packs-section";

const TRUST_PILLS = [
  "Webmail & calendar",
  "DNS verification",
  "Anti-spam",
  "2FA",
  "Separate from Email API",
] as const;

const FAQ_ITEMS = [
  {
    question: "Is Rukny Mail separate from Email API?",
    answer:
      "Yes. Mail is hosted business email on your domain (mailboxes, webmail, DNS). Email API is a developer product for transactional sends via HTTP API.",
  },
  {
    question: "When does the Free plan activate?",
    answer:
      "Automatically after you verify your domain DNS — no checkout or card required.",
  },
  {
    question: "What is the difference between monthly and yearly billing?",
    answer: `Yearly billing saves about ${MAIL_ANNUAL_DISCOUNT_PERCENT}% compared to paying monthly, charged as one payment for the full year.`,
  },
  {
    question: "How do outbound packs work?",
    answer:
      "Starter and Professional include a monthly send quota. When you need more, buy 1,000-email packs for 800 IQD each from billing settings.",
  },
  {
    question: "What currency are prices in?",
    answer: "All prices are in Iraqi dinar (IQD).",
  },
  {
    question: "Who is the Custom plan for?",
    answer:
      "Organizations that need unlimited mailboxes and domains, higher storage per seat, custom outbound volume, and a dedicated support relationship. We quote based on your scale and requirements.",
  },
] as const;

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <ChevronDown
      aria-hidden
      className={cn(
        "size-4 shrink-0 text-[#9CA3AF] transition-transform duration-300",
        open && "rotate-180",
      )}
    />
  );
}

function BillingToggle({
  period,
  onChange,
}: {
  period: MailBillingPeriod;
  onChange: (p: MailBillingPeriod) => void;
}) {
  return (
    <div
      className="inline-flex max-w-full rounded-full bg-[#F5F5F5] p-1"
      role="group"
      aria-label="Billing cycle"
    >
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={cn(
          "min-h-9 rounded-full px-5 py-2 text-[13px] font-medium transition-colors duration-300",
          period === "monthly" ? "bg-[#1D1D1D] text-white" : "text-[#6B6F76] hover:text-[#1D1D1D]",
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("yearly")}
        className={cn(
          "flex min-h-9 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-300 sm:px-5",
          period === "yearly" ? "bg-[#1D1D1D] text-white" : "text-[#6B6F76] hover:text-[#1D1D1D]",
        )}
      >
        Yearly
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            period === "yearly" ? "bg-white/15 text-white" : "bg-[#EBEBEB] text-[#6B6F76]",
          )}
        >
          −{MAIL_ANNUAL_DISCOUNT_PERCENT}%
        </span>
      </button>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#EBEBEB] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-start sm:py-5"
      >
        <span className="text-[14px] font-medium text-[#1D1D1D] sm:text-[15px]">
          {question}
        </span>
        <ChevronIcon open={open} />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300",
          open ? "grid-rows-[1fr] pb-4 opacity-100 sm:pb-5" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p className="text-start text-[13px] leading-relaxed text-[#6B6F76] sm:text-sm">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

function toCardPlan(
  plan: MailPlanDefinition,
  signedIn: boolean,
): MailPricingCardPlan {
  const consoleHref = signedIn ? "/apps" : "/login";
  return {
    cardId: plan.id,
    name: plan.name,
    bestFor: plan.bestFor,
    priceMonthly: plan.priceMonthly,
    monthlyOutbound: plan.monthlyOutbound,
    popular: plan.popular,
    badge: plan.popular ? "Most popular" : undefined,
    ctaLabel:
      plan.id === "free"
        ? "Get started"
        : signedIn
          ? "Upgrade in console"
          : "Start with Mail",
    ctaHref: plan.id === "free" ? "/apps" : consoleHref,
    highlights: [
      ...mailPlanHighlights(plan),
      `${plan.monthlyOutbound.toLocaleString("en-IQ")} outbound emails / mo`,
    ],
  };
}

function buildPlans(signedIn: boolean): MailPricingCardPlan[] {
  const selfServe = listMailPlans().map((plan) => toCardPlan(plan, signedIn));

  const customCatalog = getMailCustomPricingPlan();
  const custom: MailPricingCardPlan = {
    cardId: "custom",
    name: customCatalog.name,
    bestFor: customCatalog.bestFor,
    priceMonthly: 0,
    monthlyOutbound: 0,
    badge: "Enterprise",
    enterprise: true,
    contactSales: true,
    priceLabel: "Let's talk",
    priceSubLabel: "Volume pricing",
    ctaLabel: "Contact sales",
    ctaHref:
      "mailto:support@rukny.io?subject=Rukny%20Mail%20Custom%20plan&body=Tell%20us%20about%20your%20team%20size%2C%20domains%2C%20and%20monthly%20send%20volume.",
    footnote: "Response within 1 business day",
    highlights: customCatalog.highlights,
  };

  return [...selfServe, custom];
}

export function MailPricingView({ signedIn }: { signedIn: boolean }) {
  const [period, setPeriod] = useState<MailBillingPeriod>("monthly");
  const plans = useMemo(() => buildPlans(signedIn), [signedIn]);

  return (
    <div className={cn(agLayout.container, "pb-14 sm:pb-16")}>
      <header className="pt-8 text-center sm:pt-12 md:pt-14">
        <p className={agLayout.eyebrow}>Transparent pricing</p>
        <h1 className={`${agLayout.sectionTitle} mt-3 text-[clamp(1.75rem,5vw,2.75rem)]`}>
          Hosted mail plans
          <span className="text-[#9CA3AF]"> for your domain</span>
        </h1>
        <p className={`${agLayout.lead} mx-auto mt-4 max-w-xl text-[15px] sm:mt-5`}>
          Business email separate from the Email API — start free after DNS verification,
          upgrade when your team grows.
        </p>
        <div className="mt-6 flex justify-center sm:mt-7">
          <BillingToggle period={period} onChange={setPeriod} />
        </div>
      </header>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:mt-6">
        {TRUST_PILLS.map((item) => (
          <span
            key={item}
            className="rounded-full bg-[#F5F5F5] px-2.5 py-1 text-[11px] font-medium text-[#6B6F76]"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="mt-6 sm:mt-8" data-testid="MailPricingOptions">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
          {plans.map((plan) => (
            <MailPricingPlanCard
              key={plan.cardId}
              plan={plan}
              period={period}
            />
          ))}
        </div>
      </div>

      <MailOutboundPacksSection />

      <section className="mt-12 sm:mt-16" aria-labelledby="mail-faq-heading">
        <div className="mb-5 text-center sm:mb-6">
          <p className={agLayout.eyebrow}>Help</p>
          <h2
            id="mail-faq-heading"
            className="mt-3 text-xl font-medium tracking-[-0.02em] text-[#1D1D1D] sm:text-2xl"
          >
            Frequently asked questions
          </h2>
        </div>
        <div className="mx-auto max-w-2xl overflow-hidden rounded-[1.5rem] bg-[#FAFAFA] px-4 sm:px-6">
          {FAQ_ITEMS.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>
    </div>
  );
}
