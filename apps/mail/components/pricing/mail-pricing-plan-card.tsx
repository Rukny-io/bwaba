"use client";

import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@heroui/react";
import { agLayout } from "@/lib/mail-antigravity-theme";
import {
  formatMailIqD,
  mailDisplayPrice,
  mailYearlyPrice,
  type MailBillingPeriod,
} from "@/lib/mail-plans";
import { MailAnimatedNumber } from "./mail-animated-number";

const PREVIEW_FEATURES = 3;

export type MailPricingCardPlan = {
  cardId: string;
  name: string;
  bestFor: string;
  priceMonthly: number;
  monthlyOutbound: number;
  popular?: boolean;
  badge?: string;
  ctaLabel: string;
  ctaHref: string;
  contactSales?: boolean;
  enterprise?: boolean;
  priceLabel?: string;
  priceSubLabel?: string;
  footnote?: string;
  highlights: string[];
};

function PlanPrice({
  plan,
  period,
  popular,
}: {
  plan: MailPricingCardPlan;
  period: MailBillingPeriod;
  popular?: boolean;
}) {
  if (plan.contactSales) {
    return (
      <div className="text-end">
        <p className="text-[1.2rem] font-medium leading-none tracking-[-0.03em] sm:text-[1.35rem]">
          {plan.priceLabel ?? "Let's talk"}
        </p>
        {plan.priceSubLabel ? (
          <p className="mt-1 text-[10px] text-[#9CA3AF]">{plan.priceSubLabel}</p>
        ) : null}
      </div>
    );
  }

  const isFree = plan.priceMonthly === 0;
  const displayPrice = mailDisplayPrice(plan.priceMonthly, period);

  if (isFree) {
    return (
      <p className="text-end text-[1.35rem] font-medium leading-none tracking-[-0.03em] sm:text-[1.5rem]">
        Free
      </p>
    );
  }

  return (
    <div className="text-end">
      <p className="flex items-baseline justify-end gap-1">
        <MailAnimatedNumber
          value={displayPrice}
          className="text-[1.35rem] font-medium leading-none tracking-[-0.03em] sm:text-[1.5rem]"
        />
        <span
          className={cn(
            "text-[11px] font-medium",
            popular ? "text-white/55" : "text-[#9CA3AF]",
          )}
        >
          IQD
        </span>
      </p>
      <p className={cn("mt-0.5 text-[10px]", popular ? "text-white/45" : "text-[#9CA3AF]")}>
        per month
      </p>
    </div>
  );
}

export function MailPricingPlanCard({
  plan,
  period,
}: {
  plan: MailPricingCardPlan;
  period: MailBillingPeriod;
}) {
  const isFree = plan.priceMonthly === 0 && !plan.contactSales;
  const popular = plan.popular;
  const enterprise = plan.enterprise;
  const bullets = plan.highlights;
  const preview = bullets.slice(0, PREVIEW_FEATURES);
  const rest = bullets.slice(PREVIEW_FEATURES);

  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.25rem] p-4 sm:p-5",
        popular
          ? "bg-[#1D1D1D] text-white"
          : enterprise
            ? "border border-[#E8E8E8] bg-white text-[#1D1D1D] shadow-[0_12px_40px_rgba(15,23,42,0.04)]"
            : "bg-[#FAFAFA] text-[#1D1D1D]",
      )}
      data-testid="MailPricingOptions__item"
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {plan.badge ? (
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                popular ? "bg-white/12 text-white/90" : "bg-white/80 text-[#6B6F76]",
              )}
            >
              {plan.badge}
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                popular ? "bg-white/10 text-white/70" : "bg-white/70 text-[#9CA3AF]",
              )}
            >
              {plan.name}
            </span>
          )}
          <h3 className="mt-2 text-[1.05rem] font-medium tracking-[-0.02em] sm:text-[1.125rem]">
            {plan.name}
          </h3>
          <p
            className={cn(
              "mt-1 line-clamp-2 text-[12px] leading-[1.6] sm:text-[13px]",
              popular ? "text-white/65" : "text-[#6B6F76]",
            )}
          >
            {plan.bestFor}
          </p>
        </div>

        <div className="relative shrink-0 pt-5">
          <PlanPrice plan={plan} period={period} popular={popular} />
        </div>
      </div>

      <ul className="relative mt-3 space-y-1.5 sm:mt-4">
        {preview.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-[11px] leading-[1.55] sm:text-[12px]"
          >
            <Check
              className={cn(
                "mt-0.5 size-3 shrink-0",
                popular ? "text-white/70" : "text-[#1D1D1D]/45",
              )}
              strokeWidth={2.25}
              aria-hidden
            />
            <span className={popular ? "text-white/80" : "text-[#6B6F76]"}>{item}</span>
          </li>
        ))}
      </ul>

      {rest.length > 0 ? (
        <details className="group/details relative mt-2">
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center gap-1 text-[11px] font-medium [&::-webkit-details-marker]:hidden",
              popular ? "text-white/55 hover:text-white/75" : "text-[#9CA3AF] hover:text-[#6B6F76]",
            )}
          >
            +{rest.length} more features
            <ChevronDown
              className="size-3 transition-transform group-open/details:rotate-180"
              aria-hidden
            />
          </summary>
          <ul
            className={cn(
              "mt-2 space-y-1.5 border-t border-dashed pt-2",
              popular ? "border-white/15" : "border-[#EBEBEB]/80",
            )}
          >
            {rest.map((item) => (
              <li
                key={item}
                className={cn(
                  "flex items-start gap-2 text-[11px] leading-[1.55]",
                  popular ? "text-white/70" : "text-[#6B6F76]",
                )}
              >
                <Check
                  className={cn(
                    "mt-0.5 size-3 shrink-0",
                    popular ? "text-white/55" : "text-[#1D1D1D]/40",
                  )}
                  strokeWidth={2.25}
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="relative mt-auto pt-4">
        <Link
          href={plan.ctaHref}
          className={cn(
            "inline-flex h-9 w-full items-center justify-center rounded-full text-[13px] font-medium transition-colors",
            enterprise
              ? "border border-[#E8E8E8] bg-[#FAFAFA] text-[#1D1D1D] hover:bg-[#F5F5F5]"
              : isFree
                ? popular
                  ? "bg-white text-[#1D1D1D] hover:bg-[#FAFAFA]"
                  : agLayout.btnPrimary
                : popular
                  ? "bg-white text-[#1D1D1D] hover:bg-[#FAFAFA]"
                  : "bg-[#1D1D1D] text-white hover:bg-[#0A0A0A]",
          )}
        >
          {plan.ctaLabel}
        </Link>

        <p
          className={cn(
            "mt-2 text-center text-[10px] leading-relaxed",
            popular ? "text-white/45" : "text-[#9CA3AF]",
          )}
        >
          {plan.footnote ??
            (plan.contactSales
              ? "Volume pricing & dedicated onboarding"
              : isFree
                ? "Free after DNS verification"
                : period === "yearly"
                  ? `${formatMailIqD(mailYearlyPrice(plan.priceMonthly))} billed yearly`
                  : "Billed monthly in IQD")}
        </p>
      </div>
    </article>
  );
}
