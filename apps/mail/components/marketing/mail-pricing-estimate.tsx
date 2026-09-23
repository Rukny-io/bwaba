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
  listMailPlans,
  type MailPlanId,
} from "@/lib/mail-plans";
import { agLayout } from "@/lib/mail-antigravity-theme";

function formatCount(n: number): string {
  return n.toLocaleString("en-IQ");
}

const fieldClass =
  "w-full rounded-xl border border-[#E8E8E8] bg-white px-3.5 py-2.5 text-sm tabular-nums text-[#1D1D1D] outline-none transition-colors focus:border-[#1D1D1D]";

export function MailPricingEstimate({ signedIn }: { signedIn: boolean }) {
  const plans = listMailPlans();
  const [planId, setPlanId] = useState<MailPlanId>("starter");
  const [autoRecommend, setAutoRecommend] = useState(true);
  const [mailboxes, setMailboxes] = useState(1);
  const [monthlyOutbound, setMonthlyOutbound] = useState(4_000);
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

  const ctaHref = signedIn
    ? planId === "starter"
      ? "/apps"
      : "/billing"
    : planId === "starter"
      ? "/login"
      : "/login?next=/billing";

  const ctaLabel =
    planId === "starter"
      ? signedIn
        ? "Open console"
        : "Get started"
      : signedIn
        ? "Open billing"
        : "Get started";

  return (
    <main className="overflow-x-clip bg-white text-[#1D1D1D]">
      <section className="relative border-b border-[#E8E8E8]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(66,133,244,0.08), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(52,168,83,0.06), transparent 45%)",
          }}
        />
        <div className={`${agLayout.container} relative py-10 sm:py-16`}>
          <MailReveal className="mx-auto max-w-2xl text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#6B6F76] transition-colors hover:text-[#1D1D1D]"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Pricing
            </Link>
            <p className={`${agLayout.pill} mt-5 sm:mt-6`}>Cost estimator</p>
            <h1 className={`${agLayout.heroTitle} mt-4 text-[clamp(1.75rem,7vw,4rem)] sm:mt-6`}>
              Estimate your Mail bill
            </h1>
            <p className={`${agLayout.lead} mx-auto mt-4 max-w-xl text-[0.9375rem] sm:mt-5 sm:text-base`}>
              Seats plus prepaid outbound packs — the same numbers Billing and
              checkout charge. Packs are{" "}
              {formatMailIqD(MAIL_ESTIMATE_PACK_PRICE_IQD)} per{" "}
              {formatCount(MAIL_ESTIMATE_PACK_EMAILS)} emails when you exceed
              your plan quota.
            </p>
          </MailReveal>
        </div>
      </section>

      <section className="border-b border-[#E8E8E8] bg-[#FAFAFA] py-8 sm:py-12">
        <div className={agLayout.container}>
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
              Extra emails: {formatMailIqD(MAIL_ESTIMATE_PACK_PRICE_IQD)} / 1,000
              on every plan
            </p>
          </div>
          <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
            {plans.map((plan) => {
              const active = planId === plan.id;
              const included = MAIL_ESTIMATE_INCLUDED_OUTBOUND[plan.id];
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
                    "w-[min(78vw,280px)] shrink-0 snap-center rounded-2xl border bg-white p-4 text-left transition-shadow sm:w-auto sm:snap-none sm:p-5",
                    active
                      ? "border-[#1D1D1D] shadow-[0_12px_40px_-16px_rgba(0,0,0,0.18)]"
                      : "border-[#E8E8E8] hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[#1D1D1D]">
                      {plan.name}
                    </p>
                    {plan.popular ? (
                      <span className="shrink-0 rounded-full bg-[#1D1D1D] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                        Popular
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-xl font-medium tracking-tight text-[#1D1D1D] sm:text-2xl">
                    {formatMailIqD(plan.priceMonthly)}
                    <span className="ms-1 text-sm font-normal text-[#9CA3AF]">
                      /mo
                    </span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-[#6B6F76]">
                    {plan.bestFor}
                  </p>
                  <dl className="mt-4 space-y-1.5 border-t border-[#E8E8E8] pt-3 text-xs text-[#6B6F76]">
                    <div className="flex justify-between gap-2">
                      <dt>Mailboxes</dt>
                      <dd className="shrink-0 font-medium text-[#1D1D1D]">
                        {plan.limits.mailboxesIncluded} included
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Extra mailbox</dt>
                      <dd className="shrink-0 font-medium text-[#1D1D1D]">
                        {formatMailIqD(plan.priceExtraMailbox)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Outbound included</dt>
                      <dd className="shrink-0 font-medium text-[#1D1D1D]">
                        {formatCount(included)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Team seats</dt>
                      <dd className="shrink-0 font-medium text-[#1D1D1D]">
                        {plan.limits.consoleMembersIncluded === 0
                          ? "Owner only"
                          : plan.limits.consoleMembersIncluded}
                      </dd>
                    </div>
                  </dl>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-[#E8E8E8] py-10 sm:py-20">
        <div className={agLayout.container}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-10">
            <div className="order-2 space-y-5 sm:space-y-8 lg:order-1">
              <div className="rounded-2xl border border-[#E8E8E8] bg-white p-4 sm:p-6">
                <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#9CA3AF]">
                  Volume
                </p>
                <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
                  {MAIL_ESTIMATE_VOLUME_PRESETS.map((preset) => {
                    const active = monthlyOutbound === preset.emails;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setMonthlyOutbound(preset.emails)}
                        className={cn(
                          "min-h-10 shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                          active
                            ? "border-[#1D1D1D] bg-[#1D1D1D] text-white"
                            : "border-[#E8E8E8] bg-[#FAFAFA] text-[#6B6F76] hover:border-[#1D1D1D]/25 hover:text-[#1D1D1D]",
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <label
                      htmlFor="outbound-input"
                      className="text-sm font-medium text-[#1D1D1D]"
                    >
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
                              Math.floor(Number(e.target.value)) ||
                                MAIL_ESTIMATE_OUTBOUND_MIN,
                            ),
                          ),
                        )
                      }
                      className={cn(fieldClass, "mt-2")}
                    />
                  </div>
                  <div className="min-w-0">
                    <label
                      htmlFor="mailbox-input"
                      className="text-sm font-medium text-[#1D1D1D]"
                    >
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
                  {MAIL_ESTIMATE_MAILBOX_MAX} seats
                </p>
              </div>

              <div className="rounded-2xl border border-[#E8E8E8] bg-white p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[#1D1D1D]">
                    Selected plan
                  </p>
                  <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-xs text-[#6B6F76]">
                    <input
                      type="checkbox"
                      checked={autoRecommend}
                      onChange={(e) => setAutoRecommend(e.target.checked)}
                      className="size-3.5 accent-[#1D1D1D]"
                    />
                    Auto
                  </label>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
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
                          "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-shadow sm:flex-col sm:items-stretch sm:justify-start sm:py-3.5",
                          active
                            ? "border-[#1D1D1D] bg-[#FAFAFA] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]"
                            : "border-[#E8E8E8] bg-white hover:border-[#1D1D1D]/20",
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 sm:flex-none">
                          <span className="text-sm font-medium text-[#1D1D1D]">
                            {plan.name}
                          </span>
                          {isRec ? (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-[#6B6F76] ring-1 ring-[#E8E8E8]">
                              Best
                            </span>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-xs text-[#6B6F76] sm:mt-1">
                          {formatCount(MAIL_ESTIMATE_INCLUDED_OUTBOUND[plan.id])}{" "}
                          included
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8E8E8] bg-white p-4 sm:p-6">
                <p className="text-sm font-medium text-[#1D1D1D]">
                  Features that raise the plan floor
                </p>
                <ul className="mt-3 space-y-2">
                  {(
                    [
                      {
                        key: "openTracking" as const,
                        label: "Open tracking",
                        hint: "Standard or Premium",
                      },
                      {
                        key: "linkAndFileTracking" as const,
                        label: "Link and file tracking",
                        hint: "Premium",
                      },
                      {
                        key: "premiumDelivery" as const,
                        label: "Premium email delivery",
                        hint: "Premium",
                      },
                    ] as const
                  ).map((item) => (
                    <li key={item.key}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] px-3.5 py-3">
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
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-[#1D1D1D]">
                            {item.label}
                          </span>
                          <span className="text-xs text-[#9CA3AF]">
                            {item.hint}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-relaxed text-[#9CA3AF]">
                  Starter is owner-only (no Team). Standard includes{" "}
                  {plans.find((p) => p.id === "standard")?.limits
                    .consoleMembersIncluded ?? 4}{" "}
                  console seats; Premium includes{" "}
                  {plans.find((p) => p.id === "premium")?.limits
                    .consoleMembersIncluded ?? 10}
                  .
                </p>
              </div>
            </div>

            <aside className="order-1 lg:sticky lg:top-20 lg:order-2">
              <div className="overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white shadow-[0_16px_48px_-20px_rgba(0,0,0,0.15)]">
                <div className="border-b border-[#E8E8E8] bg-[linear-gradient(180deg,#FAFAFA_0%,#FFFFFF_100%)] px-4 py-4 sm:px-6 sm:py-5">
                  <p className="text-[12px] font-medium text-[#9CA3AF]">
                    Estimated monthly total
                  </p>
                  <p className="mt-2 text-[1.75rem] font-medium tracking-[-0.02em] text-[#1D1D1D] sm:text-4xl">
                    <MailAnimatedIqD
                      value={estimate.totalMonthly}
                      size="hero"
                      suffix="/mo"
                      suffixClassName="ms-0.5 text-sm font-medium text-[#9CA3AF] sm:text-base"
                    />
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#6B6F76]">
                    {estimate.planName} · {formatCount(estimate.mailboxes)}{" "}
                    mailbox
                    {estimate.mailboxes === 1 ? "" : "es"} ·{" "}
                    {formatOutboundLabel(estimate.monthlyOutbound)} outbound
                  </p>
                </div>

                <dl className="space-y-3 border-b border-[#E8E8E8] px-4 py-4 text-sm sm:px-6 sm:py-5">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="min-w-0 text-[#6B6F76]">
                      Base plan ({estimate.planName})
                    </dt>
                    <dd className="shrink-0 font-medium tabular-nums text-[#1D1D1D]">
                      <MailAnimatedIqD value={estimate.basePlanCost} delay={0.04} />
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="min-w-0 text-[#6B6F76]">
                      Extra seats
                      {estimate.extraMailboxes > 0 ? (
                        <span className="mt-0.5 block text-xs text-[#9CA3AF]">
                          {estimate.extraMailboxes} ×{" "}
                          {formatEstimateIqD(estimate.extraMailboxUnit)}
                        </span>
                      ) : null}
                    </dt>
                    <dd className="shrink-0 font-medium tabular-nums text-[#1D1D1D]">
                      <MailAnimatedIqD
                        value={estimate.extraSeatsCost}
                        delay={0.08}
                      />
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="min-w-0 text-[#6B6F76]">
                      Outbound packs
                      {estimate.packThousands > 0 ? (
                        <span className="mt-0.5 block text-xs text-[#9CA3AF]">
                          {estimate.packThousands} ×{" "}
                          {formatEstimateIqD(estimate.packPriceIqd)}
                        </span>
                      ) : null}
                    </dt>
                    <dd className="shrink-0 font-medium tabular-nums text-[#1D1D1D]">
                      <MailAnimatedIqD value={estimate.volumeCost} delay={0.12} />
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 border-t border-[#E8E8E8] pt-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <dt className="text-[#6B6F76]">Quota status</dt>
                    <dd className="text-sm font-medium leading-snug text-[#1D1D1D] sm:max-w-[60%] sm:text-end">
                      {estimate.overQuota ? (
                        <span>
                          +{formatCount(estimate.billableEmails)} over{" "}
                          {formatCount(estimate.includedOutbound)} included
                        </span>
                      ) : (
                        <span>
                          Within {formatCount(estimate.includedOutbound)}{" "}
                          included
                        </span>
                      )}
                    </dd>
                  </div>
                  {estimate.overQuota ? (
                    <div className="rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] px-3 py-2.5 text-xs leading-relaxed text-[#6B6F76]">
                      Overage is sold in packs of{" "}
                      {formatCount(MAIL_ESTIMATE_PACK_EMAILS)} emails at{" "}
                      {formatMailIqD(MAIL_ESTIMATE_PACK_PRICE_IQD)} each —
                      buy them from Billing → Usage when your meter hits zero.
                    </div>
                  ) : null}
                </dl>

                <ul className="hidden space-y-2 border-b border-[#E8E8E8] px-4 py-4 sm:block sm:px-6 sm:py-5">
                  {estimate.highlights.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-sm text-[#6B6F76]"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-[#34A853]"
                        strokeWidth={2.4}
                        aria-hidden
                      />
                      <span className="min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="px-4 py-4 sm:px-6 sm:py-5">
                  <Link href={ctaHref} className={`${agLayout.btnPrimary} w-full`}>
                    {ctaLabel}
                  </Link>
                  <Link
                    href="/pricing"
                    className={`${agLayout.btnGhost} mt-2 w-full`}
                  >
                    Compare full pricing
                  </Link>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA]">
                <p className="border-b border-[#E8E8E8] px-4 py-3 text-[12px] font-medium text-[#9CA3AF]">
                  Same seats & volume · all plans
                </p>
                <ul className="divide-y divide-[#E8E8E8]">
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
                        {row.overQuota ? (
                          <span className="mt-0.5 block text-[11px] font-normal text-[#9CA3AF]">
                            includes {row.packThousands} pack
                            {row.packThousands === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </button>
                      <span className="shrink-0 tabular-nums text-[#6B6F76]">
                        <MailAnimatedIqD
                          value={row.totalMonthly}
                          suffix="/mo"
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-b border-[#E8E8E8] bg-[#FAFAFA] py-14 sm:py-16">
        <div className={agLayout.container}>
          <MailReveal className="mx-auto max-w-xl text-center">
            <h2 className={agLayout.sectionTitle}>How the bill is built</h2>
            <p className={`${agLayout.lead} mt-4`}>
              Three clear parts — no hidden volume surprises.
            </p>
          </MailReveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Base plan",
                body: "Monthly price for the mailboxes included on Starter, Standard, or Premium.",
              },
              {
                title: "Extra mailboxes",
                body: "2,000 / 3,000 / 4,000 IQD per extra seat on Starter / Standard / Premium.",
              },
              {
                title: "Outbound packs",
                body: `${formatMailIqD(MAIL_ESTIMATE_PACK_PRICE_IQD)} per ${formatCount(MAIL_ESTIMATE_PACK_EMAILS)} emails after your included quota — same on every plan.`,
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-[#E8E8E8] bg-white p-5"
              >
                <p className="text-sm font-medium text-[#1D1D1D]">{card.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#6B6F76]">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12">
        <div className={agLayout.container}>
          <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-[#9CA3AF]">
            Totals use current seat prices and prepaid pack rules from Billing.
            Packs are sold in whole thousands (rounded up). Starter activates
            after DNS verification and checkout; Standard and Premium are
            managed from Billing.
          </p>
        </div>
      </section>
    </main>
  );
}
