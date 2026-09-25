'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import {
  CURRENCY,
  PRICING_PLANS,
  YEARLY_DISCOUNT_PERCENT,
  formatPrice,
  monthlyEquivalentFromYearly,
  type BillingPeriod,
  type PricingPlan,
} from '@rukny/forms-shared/pricing-plans';
import { AnimatedNumber } from '@/components/pricing/animated-number';
import { agLayout } from '@/lib/public-antigravity-theme';
import { siteUrls } from '@/lib/site-urls';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;
const PLAN_HREF = siteUrls.accounts;

function BillingToggle({
  period,
  onChange,
}: {
  period: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}) {
  return (
    <div
      className="inline-flex rounded-full bg-[#F5F5F5] p-1"
      role="group"
      aria-label="دورة الفوترة"
    >
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={cn(
          'inline-flex h-9 items-center rounded-full px-5 text-[13px] font-medium transition-colors duration-300',
          period === 'monthly'
            ? 'bg-[#1D1D1D] text-white'
            : 'text-[#6B6F76] hover:text-[#1D1D1D]',
        )}
      >
        شهري
      </button>
      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-colors duration-300 sm:px-5',
          period === 'yearly'
            ? 'bg-[#1D1D1D] text-white'
            : 'text-[#6B6F76] hover:text-[#1D1D1D]',
        )}
      >
        سنوي
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
            period === 'yearly' ? 'bg-white/15 text-white' : 'bg-[#EBEBEB] text-[#6B6F76]',
          )}
        >
          −{YEARLY_DISCOUNT_PERCENT}%
        </span>
      </button>
    </div>
  );
}

function PlanPrice({ plan, period }: { plan: PricingPlan; period: BillingPeriod }) {
  const isFree = plan.priceMonthly === 0;
  const displayPrice = isFree
    ? 0
    : period === 'yearly'
      ? monthlyEquivalentFromYearly(plan.priceYearly)
      : plan.priceMonthly;

  if (isFree) {
    return (
      <p className="mt-6 text-[clamp(2rem,4vw,2.75rem)] font-medium tracking-[-0.04em] text-[#1D1D1D]">
        مجاناً
      </p>
    );
  }

  return (
    <div className="mt-6">
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <AnimatedNumber
          value={displayPrice}
          className="text-[clamp(2rem,4vw,2.75rem)] font-medium leading-none tracking-[-0.04em] text-[#1D1D1D]"
        />
        <span className="text-[14px] font-medium text-[#9CA3AF]">{CURRENCY}</span>
      </p>
      <p className="mt-2 text-[13px] text-[#9CA3AF]">لكل حساب / شهر</p>
      {period === 'yearly' ? (
        <p className="mt-1 text-[12px] text-[#9CA3AF]">
          {formatPrice(plan.priceYearly)} {CURRENCY} يُدفع سنوياً
        </p>
      ) : null}
    </div>
  );
}

function PlanCard({ plan, period }: { plan: PricingPlan; period: BillingPeriod }) {
  const highlights = plan.highlights.filter((item) => !item.endsWith(':')).slice(0, 4);

  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-[2rem] p-7 sm:p-8',
        plan.popular ? 'bg-[#1D1D1D] text-white' : 'bg-[#FAFAFA] text-[#1D1D1D]',
      )}
    >
      <div className="min-h-[1.25rem]">
        {plan.badge ? (
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium',
              plan.popular ? 'bg-white/12 text-white/90' : 'bg-[#EBEBEB] text-[#6B6F76]',
            )}
          >
            {plan.badge}
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-[1.35rem] font-medium tracking-[-0.02em]">{plan.name}</h3>
      <p
        className={cn(
          'mt-2 text-[14px] leading-[1.75]',
          plan.popular ? 'text-white/70' : 'text-[#6B6F76]',
        )}
      >
        {plan.description}
      </p>

      <PlanPrice plan={plan} period={period} />

      <ul className="mt-6 space-y-3">
        {highlights.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[13px] leading-[1.7]">
            <Check
              className={cn(
                'mt-0.5 size-4 shrink-0',
                plan.popular ? 'text-white/80' : 'text-[#1D1D1D]/55',
              )}
              strokeWidth={2}
              aria-hidden
            />
            <span className={plan.popular ? 'text-white/85' : 'text-[#6B6F76]'}>{item}</span>
          </li>
        ))}
      </ul>

      <Link
        href={PLAN_HREF}
        className={cn(
          'mt-8 inline-flex h-11 w-full items-center justify-center rounded-full text-[14px] font-medium transition-colors',
          plan.popular
            ? 'bg-white text-[#1D1D1D] hover:bg-[#FAFAFA]'
            : plan.priceMonthly === 0
              ? agLayout.btnPrimary
              : 'bg-[#1D1D1D] text-white hover:bg-[#0A0A0A]',
        )}
      >
        {plan.ctaLabel}
      </Link>
    </article>
  );
}

export function PublicAgPricingBand() {
  const reduceMotion = useReducedMotion();
  const [period, setPeriod] = useState<BillingPeriod>('monthly');

  return (
    <section
      id="pricing"
      dir="rtl"
      lang="ar"
      className={`${agLayout.sectionMuted} ${agLayout.section}`}
      aria-labelledby="public-pricing-heading"
    >
      <div className={agLayout.container}>
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p className={agLayout.eyebrow}>الأسعار</p>
          <h2 id="public-pricing-heading" className={`${agLayout.sectionTitle} mt-4`}>
            خطط تناسب
            <span className="text-[#9CA3AF]"> نموّ مشروعك</span>
          </h2>
          <p className={`${agLayout.lead} mx-auto mt-5 max-w-xl`}>
            ابدأ مجاناً — متجرك، نماذجك، روابطك، وتحليلاتك في منصة واحدة.
            ارتقِ متى احتجت بأسعار بالدينار العراقي.
          </p>

          <div className="mt-8 flex justify-center">
            <BillingToggle period={period} onChange={setPeriod} />
          </div>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: index * 0.06, ease: EASE }}
            >
              <PlanCard plan={plan} period={period} />
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-8"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="flex flex-col justify-between rounded-[2rem] bg-white p-7 sm:flex-row sm:items-center sm:p-8">
            <div className="max-w-xl text-start">
              <p className="text-[12px] font-medium tracking-[0.12em] text-[#34A853]">
                للمؤسسات
              </p>
              <h3 className="mt-3 text-[1.35rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                حلول مخصصة لفريقك
              </h3>
              <p className={`${agLayout.lead} mt-3 max-w-lg`}>
                تكاملات مخصصة، دعم مباشر، وإعداد للفرق — تواصل معنا لبناء الحل
                المناسب.
              </p>
            </div>
            <Link
              href="#pricing"
              className={`${agLayout.btnSecondary} mt-6 shrink-0 sm:mt-0`}
            >
              تواصل مع المبيعات
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
