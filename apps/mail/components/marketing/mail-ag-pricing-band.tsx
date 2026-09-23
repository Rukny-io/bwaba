"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { MailReveal } from "@/components/marketing/mail-reveal";
import { agLayout } from "@/lib/mail-antigravity-theme";

function HoverSolutionCard({
  eyebrow,
  badge,
  title,
  description,
  href,
  cta,
  variant,
}: {
  eyebrow: string;
  badge?: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  variant: "primary" | "secondary";
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spotlight = useMotionTemplate`radial-gradient(500px circle at ${x}px ${y}px, rgba(66,133,244,0.08), transparent 55%)`;

  return (
    <div
      ref={ref}
      data-hover-trigger=""
      className="solution-section relative min-h-[420px] overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white sm:min-h-[520px] lg:min-h-[600px]"
      onMouseMove={(e) => {
        if (reduceMotion || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);
      }}
    >
      {!reduceMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: spotlight }}
        />
      ) : null}
      <div className="try-solutions-content relative flex h-full flex-col justify-between p-8 sm:p-10">
        <div>
          {badge ? (
            <p className="mb-3 text-[12px] font-semibold text-[#34A853]">
              {badge}
            </p>
          ) : null}
          <p className="text-[13px] font-medium text-[#6B6F76]">{eyebrow}</p>
          <h3 className="mt-3 text-[1.75rem] font-medium tracking-[-0.03em] text-[#1D1D1D] sm:text-[2rem]">
            {title}
          </h3>
        </div>
        <div>
          <p className={`${agLayout.lead} max-w-sm`}>{description}</p>
          <Link
            href={href}
            className={`${variant === "primary" ? agLayout.btnPrimary : agLayout.btnSecondary} mt-8`}
          >
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function MailAgPricingBand({
  primaryHref,
  primaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
}) {
  return (
    <section
      data-try-solutions-section=""
      className="try-solutions-section border-t border-[#E8E8E8] bg-white py-16 sm:py-20"
      aria-labelledby="ag-pricing-heading"
    >
      <div className={`${agLayout.container}`}>
        <MailReveal className="mx-auto mb-12 max-w-xl text-center">
          <h2 id="ag-pricing-heading" className={agLayout.sectionTitle}>
            Available at no charge to start
          </h2>
        </MailReveal>

        <div className="section-wrapper grid gap-5 md:grid-cols-2 lg:gap-6">
          <HoverSolutionCard
            eyebrow="For teams"
            title="Achieve new heights"
            description="Start with a Starter plan — mailboxes on your domain, DNS authentication, and webmail included."
            href={primaryHref}
            cta={primaryLabel}
            variant="primary"
          />
          <HoverSolutionCard
            eyebrow="For organizations"
            badge="Now Available!"
            title="Level up your entire team"
            description="Premium plans with more mailboxes, console members, and delivery features for growing organizations."
            href="/pricing"
            cta="Read more"
            variant="secondary"
          />
        </div>
      </div>
    </section>
  );
}
