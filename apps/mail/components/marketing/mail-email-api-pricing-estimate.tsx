"use client";

import { cn } from "@heroui/react";
import {
  EMAIL_API_AUTOMATION,
  EMAIL_API_MARKETING_CONTACT_STOPS,
  EMAIL_API_TRANSACTIONAL_VOLUME_STOPS,
  estimateMarketingAtStop,
  estimateTransactionalAtStop,
  formatEmailApiContacts,
  formatEmailApiPlanTitle,
  formatEmailApiVolume,
} from "@rukny/email-api-pricing";
import {
  FEATURED_TRANSACTIONAL_PLANS,
  featuredPlanCopy,
  type FeaturedTransactionalPlanId,
} from "@/lib/email-api-featured-plans";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { MailAnimatedIqD } from "@/components/marketing/mail-animated-iqd";
import { MailEmailApiTierCard } from "@/components/marketing/mail-email-api-tier-card";

type EstimateMode = "transactional" | "marketing";

const EASE = [0.22, 1, 0.36, 1] as const;

const MARKETING_TIER_CARDS = [
  {
    tier: "free" as const,
    title: "Starter",
    subtitle: "Start with broadcasts",
    features: ["1,000 contacts", "Unlimited sends to contacts", "Audience segments"],
  },
  {
    tier: "pro" as const,
    title: "Growth",
    subtitle: "Growing lists",
    features: [
      "All Free features",
      "Pay by contacts stored",
      "No send cap on stored contacts",
      "Broadcast analytics",
    ],
  },
  {
    tier: "enterprise" as const,
    title: "Enterprise",
    subtitle: "150K+ contacts",
    features: ["Custom contact limits", "Priority support", "Migration assistance"],
  },
];

