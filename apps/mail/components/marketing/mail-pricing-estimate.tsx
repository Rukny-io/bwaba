"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@heroui/react";
import { MailFrameLink } from "@/components/marketing/mail-frame-cta";
import { MailAnimatedIqD } from "@/components/marketing/mail-animated-iqd";
import {
  estimateAllPlans,
  estimateMailMonthlyCost,
  estimateRawVolumeCost,
  formatEstimateIqD,
  formatOutboundLabel,
  MAIL_ESTIMATE_INCLUDED_OUTBOUND,
  MAIL_ESTIMATE_MAILBOX_MAX,
  MAIL_ESTIMATE_MAILBOX_MIN,
  MAIL_ESTIMATE_OUTBOUND_MAX,
  MAIL_ESTIMATE_OUTBOUND_MIN,
  MAIL_ESTIMATE_OVERAGE_BRACKETS,
  MAIL_ESTIMATE_RATE_CARD,
  MAIL_ESTIMATE_VOLUME_PRESETS,
  recommendMailPlan,
  type MailEstimateFeatureNeeds,
} from "@/lib/mail-estimate-catalog";
import { listMailPlans, type MailPlanId } from "@/lib/mail-plans";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

function formatCount(n: number): string {
  return n.toLocaleString("en-IQ");
}

