"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@heroui/react";
import { MailAnimatedIqD } from "@/components/marketing/mail-animated-iqd";
import { MailReveal } from "@/components/marketing/mail-reveal";
import {
  estimateAllPlans,
  estimateMailMonthlyCost,
  formatEstimateIqD,
  formatOutboundLabel,
  MAIL_ESTIMATE_INCLUDED_OUTBOUND,
  MAIL_ESTIMATE_MAILBOX_MAX,
  MAIL_ESTIMATE_MAILBOX_MIN,
  MAIL_ESTIMATE_OUTBOUND_MAX,
  MAIL_ESTIMATE_OUTBOUND_MIN,
  MAIL_ESTIMATE_PACK_EMAILS,
  MAIL_ESTIMATE_PACK_PRICE_IQD,
  MAIL_ESTIMATE_VOLUME_PRESETS,
  recommendMailPlan,
  type MailEstimateFeatureNeeds,
} from "@/lib/mail-estimate-catalog";
import {
  formatMailIqD,
  getMailCustomPricingPlan,
  listMailPlans,
  MAIL_ANNUAL_DISCOUNT_PERCENT,
  mailYearlyPrice,
  type MailBillingPeriod,
  type MailPlanId,
} from "@/lib/mail-plans";
import { agLayout } from "@/lib/mail-antigravity-theme";

function formatCount(n: number): string {
  return n.toLocaleString("en-IQ");
}

const fieldClass =
  "w-full rounded-xl border border-[#E8E8E8] bg-white px-3.5 py-2.5 text-sm tabular-nums text-[#1D1D1D] outline-none transition-colors focus:border-[#1D1D1D]";

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

