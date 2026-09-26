import { cn } from "@heroui/react";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

export function MailEmailApiTierPrice({
  amount,
  unit = "per month",
  isEnterprise,
}: {
  amount: number;
  unit?: string;
  isEnterprise?: boolean;
}) {
  if (isEnterprise && amount === 0) {
    return (
      <p className="text-[1.35rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">Custom</p>
    );
  }

  if (amount === 0) {
    return (
      <p className="text-[1.35rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">Free</p>
    );
  }

  return (
    <div>
      <p className="text-[1.35rem] font-medium tabular-nums tracking-[-0.02em] leading-none text-[#1D1D1D]">
        {amount.toLocaleString("en-IQ")}
        <span className="ms-1.5 text-[12px] font-medium text-[#9CA3AF]">IQD</span>
      </p>
      <p className="mt-1.5 text-[12px] font-normal text-[#9CA3AF]">{unit}</p>
    </div>
  );
}

export type MailEmailApiTierCardProps = {
  className?: string;
  surface?: "white" | "muted";
  eyebrow: ReactNode;
  title: string;
  priceAmount: number;
  priceUnit?: string;
  volumeLine?: string;
  overageLine?: string | null;
  features: string[];
  ctaHref?: string;
  ctaLabel?: string;
  ctaEmphasis?: boolean;
  isEnterprise?: boolean;
};

export function MailEmailApiTierCard({
  className,
  surface = "white",
  eyebrow,
  title,
  priceAmount,
  priceUnit = "per month",
  volumeLine,
  overageLine,
  features,
  ctaHref,
  ctaLabel = "Get started",
  ctaEmphasis = false,
  isEnterprise,
}: MailEmailApiTierCardProps) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-[1.5rem] p-6",
        surface === "white" ? "bg-white" : "bg-[#FAFAFA]",
        className,
      )}
    >
      <div className="min-h-[1.375rem]">{eyebrow}</div>

      <p className="mt-3 text-[15px] font-medium leading-tight text-[#1D1D1D]">{title}</p>

      <div className="mt-5 min-h-[3.75rem]">
        <MailEmailApiTierPrice
          amount={priceAmount}
          unit={priceUnit}
          isEnterprise={isEnterprise}
        />
      </div>

      {volumeLine ? (
        <p className="mt-3 text-[13px] leading-snug text-[#6B6F76]">{volumeLine}</p>
      ) : (
        <p className="mt-3 min-h-[1.25rem]" aria-hidden />
      )}

      {overageLine ? (
        <p className="mt-1 text-[12px] leading-snug text-[#9CA3AF]">{overageLine}</p>
      ) : (
        <p className="mt-1 min-h-[1.125rem]" aria-hidden />
      )}

      <ul className="mt-6 space-y-3 border-t border-[#EBEBEB] pt-6">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-[13px] leading-snug text-[#6B6F76]">
            <Check
              className="mt-0.5 size-3.5 shrink-0 text-[#34A853]"
              strokeWidth={2.4}
              aria-hidden
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {ctaHref ? (
        <div className="mt-auto pt-6">
          <a
            href={ctaHref}
            className={cn(
              "inline-flex h-10 w-full items-center justify-center rounded-full px-5 text-[13px] font-medium transition-colors duration-200",
              ctaEmphasis
                ? "bg-[#1D1D1D] text-white hover:bg-[#333333]"
                : "bg-[#F0F0F0] text-[#1D1D1D] hover:bg-[#EBEBEB]",
            )}
          >
            {ctaLabel}
          </a>
        </div>
      ) : null}
    </article>
  );
}