export function MailPricingEstimate({ signedIn }: { signedIn: boolean }) {
  const plans = listMailPlans();
  const [planId, setPlanId] = useState<MailPlanId>("standard");
  const [autoRecommend, setAutoRecommend] = useState(true);
  const [mailboxes, setMailboxes] = useState(3);
  const [monthlyOutbound, setMonthlyOutbound] = useState(10_000);
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
        : "Start Building"
      : signedIn
        ? "Request this plan"
        : "Get Started";

  return (
    <main className="overflow-x-clip">
      <section className="border-b border-[#e8e8e8]">
        <div className={L.container}>
          <div className="space-y-6 py-10 md:py-14 max-w-3xl">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#666666] transition-colors hover:text-[#111111]"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Pricing
            </Link>
            <p className={L.heroBadge}>Estimate</p>
            <h1 className={L.heroTitle}>Estimate your costs</h1>
            <p className={L.heroLead}>
              Pick a volume preset (1K–100K), seats, and a plan. Included send
              grows with the plan; overage uses clear per-1K brackets — not a
              diluted “effective” average.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e8e8e8] py-8">
        <div className={L.container}>
          <div className="grid gap-px overflow-hidden border border-[#e8e8e8] bg-[#e8e8e8] sm:grid-cols-2 lg:grid-cols-4">
            {MAIL_ESTIMATE_RATE_CARD.map((row) => (
              <button
                key={row.emails}
                type="button"
                onClick={() => setMonthlyOutbound(row.emails)}
                className="bg-white px-4 py-4 text-left transition-colors hover:bg-[#f5f5f5]"
              >
                <p className="text-xs font-medium uppercase tracking-[1.2px] text-[#999999]">
                  {row.label}
                </p>
                <p className="mt-2 text-xl font-bold tracking-tight text-[#111111]">
                  {formatEstimateIqD(estimateRawVolumeCost(row.emails))}
                </p>
                <p className="mt-1 text-xs text-[#666666]">
                  Overage only · before plan included
                </p>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#999999]">
            Overage brackets:{" "}
            {MAIL_ESTIMATE_OVERAGE_BRACKETS.map((b, i) => {
              const prev = i === 0 ? 0 : MAIL_ESTIMATE_OVERAGE_BRACKETS[i - 1].upToEmails;
              const label =
                Number.isFinite(b.upToEmails)
                  ? `${formatCount(prev + 1)}–${formatCount(b.upToEmails)}`
                  : `${formatCount(prev + 1)}+`;
              return `${label}: ${formatCount(b.iqdPerThousand)} IQD / 1K`;
            }).join(" · ")}
            . Included: Starter{" "}
            {formatCount(MAIL_ESTIMATE_INCLUDED_OUTBOUND.starter)} · Standard{" "}
            {formatCount(MAIL_ESTIMATE_INCLUDED_OUTBOUND.standard)} · Premium{" "}
            {formatCount(MAIL_ESTIMATE_INCLUDED_OUTBOUND.premium)}.
          </p>
        </div>
      </section>

      <section className="border-b border-[#e8e8e8] py-10 sm:py-14">
        <div className={L.container}>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-10">
            <div className="space-y-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-[1.2px] text-[#666666]">
                  Monthly outbound
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {MAIL_ESTIMATE_VOLUME_PRESETS.map((preset) => {
                    const active = monthlyOutbound === preset.emails;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setMonthlyOutbound(preset.emails)}
                        className={cn(
                          "min-h-9 border px-3.5 py-2 text-xs font-medium transition-colors sm:text-sm",
                          active
                            ? "border-[#111111] bg-[#111111] text-white"
                            : "border-[#e8e8e8] bg-white text-[#666666] hover:border-[#111111]/25 hover:text-[#111111]",
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5 space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <label
                      htmlFor="outbound-range"
                      className="text-sm font-medium text-[#111111]"
                    >
                      Outbound emails / month
                    </label>
                    <input
                      type="number"
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
                      className="w-28 border border-[#e8e8e8] bg-white px-2 py-1.5 text-right text-sm tabular-nums text-[#111111] outline-none focus:border-[#111111]"
                    />
                  </div>
                  <input
                    id="outbound-range"
                    type="range"
                    min={MAIL_ESTIMATE_OUTBOUND_MIN}
                    max={MAIL_ESTIMATE_OUTBOUND_MAX}
                    step={100}
                    value={monthlyOutbound}
                    onChange={(e) =>
                      setMonthlyOutbound(Number(e.target.value))
                    }
                    className="mail-estimate-range w-full"
                  />
                  <p className="text-xs text-[#999999]">
                    {formatCount(MAIL_ESTIMATE_OUTBOUND_MIN)} –{" "}
                    {formatCount(MAIL_ESTIMATE_OUTBOUND_MAX)} emails
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-end justify-between gap-3">
                  <label
                    htmlFor="mailbox-range"
                    className="text-sm font-medium text-[#111111]"
                  >
                    Mailboxes
                  </label>
                  <input
                    type="number"
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
                    className="w-20 border border-[#e8e8e8] bg-white px-2 py-1.5 text-right text-sm tabular-nums text-[#111111] outline-none focus:border-[#111111]"
                  />
                </div>
                <input
                  id="mailbox-range"
                  type="range"
                  min={MAIL_ESTIMATE_MAILBOX_MIN}
                  max={100}
                  step={1}
                  value={Math.min(mailboxes, 100)}
                  onChange={(e) => setMailboxes(Number(e.target.value))}
                  className="mail-estimate-range mt-3 w-full"
                />
                <p className="mt-2 text-xs text-[#999999]">
                  Slider up to 100; type up to {MAIL_ESTIMATE_MAILBOX_MAX} seats
                </p>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[#111111]">Plan</p>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#666666]">
                    <input
                      type="checkbox"
                      checked={autoRecommend}
                      onChange={(e) => setAutoRecommend(e.target.checked)}
                      className="size-3.5 accent-[#111111]"
                    />
                    Auto-recommend
                  </label>
                </div>
                <div className="mt-3 grid gap-px overflow-hidden border border-[#e8e8e8] bg-[#e8e8e8] sm:grid-cols-3">
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
                          "bg-white px-4 py-4 text-left transition-colors",
                          active
                            ? "ring-1 ring-inset ring-[#111111]"
                            : "hover:bg-[#f5f5f5]",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#111111]">
                            {plan.name}
                          </span>
                          {isRec ? (
                            <span className="text-[10px] font-semibold uppercase tracking-[1px] text-[#666666]">
                              Best
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-[#666666]">
                          {formatCount(MAIL_ESTIMATE_INCLUDED_OUTBOUND[plan.id])}{" "}
                          emails included
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-[#111111]">
                  Features that affect recommendation
                </p>
                <ul className="mt-3 space-y-2 border border-[#e8e8e8] bg-white p-4">
                  {(
                    [
                      {
                        key: "openTracking" as const,
                        label: "Open tracking",
                        hint: "Needs Standard or higher",
                      },
                      {
                        key: "linkAndFileTracking" as const,
                        label: "Link and file tracking",
                        hint: "Needs Premium",
                      },
                      {
                        key: "premiumDelivery" as const,
                        label: "Premium email delivery",
                        hint: "Needs Premium",
                      },
                    ] as const
                  ).map((item) => (
                    <li key={item.key}>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={features[item.key]}
                          onChange={(e) =>
                            setFeatures((prev) => ({
                              ...prev,
                              [item.key]: e.target.checked,
                            }))
                          }
                          className="mt-1 size-3.5 accent-[#111111]"
                        />
                        <span>
                          <span className="block text-sm font-medium text-[#111111]">
                            {item.label}
                          </span>
                          <span className="text-xs text-[#999999]">
                            {item.hint}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-[#999999]">
                  Agentic Mail, webmail, anti-spam, and mailbox 2FA are included
                  on every plan.
                </p>
              </div>
            </div>

            <aside className="lg:sticky lg:top-20">
              <div className="border border-[#e8e8e8] bg-white">
                <div className="border-b border-[#e8e8e8] px-5 py-5 sm:px-6">
                  <p className="text-xs font-medium uppercase tracking-[1.2px] text-[#666666]">
                    Estimated monthly
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[#111111] sm:text-4xl">
                    <MailAnimatedIqD
                      value={estimate.totalMonthly}
                      size="hero"
                      suffix="/mo"
                      suffixClassName="ms-0.5 text-base font-medium text-[#999999]"
                    />
                  </p>
                  <p className="mt-2 text-sm text-[#666666]">
                    {estimate.planName} · {formatCount(estimate.mailboxes)}{" "}
                    mailbox
                    {estimate.mailboxes === 1 ? "" : "es"} ·{" "}
                    {formatOutboundLabel(estimate.monthlyOutbound)} outbound
                  </p>
                </div>

                <dl className="space-y-3 border-b border-[#e8e8e8] px-5 py-5 text-sm sm:px-6">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#666666]">Base plan</dt>
                    <dd className="font-medium tabular-nums text-[#111111]">
                      <MailAnimatedIqD value={estimate.basePlanCost} delay={0.04} />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#666666]">
                      Extra seats
                      {estimate.extraMailboxes > 0
                        ? ` (${estimate.extraMailboxes} × ${formatEstimateIqD(estimate.extraMailboxUnit)})`
                        : ""}
                    </dt>
                    <dd className="font-medium tabular-nums text-[#111111]">
                      <MailAnimatedIqD
                        value={estimate.extraSeatsCost}
                        delay={0.08}
                      />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#666666]">
                      Outbound overage
                      {estimate.billableEmails > 0
                        ? ` (${formatCount(estimate.billableEmails)} above ${formatCount(estimate.includedOutbound)} included)`
                        : ` (within ${formatCount(estimate.includedOutbound)} included)`}
                    </dt>
                    <dd className="font-medium tabular-nums text-[#111111]">
                      <MailAnimatedIqD value={estimate.volumeCost} delay={0.12} />
                    </dd>
                  </div>
                  {estimate.billableEmails > 0 &&
                  estimate.costPerThousandBillable != null ? (
                    <div className="flex justify-between gap-4 border-t border-[#e8e8e8] pt-3">
                      <dt className="text-[#666666]">
                        Overage rate / 1,000 emails
                      </dt>
                      <dd className="font-medium tabular-nums text-[#111111]">
                        <MailAnimatedIqD
                          value={estimate.costPerThousandBillable}
                          delay={0.16}
                        />
                      </dd>
                    </div>
                  ) : (
                    <div className="flex justify-between gap-4 border-t border-[#e8e8e8] pt-3">
                      <dt className="text-[#666666]">Outbound volume</dt>
                      <dd className="font-medium text-[#111111]">
                        Included in plan
                      </dd>
                    </div>
                  )}
                  {estimate.effectiveCostPerThousand != null ? (
                    <div className="flex justify-between gap-4 text-xs">
                      <dt className="text-[#999999]">
                        Blended (plan + volume) / 1,000
                      </dt>
                      <dd className="tabular-nums text-[#999999]">
                        <MailAnimatedIqD
                          value={estimate.effectiveCostPerThousand}
                          delay={0.2}
                        />
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <ul className="space-y-2 border-b border-[#e8e8e8] px-5 py-5 sm:px-6">
                  {estimate.highlights.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-sm text-[#666666]"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-[#111111]"
                        strokeWidth={2.4}
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="px-5 py-5 sm:px-6">
                  <MailFrameLink
                    href={ctaHref}
                    className="w-full [&_span.relative]:w-full"
                  >
                    {ctaLabel}
                  </MailFrameLink>
                </div>
              </div>

              <div className="mt-4 border border-[#e8e8e8] bg-[#fafafa]">
                <p className="border-b border-[#e8e8e8] px-4 py-3 text-xs font-medium uppercase tracking-[1.2px] text-[#999999]">
                  Same inputs · all plans
                </p>
                <ul className="divide-y divide-[#e8e8e8]">
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
                        className="font-medium text-[#111111] hover:text-[#111111]"
                        onClick={() => {
                          setAutoRecommend(false);
                          setPlanId(row.planId);
                        }}
                      >
                        {row.planName}
                      </button>
                      <span className="tabular-nums text-[#666666]">
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

      <section className="py-10 sm:py-12">
        <div className={L.container}>
          <p className="max-w-3xl text-xs leading-relaxed text-[#999999]">
            Disclaimer: This calculator is illustrative for planning only — not
            a quote or binding offer. Seat pricing matches current Mail plans.
            Outbound volume rates are an estimate catalog and may change when
            usage billing launches. Starter starts after DNS verification;
            Standard and Premium are requested in the console. Card payment is
            coming soon.
          </p>
        </div>
      </section>
    </main>
  );
}
