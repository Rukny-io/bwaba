'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { siteUrls } from '@/lib/site-urls';
import { agLayout } from '@/lib/public-antigravity-theme';
import { AnimatedNumber } from './animated-number';
import {
  CURRENCY,
  PRICING_FAQS,
  PRICING_PLANS,
  YEARLY_DISCOUNT_PERCENT,
  formatPrice,
  monthlyEquivalentFromYearly,
  type BillingPeriod,
  type PlanId,
  type PricingPlan,
} from '@rukny/forms-shared/pricing-plans';

const PLAN_HREF: Record<PlanId, string> = {
  free: siteUrls.accounts,
  pro: siteUrls.accounts,
  whale: siteUrls.accounts,
  business: siteUrls.accounts,
};

const TRUST_PILLS = ['نماذج', 'متجر', 'روابط', 'تحليلات', 'تكاملات'] as const;

function PlanCta({ plan }: { plan: PricingPlan }) {
  const isFree = plan.priceMonthly === 0;

  return (
    <Link
      href={PLAN_HREF[plan.id]}
      className={cn(
        'inline-flex h-11 w-full items-center justify-center rounded-full text-[14px] font-medium transition-colors',
        isFree
          ? agLayout.btnPrimary
          : plan.popular
            ? 'bg-white text-[#1D1D1D] hover:bg-[#FAFAFA]'
            : 'bg-[#1D1D1D] text-white hover:bg-[#0A0A0A]',
      )}
      data-testid="PricingOptions__primaryAction"
    >
      {plan.ctaLabel}
    </Link>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <ChevronDown
      aria-hidden
      className={cn('size-4 shrink-0 text-[#9CA3AF] transition-transform duration-300', open && 'rotate-180')}
    />
  );
}