export function MailPricingEstimate({ signedIn }: { signedIn: boolean }) {
  const plans = listMailPlans();
  const customPlan = getMailCustomPricingPlan();
  const [period, setPeriod] = useState<MailBillingPeriod>("monthly");
  const [planId, setPlanId] = useState<MailPlanId>("free");
  const [autoRecommend, setAutoRecommend] = useState(true);
  const [mailboxes, setMailboxes] = useState(1);
  const [monthlyOutbound, setMonthlyOutbound] = useState(1_000);
  const [features, setFeatures] = useState<MailEstimateFeatureNeeds>({
    openTracking: false,
    linkAndFileTracking: false,
    premiumDelivery: false,
  });

  const recommended = useMemo(
    () =>
      recommendMailPlan({
        mailboxes,
        monthlyOutbound,
        features,
      }),
    [mailboxes, monthlyOutbound, features],
  );

  useEffect(() => {
    if (autoRecommend) setPlanId(recommended);
  }, [autoRecommend, recommended]);

  const estimate = useMemo(
    () =>
      estimateMailMonthlyCost({
        planId,
        mailboxes,
        monthlyOutbound,
      }),
    [planId, mailboxes, monthlyOutbound],
  );

  const allEstimates = useMemo(
    () => estimateAllPlans({ mailboxes, monthlyOutbound }),
    [mailboxes, monthlyOutbound],
  );

  const basePlanCharge =
    period === "yearly"
      ? mailYearlyPrice(estimate.basePlanCost)
      : estimate.basePlanCost;
  const displayTotal = basePlanCharge + estimate.extraSeatsCost + estimate.volumeCost;

  const ctaHref = signedIn
    ? planId === "free"
      ? "/apps"
      : "/billing"
    : planId === "free"
      ? "/apps"
      : "/login?next=/billing";

  const ctaLabel = signedIn
    ? planId === "free"
      ? "Open console"
      : "Open billing"
    : planId === "free"
      ? "Get started free"
      : "Get started";

  return (
    <main className="overflow-x-clip bg-white pt-14 text-[#1D1D1D]">
      <div className={cn(agLayout.container, "pb-14 sm:pb-16")}>
        <header className="pt-8 text-center sm:pt-10 md:pt-12">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#6B6F76] transition-colors hover:text-[#1D1D1D]"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Pricing
          </Link>
          <p className={`${agLayout.eyebrow} mt-5 sm:mt-6`}>Cost estimator</p>
          <h1 className={`${agLayout.sectionTitle} mt-3 text-[clamp(1.75rem,5vw,2.75rem)]`}>
            Estimate your Mail bill
            <span className="text-[#9CA3AF]"> in IQD</span>
          </h1>
          <p className={`${agLayout.lead} mx-auto mt-4 max-w-xl text-[15px] sm:mt-5`}>
            Mailboxes, included outbound, and prepaid send packs — the same numbers
            Billing and checkout use on Free, Starter, and Professional.
          </p>
          <div className="mt-6 flex justify-center sm:mt-7">
            <BillingToggle period={period} onChange={setPeriod} />
          </div>
        </header>

        <section className="mt-8 rounded-[1.5rem] bg-[#FAFAFA] p-4 sm:mt-10 sm:p-6">
          <div className="mb-4 flex flex-col gap-1 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-medium tracking-tight text-[#1D1D1D] sm:text-lg">
                Plans at a glance
              </h2>
              <p className="mt-1 text-sm text-[#6B6F76]">
                Included outbound, seat price, and extra mailbox rate.
              </p>
            </div>
            <p className="text-xs text-[#9CA3AF]">
              Outbound packs: {formatMailIqD(MAIL_ESTIMATE_PACK_PRICE_IQD)} / 1,000 on
              Starter & Professional
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {plans.map((plan) => {
              const active = planId === plan.id;
              const included = MAIL_ESTIMATE_INCLUDED_OUTBOUND[plan.id];
              const packsAvailable = plan.id !== "free";
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    setAutoRecommend(false);
                    setPlanId(plan.id);
                    setMonthlyOutbound(included);
                    setMailboxes(plan.limits.mailboxesIncluded);
                  }}
                  className={cn(
                    "rounded-[1.25rem] p-4 text-left transition-shadow sm:p-5",
                    active
                      ? plan.popular
                        ? "bg-[#1D1D1D] text-white shadow-[0_12px_40px_-16px_rgba(0,0,0,0.25)]"
                        : "bg-white shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)] ring-1 ring-[#1D1D1D]"
                      : "bg-white hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{plan.name}</p>
                    {plan.popular ? (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          active ? "bg-white/15 text-white" : "bg-[#1D1D1D] text-white",
                        )}
                      >
                        Popular
                      </span>
                    ) : plan.id === "free" ? (
                      <span className="shrink-0 rounded-full bg-[#F5F5F5] px-2 py-0.5 text-[10px] font-medium text-[#6B6F76]">
                        DNS only
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-xl font-medium tracking-tight sm:text-2xl">
                    {plan.priceMonthly === 0 ? "Free" : formatMailIqD(plan.priceMonthly)}
                    {plan.priceMonthly > 0 ? (
                      <span
                        className={cn(
                          "ms-1 text-sm font-normal",
                          active && plan.popular ? "text-white/55" : "text-[#9CA3AF]",
                        )}
                      >
                        /mo
                      </span>
                    ) : null}
                  </p>
                  <p
                    className={cn(
                      "mt-1 line-clamp-2 text-xs",
                      active && plan.popular ? "text-white/65" : "text-[#6B6F76]",
                    )}
                  >
                    {plan.bestFor}
                  </p>
                  <dl
                    className={cn(
                      "mt-4 space-y-1.5 border-t pt-3 text-xs",
                      active && plan.popular ? "border-white/15 text-white/70" : "border-[#EBEBEB] text-[#6B6F76]",
                    )}
                  >
                    <div className="flex justify-between gap-2">
                      <dt>Mailboxes</dt>
                      <dd className="shrink-0 font-medium">{plan.limits.mailboxesIncluded} included</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Extra mailbox</dt>
                      <dd className="shrink-0 font-medium">
                        {plan.priceExtraMailbox > 0
                          ? formatMailIqD(plan.priceExtraMailbox)
                          : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Outbound included</dt>
                      <dd className="shrink-0 font-medium">{formatCount(included)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Outbound packs</dt>
                      <dd className="shrink-0 font-medium">
                        {packsAvailable ? formatMailIqD(MAIL_ESTIMATE_PACK_PRICE_IQD) : "Upgrade"}
                      </dd>
                    </div>
                  </dl>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8 sm:mt-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-10">
            <div className="order-2 space-y-5 sm:space-y-6 lg:order-1">
              <div className="rounded-[1.25rem] bg-[#FAFAFA] p-4 sm:p-6">
                <p className={agLayout.eyebrow}>Volume</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {MAIL_ESTIMATE_VOLUME_PRESETS.map((preset) => {
                    const active = monthlyOutbound === preset.emails;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setMonthlyOutbound(preset.emails)}
                        className={cn(
                          "min-h-9 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-[#1D1D1D] text-white"
                            : "bg-white text-[#6B6F76] hover:text-[#1D1D1D]",
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <label htmlFor="outbound-input" className="text-sm font-medium text-[#1D1D1D]">
                      Outbound emails / month
                    </label>
                    <input
                      id="outbound-input"
                      type="number"
                      inputMode="numeric"
                      min={MAIL_ESTIMATE_OUTBOUND_MIN}
                      max={MAIL_ESTIMATE_OUTBOUND_MAX}
                      step={100}
                      value={monthlyOutbound}
                      onChange={(e) =>
                        setMonthlyOutbound(
                          Math.min(
                            MAIL_ESTIMATE_OUTBOUND_MAX,
                            Math.max(
                              MAIL_ESTIMATE_OUTBOUND_MIN,
                              Math.floor(Number(e.target.value)) || MAIL_ESTIMATE_OUTBOUND_MIN,
                            ),
                          ),
                        )
                      }
                      className={cn(fieldClass, "mt-2")}
                    />
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="mailbox-input" className="text-sm font-medium text-[#1D1D1D]">
                      Mailboxes
                    </label>
                    <input
                      id="mailbox-input"
                      type="number"
                      inputMode="numeric"
                      min={MAIL_ESTIMATE_MAILBOX_MIN}
                      max={MAIL_ESTIMATE_MAILBOX_MAX}
                      value={mailboxes}
                      onChange={(e) =>
                        setMailboxes(
                          Math.min(
                            MAIL_ESTIMATE_MAILBOX_MAX,
                            Math.max(
                              MAIL_ESTIMATE_MAILBOX_MIN,
                              Math.floor(Number(e.target.value)) || 1,
                            ),
                          ),
                        )
                      }
                      className={cn(fieldClass, "mt-2")}
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={MAIL_ESTIMATE_OUTBOUND_MIN}
                  max={MAIL_ESTIMATE_OUTBOUND_MAX}
                  step={100}
                  value={monthlyOutbound}
                  onChange={(e) => setMonthlyOutbound(Number(e.target.value))}
                  className="mail-estimate-range mt-5 w-full"
                  aria-label="Outbound emails per month"
                />
                <p className="mt-2 text-xs leading-relaxed text-[#9CA3AF]">
                  {formatCount(MAIL_ESTIMATE_OUTBOUND_MIN)} –{" "}
                  {formatCount(MAIL_ESTIMATE_OUTBOUND_MAX)} emails · up to{" "}
                  {MAIL_ESTIMATE_MAILBOX_MAX} mailboxes
                </p>
              </div>

              <div className="rounded-[1.25rem] bg-[#FAFAFA] p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[#1D1D1D]">Selected plan</p>
                  <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-xs text-[#6B6F76]">
                    <input
                      type="checkbox"
                      checked={autoRecommend}
                      onChange={(e) => setAutoRecommend(e.target.checked)}
                      className="size-3.5 accent-[#1D1D1D]"
                    />
                    Auto-pick cheapest
                  </label>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {plans.map((plan) => {
                    const active = planId === plan.id;
                    const isRec = recommended === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => {
                          setAutoRecommend(false);
                          setPlanId(plan.id);
                        }}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors",
                          active
                            ? "bg-[#1D1D1D] text-white"
                            : "bg-white text-[#1D1D1D] hover:bg-[#F5F5F5]",
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                          <span className="text-sm font-medium">{plan.name}</span>
                          {isRec ? (
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                active ? "bg-white/15 text-white" : "bg-[#F5F5F5] text-[#6B6F76]",
                              )}
                            >
                              Best
                            </span>
                          ) : null}
                        </div>
                        <p
                          className={cn(
                            "shrink-0 text-xs",
                            active ? "text-white/65" : "text-[#9CA3AF]",
                          )}
                        >
                          {formatCount(MAIL_ESTIMATE_INCLUDED_OUTBOUND[plan.id])} incl.
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1.25rem] bg-[#FAFAFA] p-4 sm:p-6">
                <p className="text-sm font-medium text-[#1D1D1D]">
                  Features that require Professional
                </p>
                <ul className="mt-3 space-y-2">
                  {(
                    [
                      {
                        key: "openTracking" as const,
                        label: "Open tracking",
                      },
                      {
                        key: "linkAndFileTracking" as const,
                        label: "Link and file tracking",
                      },
                      {
                        key: "premiumDelivery" as const,
                        label: "Premium email delivery",
                      },
                    ] as const
                  ).map((item) => (
                    <li key={item.key}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white px-3.5 py-3">
                        <input
                          type="checkbox"
                          checked={features[item.key]}
                          onChange={(e) =>
                            setFeatures((prev) => ({
                              ...prev,
                              [item.key]: e.target.checked,
                            }))
                          }
                          className="mt-0.5 size-3.5 shrink-0 accent-[#1D1D1D]"
                        />
                        <span className="text-sm font-medium text-[#1D1D1D]">{item.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-relaxed text-[#9CA3AF]">
                  Starter includes{" "}
                  {plans.find((p) => p.id === "starter")?.limits.consoleMembersIncluded ?? 2}{" "}
                  console members; Professional includes{" "}
                  {plans.find((p) => p.id === "professional")?.limits.consoleMembersIncluded ?? 5}.
                </p>
              </div>
            </div>

            <aside className="order-1 lg:sticky lg:top-20 lg:order-2">
              <div className="overflow-hidden rounded-[1.5rem] bg-[#FAFAFA]">
                <div className="border-b border-[#EBEBEB] px-4 py-4 sm:px-6 sm:py-5">
                  <p className={agLayout.eyebrow}>Estimated total</p>
                  <p className="mt-2 text-[1.75rem] font-medium tracking-[-0.02em] text-[#1D1D1D] sm:text-4xl">
                    <MailAnimatedIqD
                      value={displayTotal}
                      size="hero"
                      suffix={period === "yearly" ? "/yr" : "/mo"}
                      suffixClassName="ms-0.5 text-sm font-medium text-[#9CA3AF] sm:text-base"
                    />
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#6B6F76]">
                    {estimate.planName} · {formatCount(estimate.mailboxes)} mailbox
                    {estimate.mailboxes === 1 ? "" : "es"} ·{" "}
                    {formatOutboundLabel(estimate.monthlyOutbound)} outbound
                  </p>
                  {period === "yearly" && estimate.basePlanCost > 0 ? (
                    <p className="mt-1 text-xs text-[#9CA3AF]">
                      ≈ {formatEstimateIqD(Math.round(displayTotal / 12))} / mo equivalent
                    </p>
                  ) : null}
                </div>

                <dl className="space-y-3 border-b border-[#EBEBEB] px-4 py-4 text-sm sm:px-6 sm:py-5">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="min-w-0 text-[#6B6F76]">
                      Base plan ({estimate.planName})
                      {period === "yearly" ? (
                        <span className="mt-0.5 block text-xs text-[#9CA3AF]">Annual billing</span>
                      ) : null}
                    </dt>
                    <dd className="shrink-0 font-medium tabular-nums text-[#1D1D1D]">
                      <MailAnimatedIqD value={basePlanCharge} delay={0.04} />
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="min-w-0 text-[#6B6F76]">
                      Extra mailboxes
                      {estimate.extraMailboxes > 0 ? (
                        <span className="mt-0.5 block text-xs text-[#9CA3AF]">
                          {estimate.extraMailboxes} × {formatEstimateIqD(estimate.extraMailboxUnit)} / mo
                        </span>
                      ) : null}
                    </dt>
                    <dd className="shrink-0 font-medium tabular-nums text-[#1D1D1D]">
                      <MailAnimatedIqD value={estimate.extraSeatsCost} delay={0.08} />
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="min-w-0 text-[#6B6F76]">
                      Outbound packs
                      {estimate.packThousands > 0 ? (
                        <span className="mt-0.5 block text-xs text-[#9CA3AF]">
                          {estimate.packThousands} × {formatEstimateIqD(estimate.packPriceIqd)}
                        </span>
                      ) : null}
                    </dt>
                    <dd className="shrink-0 font-medium tabular-nums text-[#1D1D1D]">
                      <MailAnimatedIqD value={estimate.volumeCost} delay={0.12} />
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 border-t border-[#EBEBEB] pt-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <dt className="text-[#6B6F76]">Quota status</dt>
                    <dd className="text-sm font-medium leading-snug text-[#1D1D1D] sm:max-w-[60%] sm:text-end">
                      {estimate.overQuota ? (
                        <span>
                          +{formatCount(estimate.billableEmails)} over{" "}
                          {formatCount(estimate.includedOutbound)} included
                        </span>
                      ) : (
                        <span>Within {formatCount(estimate.includedOutbound)} included</span>
                      )}
                    </dd>
                  </div>
                  {estimate.upgradeRequired ? (
                    <div className="rounded-xl bg-white px-3 py-2.5 text-xs leading-relaxed text-[#6B6F76]">
                      Free includes {formatCount(estimate.includedOutbound)} sends with no
                      overage packs. Upgrade to Starter or Professional to send more.
                    </div>
                  ) : estimate.overQuota ? (
                    <div className="rounded-xl bg-white px-3 py-2.5 text-xs leading-relaxed text-[#6B6F76]">
                      Overage is sold in packs of {formatCount(MAIL_ESTIMATE_PACK_EMAILS)} emails
                      at {formatMailIqD(estimate.packPriceIqd)} each — buy from Billing → Usage.
                    </div>
                  ) : null}
                </dl>

                <ul className="hidden space-y-2 border-b border-[#EBEBEB] px-4 py-4 sm:block sm:px-6 sm:py-5">
                  {estimate.highlights.slice(0, 5).map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-[#6B6F76]">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#1D1D1D]/45" strokeWidth={2.4} aria-hidden />
                      <span className="min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="px-4 py-4 sm:px-6 sm:py-5">
                  <Link href={ctaHref} className={`${agLayout.btnPrimary} w-full`}>
                    {ctaLabel}
                  </Link>
                  <Link href="/pricing" className={`${agLayout.btnGhost} mt-2 w-full`}>
                    Compare full pricing
                  </Link>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-[#FAFAFA]">
                <p className="border-b border-[#EBEBEB] px-4 py-3 text-[12px] font-medium text-[#9CA3AF]">
                  Same volume · all plans
                </p>
                <ul className="divide-y divide-[#EBEBEB]">
                  {allEstimates.map((row) => (
                    <li
                      key={row.planId}
                      className={cn(
                        "flex items-center justify-between gap-3 px-4 py-3 text-sm",
                        row.planId === planId && "bg-white",
                      )}
                    >
                      <button
                        type="button"
                        className="min-w-0 text-start font-medium text-[#1D1D1D]"
                        onClick={() => {
                          setAutoRecommend(false);
                          setPlanId(row.planId);
                        }}
                      >
                        {row.planName}
                        {row.upgradeRequired ? (
                          <span className="mt-0.5 block text-[11px] font-normal text-[#9CA3AF]">
                            upgrade for overage
                          </span>
                        ) : row.overQuota ? (
                          <span className="mt-0.5 block text-[11px] font-normal text-[#9CA3AF]">
                            includes {row.packThousands} pack
                            {row.packThousands === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </button>
                      <span className="shrink-0 tabular-nums text-[#6B6F76]">
                        <MailAnimatedIqD
                          value={
                            (period === "yearly"
                              ? mailYearlyPrice(row.basePlanCost)
                              : row.basePlanCost) +
                            row.extraSeatsCost +
                            row.volumeCost
                          }
                          suffix={period === "yearly" ? "/yr" : "/mo"}
                        />
                      </span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between gap-3 bg-white px-4 py-3 text-sm">
                    <Link
                      href="mailto:support@rukny.io?subject=Rukny%20Mail%20Custom%20plan"
                      className="font-medium text-[#1D1D1D]"
                    >
                      {customPlan.name}
                      <span className="mt-0.5 block text-[11px] font-normal text-[#9CA3AF]">
                        {customPlan.bestFor}
                      </span>
                    </Link>
                    <span className="shrink-0 text-[#9CA3AF]">Let&apos;s talk</span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-12 sm:mt-16">
          <MailReveal className="mx-auto max-w-xl text-center">
            <p className={agLayout.eyebrow}>How it works</p>
            <h2 className={`${agLayout.sectionTitle} mt-3`}>How the bill is built</h2>
            <p className={`${agLayout.lead} mt-4`}>
              Three clear parts — no hidden volume surprises.
            </p>
          </MailReveal>
          <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              {
                title: "Base plan",
                body: "Free activates after DNS verification. Starter is 3,000 IQD/mo; Professional is 8,000 IQD/mo.",
              },
              {
                title: "Extra mailboxes",
                body: "2,000 IQD per extra seat on Starter; 3,000 IQD per extra seat on Professional.",
              },
              {
                title: "Outbound packs",
                body: `${formatMailIqD(MAIL_ESTIMATE_PACK_PRICE_IQD)} per ${formatCount(MAIL_ESTIMATE_PACK_EMAILS)} emails after your included quota on paid plans.`,
              },
            ].map((card) => (
              <div key={card.title} className="rounded-[1.25rem] bg-[#FAFAFA] p-5">
                <p className="text-sm font-medium text-[#1D1D1D]">{card.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#6B6F76]">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-relaxed text-[#9CA3AF]">
          Totals use current seat prices and prepaid pack rules from Billing. Packs are sold in
          whole thousands (rounded up). Yearly billing applies a {MAIL_ANNUAL_DISCOUNT_PERCENT}%
          discount on the base plan only; extra mailboxes and packs stay monthly.
        </p>
      </div>
    </main>
  );
}