function formatVolumeLabel(volume: number): string {
  if (volume >= 1_000_000) {
    const m = volume / 1_000_000;
    return Number.isInteger(m) ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (volume >= 1_000) return `${Math.round(volume / 1_000)}K`;
  return volume.toLocaleString("en-IQ");
}

function EstimateTierCard({
  active,
  title,
  subtitle,
  priceAmount,
  priceUnit,
  volumeLine,
  overageLine,
  features,
  ctaHref,
  ctaLabel,
  isEnterprise,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  priceAmount: number;
  priceUnit: string;
  volumeLine: string;
  overageLine?: string | null;
  features: string[];
  ctaHref?: string;
  ctaLabel?: string;
  isEnterprise?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      layout
      transition={
        reduceMotion
          ? { duration: 0 }
          : { layout: { duration: 0.45, ease: EASE }, duration: 0.35, ease: EASE }
      }
      className="h-full"
    >
      <MailEmailApiTierCard
        surface="white"
        eyebrow={
          active ? (
            <motion.span
              layoutId="estimate-tier-badge"
              className="inline-flex rounded-full bg-[#1D1D1D] px-2.5 py-0.5 text-[10px] font-medium tracking-[0.08em] text-white uppercase"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              Recommended
            </motion.span>
          ) : (
            <span className="text-[12px] font-medium text-[#9CA3AF]">{subtitle}</span>
          )
        }
        title={title}
        priceAmount={priceAmount}
        priceUnit={priceUnit}
        volumeLine={volumeLine}
        overageLine={overageLine}
        features={features}
        ctaHref={ctaHref}
        ctaLabel={ctaLabel}
        ctaEmphasis={active}
        isEnterprise={isEnterprise}
      />
    </motion.div>
  );
}

export function MailEmailApiPricingEstimate({ startHref }: { startHref: string }) {
  const [mode, setMode] = useState<EstimateMode>("transactional");
  const [stopIndex, setStopIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  const transactionalStops = EMAIL_API_TRANSACTIONAL_VOLUME_STOPS;
  const marketingStops = EMAIL_API_MARKETING_CONTACT_STOPS;
  const maxIndex =
    mode === "transactional"
      ? transactionalStops.length - 1
      : marketingStops.length - 1;
  const safeIndex = Math.min(stopIndex, maxIndex);
  const progress = maxIndex > 0 ? (safeIndex / maxIndex) * 100 : 0;

  const transactionalEstimate = useMemo(
    () => estimateTransactionalAtStop(safeIndex),
    [safeIndex],
  );
  const marketingEstimate = useMemo(
    () => estimateMarketingAtStop(safeIndex),
    [safeIndex],
  );

  const activeTier =
    mode === "transactional" ? transactionalEstimate.tier : marketingEstimate.tier;
  const stops = mode === "transactional" ? transactionalStops : marketingStops;

  const summaryVolume =
    mode === "transactional"
      ? `${formatVolumeLabel(transactionalEstimate.stop.volume)} emails / mo`
      : formatEmailApiContacts(marketingEstimate.stop.contacts);

  const summaryPrice =
    mode === "transactional"
      ? transactionalEstimate.monthlyCostIqd
      : marketingEstimate.monthlyCostIqd;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex justify-center">
        <div
          className="relative inline-flex rounded-full bg-[#F0F0F0] p-1"
          role="tablist"
          aria-label="Pricing type"
        >
          {(
            [
              ["transactional", "Transactional emails"],
              ["marketing", "Marketing emails"],
            ] as const
          ).map(([value, label]) => {
            const selected = mode === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setMode(value);
                  setStopIndex(0);
                }}
                className={cn(
                  "relative z-10 rounded-full px-4 py-2.5 text-[13px] font-medium transition-colors duration-200",
                  selected ? "text-[#1D1D1D]" : "text-[#6B6F76] hover:text-[#1D1D1D]",
                )}
              >
                {selected && !reduceMotion ? (
                  <motion.span
                    layoutId="estimate-mode-pill"
                    className="absolute inset-0 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : selected ? (
                  <span className="absolute inset-0 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]" />
                ) : null}
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-14 px-1">
        <div className="relative mx-auto max-w-3xl">
          <div
            className="pointer-events-none absolute inset-x-0 top-[13px] h-px rounded-full bg-[#E8E8E8]"
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute top-[13px] h-px origin-left rounded-full bg-[#1D1D1D]"
            aria-hidden
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: EASE }}
          />
          <label htmlFor="email-api-volume-estimate" className="sr-only">
            {mode === "transactional" ? "Emails per month" : "Marketing contacts"}
          </label>
          <input
            id="email-api-volume-estimate"
            type="range"
            min={0}
            max={maxIndex}
            step={1}
            value={safeIndex}
            onChange={(e) => setStopIndex(Number(e.target.value))}
            className="mail-estimate-range mail-estimate-range--overlay relative z-10 w-full"
            aria-valuetext={
              mode === "transactional"
                ? `${transactionalEstimate.stop.label} emails per month`
                : `${marketingEstimate.stop.label} contacts`
            }
          />
        </div>

        <div
          className="mx-auto mt-4 flex max-w-3xl justify-between gap-0.5 px-0.5"
          aria-hidden
        >
          {stops.map((stop, index) => {
            const isActive = index === safeIndex;
            return (
              <span
                key={stop.label}
                className={cn(
                  "min-w-0 flex-1 truncate text-center text-[10px] tabular-nums transition-colors duration-200 sm:text-[11px]",
                  isActive ? "font-medium text-[#1D1D1D]" : "text-[#9CA3AF]",
                )}
              >
                {stop.label}
              </span>
            );
          })}
        </div>

        <motion.div
          key={mode}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="mx-auto mt-10 max-w-xl rounded-[1.25rem] bg-[#F0F0F0] px-6 py-4 text-center"
        >
          <p className="text-[13px] text-[#6B6F76]">
            Estimate for{" "}
            <span className="font-medium text-[#1D1D1D]">{summaryVolume}</span>
          </p>
          <p className="mt-1 flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5">
            {summaryPrice === 0 ? (
              <span className="text-[1.5rem] font-medium tracking-[-0.03em] text-[#1D1D1D]">
                Free
              </span>
            ) : (
              <>
                <MailAnimatedIqD
                  value={summaryPrice}
                  size="hero"
                  className="text-[1.5rem] font-medium tracking-[-0.03em] text-[#1D1D1D]"
                  suffix="IQD"
                  suffixClassName="text-[13px] font-medium text-[#9CA3AF]"
                />
                <span className="text-[13px] text-[#9CA3AF]">/ month</span>
              </>
            )}
          </p>
        </motion.div>
      </div>

      <LayoutGroup>
        <AnimatePresence mode="popLayout" initial={false}>
          {mode === "transactional" ? (
            <motion.div
              key="transactional-cards"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="mt-14 grid gap-4 lg:grid-cols-4"
            >
              {FEATURED_TRANSACTIONAL_PLANS.map((plan) => {
                const card = featuredPlanCopy(plan.id as FeaturedTransactionalPlanId);
                const active = transactionalEstimate.plan.id === plan.id;
                const overage = plan.overagePer1kIqd > 0 ? plan.overagePer1kIqd : null;

                return (
                  <EstimateTierCard
                    key={plan.id}
                    active={active}
                    title={formatEmailApiPlanTitle(plan)}
                    subtitle={card.taglineEn}
                    priceAmount={plan.priceMonthlyIqd}
                    priceUnit="per month"
                    volumeLine={formatEmailApiVolume(plan)}
                    overageLine={
                      overage
                        ? `Extra emails ${overage.toLocaleString("en-IQ")} IQD / 1,000`
                        : null
                    }
                    features={card.featuresEn}
                    ctaHref={startHref}
                    ctaLabel="Get started"
                  />
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="marketing-cards"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="mt-14 grid gap-4 sm:grid-cols-3"
            >
              {MARKETING_TIER_CARDS.map((card) => {
                const active = activeTier === card.tier;
                const plan = marketingEstimate.plan;
                const priceAmount =
                  active || card.tier === marketingEstimate.tier
                    ? plan.priceMonthlyIqd
                    : card.tier === "free"
                      ? 0
                      : card.tier === "pro"
                        ? 35_000
                        : 0;

                return (
                  <EstimateTierCard
                    key={card.tier}
                    active={active}
                    title={card.title}
                    subtitle={card.subtitle}
                    priceAmount={priceAmount}
                    priceUnit={
                      card.tier === "enterprise" && !active ? "Contact sales" : "per month"
                    }
                    volumeLine={
                      active
                        ? formatEmailApiContacts(plan.contactsLimit)
                        : card.tier === "free"
                          ? "1,000 contacts"
                          : card.tier === "pro"
                            ? "From 5K contacts"
                            : "150K+ contacts"
                    }
                    features={card.features}
                    ctaHref={
                      active && card.tier === "enterprise"
                        ? "mailto:support@rukny.io?subject=Email%20API%20Marketing"
                        : startHref
                    }
                    ctaLabel={
                      card.tier === "enterprise" ? "Contact sales" : "Get started"
                    }
                    isEnterprise={card.tier === "enterprise"}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>

      <p className="mt-10 text-center text-[12px] leading-relaxed text-[#9CA3AF]">
        {mode === "transactional"
          ? `Automations: ${EMAIL_API_AUTOMATION.includedRunsPerMonth.toLocaleString("en-IQ")} runs / mo included · ${EMAIL_API_AUTOMATION.overagePriceIqdPerRun} IQD / run overage on paid plans.`
          : "Marketing plans bill by contacts stored — sends are unlimited to existing contacts."}
      </p>
    </div>
  );
}
