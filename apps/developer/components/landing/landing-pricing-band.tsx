'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DevReveal } from '@/components/landing/dev-reveal';
import { MarketingBillingToggle, PlanCard } from '@/components/landing/pricing-section';
import type { LandingCopy } from '@/lib/landing-copy';
import { agLayout } from '@/lib/ag-theme';
import { PRICING_PLANS, type BillingPeriod } from '@/lib/pricing-plans';

export function LandingPricingBand({ copy }: { copy: LandingCopy }) {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');

  return (
    <section
      id="pricing"
      className={`${agLayout.sectionMuted} py-16 sm:py-24 md:py-28`}
      aria-labelledby="landing-pricing-heading"
    >
      <div className={agLayout.container}>
        <DevReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className={agLayout.eyebrow}>{copy.pricingBandEyebrow}</p>
            <h2 id="landing-pricing-heading" className={`${agLayout.sectionTitle} mt-4`}>
              {copy.pricingBandTitle}
              <span className="text-[#9CA3AF]">{copy.pricingBandTitleMuted}</span>
            </h2>
            <div className="mt-6 flex justify-center sm:mt-7">
              <MarketingBillingToggle
                period={period}
                onChange={setPeriod}
                copy={copy}
              />
            </div>
          </div>
        </DevReveal>

        <div className="mx-auto mt-6 grid max-w-4xl grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
          {PRICING_PLANS.map((plan, index) => (
            <DevReveal key={plan.id} delay={index * 0.05}>
              <PlanCard plan={plan} period={period} marketing />
            </DevReveal>
          ))}
        </div>

        <p className="mt-8 text-center">
          <Link
            href="/pricing"
            className="text-[14px] font-medium text-[#1D1D1D] underline decoration-[#EBEBEB] underline-offset-4 transition-colors hover:decoration-[#1D1D1D]"
          >
            {copy.pricingBandViewAll}
          </Link>
        </p>
      </div>
    </section>
  );
}