function BillingToggle({
  period,
  onChange,
}: {
  period: BillingPeriod;
  onChange: (p: BillingPeriod) => void;
}) {
  return (
    <div
      className="inline-flex max-w-full rounded-full bg-[#F5F5F5] p-1"
      role="group"
      aria-label="دورة الفوترة"
    >
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={cn(
          'min-h-9 rounded-full px-5 py-2 text-[13px] font-medium transition-colors duration-300',
          period === 'monthly' ? 'bg-[#1D1D1D] text-white' : 'text-[#6B6F76] hover:text-[#1D1D1D]',
        )}
      >
        شهري
      </button>
      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={cn(
          'flex min-h-9 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-300 sm:px-5',
          period === 'yearly' ? 'bg-[#1D1D1D] text-white' : 'text-[#6B6F76] hover:text-[#1D1D1D]',
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

function PricingHero({
  period,
  onPeriodChange,
}: {
  period: BillingPeriod;
  onPeriodChange: (p: BillingPeriod) => void;
}) {
  return (
    <header className={`${agLayout.container} pt-10 text-center sm:pt-14 md:pt-16`}>
      <p className={agLayout.eyebrow}>أسعار شفافة</p>

      <h1 className={`${agLayout.sectionTitle} mt-4`}>
        خطط تناسب
        <span className="text-[#9CA3AF]"> نموّ مشروعك</span>
      </h1>

      <p className={`${agLayout.lead} mx-auto mt-5 max-w-2xl`}>
        ابدأ مجاناً على ركني — متجرك، نماذجك، روابطك، وتحليلاتك في منصة واحدة.
        ارتقِ متى احتجت بأسعار بالدينار العراقي.
      </p>

      <div className="mt-8 flex justify-center">
        <BillingToggle period={period} onChange={onPeriodChange} />
      </div>
    </header>
  );
}

function PlanFeatureAccordion({ plan, popular }: { plan: PricingPlan; popular?: boolean }) {
  const introLine = plan.highlights.find((h) => h.endsWith(':'));
  const bullets = plan.highlights.filter((h) => !h.endsWith(':'));
  const heading = introLine ? introLine.replace(/:$/, '') : 'ما المتضمّن';

  return (
    <div
      className={cn('mt-6 pt-6', popular ? 'border-t border-white/10' : 'border-t border-[#EBEBEB]')}
      data-testid="PricingOptions__featureList"
    >
      <details className="group" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <h4
            className={cn('text-[15px] font-normal', popular ? 'text-white/90' : 'text-[#1D1D1D]')}
            data-testid="PricingOptions__featureListHeading"
          >
            {heading}:
          </h4>
          <ChevronDown
            aria-hidden
            className={cn(
              'size-4 shrink-0 transition-transform duration-300 group-open:rotate-180',
              popular ? 'text-white/50' : 'text-[#1D1D1D]/45',
            )}
          />
        </summary>
        <ul className="mt-4 space-y-3">
          {bullets.map((item) => (
            <li
              key={item}
              className={cn(
                'flex items-start gap-2.5 text-[14px] leading-relaxed',
                popular ? 'text-white/80' : 'text-[#6B6F76]',
              )}
              data-testid="PricingOptions__featureListItem"
            >
              <Check
                className={cn('mt-0.5 size-4 shrink-0', popular ? 'text-white/70' : 'text-[#1D1D1D]/55')}
                strokeWidth={2}
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function PlanCard({ plan, period }: { plan: PricingPlan; period: BillingPeriod }) {
  const isFree = plan.priceMonthly === 0;
  const displayPrice = isFree
    ? 0
    : period === 'yearly'
      ? monthlyEquivalentFromYearly(plan.priceYearly)
      : plan.priceMonthly;

  return (
    <article
      className={cn(
        'flex min-w-0 flex-col rounded-[2rem] p-6 sm:p-7 lg:p-8',
        plan.popular ? 'bg-[#1D1D1D] text-white' : 'bg-[#FAFAFA] text-[#1D1D1D]',
      )}
      data-testid="PricingOptions__item"
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

      <div>
        <h3
          className="mt-4 text-[1.35rem] font-medium tracking-[-0.02em]"
          data-testid="PricingOptions__heading"
        >
          {plan.name}
        </h3>
      </div>

      <p
        className={cn(
          'mt-2 text-[14px] leading-[1.75]',
          plan.popular ? 'text-white/70' : 'text-[#6B6F76]',
        )}
        data-testid="PricingOptions__description"
      >
        {plan.description}
      </p>

      <div className="mt-5 sm:mt-6" data-testid="PricingOptions__price">
        {isFree ? (
          <p className="text-[clamp(2rem,4vw,2.75rem)] font-medium tracking-[-0.04em]">
            مجاناً
          </p>
        ) : (
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <AnimatedNumber
              value={displayPrice}
              className="text-[clamp(2rem,4vw,2.75rem)] font-medium leading-none tracking-[-0.04em]"
            />
            <span className="text-[14px] font-medium text-[#9CA3AF]">{CURRENCY}</span>
            <span className="w-full text-[13px] text-[#9CA3AF] sm:w-auto">لكل حساب / شهر</span>
          </p>
        )}
      </div>

      <div className="mt-5 sm:mt-6" data-testid="PricingOptions__actions">
        <PlanCta plan={plan} />
      </div>

      <PlanFeatureAccordion plan={plan} popular={plan.popular} />

      <p
        className={cn(
          'mt-4 text-[12px] leading-relaxed',
          plan.popular ? 'text-white/55' : 'text-[#9CA3AF]',
        )}
        data-testid="PricingOptions__footnote"
      >
        {isFree
          ? 'مجاني للأبد — بدون بطاقة.'
          : period === 'yearly'
            ? `${formatPrice(plan.priceYearly)} ${CURRENCY} يُدفع سنوياً`
            : 'يُدفع شهرياً'}
      </p>
    </article>
  );
}

function PricingPlansGrid({ period }: { period: BillingPeriod }) {
  return (
    <div className="mt-8 sm:mt-12" data-testid="PricingOptions">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        {PRICING_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} period={period} />
        ))}
      </div>
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
        <span className="text-[14px] font-medium text-[#1D1D1D] sm:text-[15px]">{question}</span>
        <ChevronIcon open={open} />
      </button>
      <div
        className={cn(
          'grid transition-all duration-300',
          open ? 'grid-rows-[1fr] pb-4 opacity-100 sm:pb-5' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <p className="text-start text-[13px] leading-relaxed text-[#6B6F76] sm:text-sm">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function PricingView() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');

  return (
    <div className={cn(agLayout.container, 'pb-16 sm:pb-20')}>
      <PricingHero period={period} onPeriodChange={setPeriod} />

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8">
        {TRUST_PILLS.map((item) => (
          <span key={item} className={agLayout.pill}>
            {item}
          </span>
        ))}
      </div>

      <PricingPlansGrid period={period} />

      <section className="mt-14 sm:mt-20" aria-labelledby="faq-heading">
        <div className="mb-6 text-center sm:mb-8">
          <p className={agLayout.eyebrow}>مساعدة</p>
          <h2 id="faq-heading" className={`${agLayout.sectionTitle} mt-4 text-xl sm:text-2xl`}>
            الأسئلة الشائعة
          </h2>
        </div>
        <div className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] bg-[#FAFAFA] px-4 sm:px-6">
          {PRICING_FAQS.map((faq) => (
            <FaqItem key={faq.question} {...faq} />
          ))}
        </div>
      </section>
    </div>
  );
}
