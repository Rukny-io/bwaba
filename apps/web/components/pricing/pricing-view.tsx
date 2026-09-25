'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { agLayout } from '@/lib/public-antigravity-theme';
import {
  YEARLY_DISCOUNT_PERCENT,
  type BillingPeriod,
} from '@rukny/forms-shared/pricing-plans';
import { useLocalizedPricingPlans } from '@/lib/use-localized-pricing';
import { PricingPlanCard } from './pricing-plan-card';

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
  const t = useTranslations('pricing.billing');

  return (
    <div
      className="inline-flex max-w-full rounded-full bg-[#F5F5F5] p-1"
      role="group"
      aria-label={t('aria')}
    >
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={cn(
          'min-h-9 rounded-full px-5 py-2 text-[13px] font-medium transition-colors duration-300',
          period === 'monthly' ? 'bg-[#1D1D1D] text-white' : 'text-[#6B6F76] hover:text-[#1D1D1D]',
        )}
      >
        {t('monthly')}
      </button>
      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={cn(
          'flex min-h-9 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-300 sm:px-5',
          period === 'yearly' ? 'bg-[#1D1D1D] text-white' : 'text-[#6B6F76] hover:text-[#1D1D1D]',
        )}
      >
        {t('yearly')}
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
            period === 'yearly' ? 'bg-white/15 text-white' : 'bg-[#EBEBEB] text-[#6B6F76]',
          )}
        >
          {t('discount', { percent: YEARLY_DISCOUNT_PERCENT })}
        </span>
      </button>
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
  const t = useTranslations('pricing');
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const plans = useLocalizedPricingPlans();
  const trustPills = t.raw('trustPills') as string[];
  const faqItems = t.raw('faq.items') as Array<{ question: string; answer: string }>;

  return (
    <div className={cn(agLayout.container, 'pb-14 sm:pb-16')}>
      <header className="pt-8 text-center sm:pt-12 md:pt-14">
        <p className={agLayout.eyebrow}>{t('eyebrow')}</p>
        <h1 className={`${agLayout.sectionTitle} mt-3 text-[clamp(1.75rem,5vw,2.75rem)]`}>
          {t('title')}
          <span className="text-[#9CA3AF]">{t('titleMuted')}</span>
        </h1>
        <p className={`${agLayout.lead} mx-auto mt-4 max-w-xl text-[15px] sm:mt-5`}>
          {t('lead')}
        </p>
        <div className="mt-6 flex justify-center sm:mt-7">
          <BillingToggle period={period} onChange={setPeriod} />
        </div>
      </header>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:mt-6">
        {trustPills.map((item) => (
          <span
            key={item}
            className="rounded-full bg-[#F5F5F5] px-2.5 py-1 text-[11px] font-medium text-[#6B6F76]"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="mt-6 sm:mt-8" data-testid="PricingOptions">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
          {plans.map((plan) => (
            <PricingPlanCard key={plan.id} plan={plan} period={period} />
          ))}
        </div>
      </div>

      <section className="mt-12 sm:mt-16" aria-labelledby="faq-heading">
        <div className="mb-5 text-center sm:mb-6">
          <p className={agLayout.eyebrow}>{t('faq.eyebrow')}</p>
          <h2
            id="faq-heading"
            className="mt-3 text-xl font-medium tracking-[-0.02em] text-[#1D1D1D] sm:text-2xl"
          >
            {t('faq.title')}
          </h2>
        </div>
        <div className="mx-auto max-w-2xl overflow-hidden rounded-[1.5rem] bg-[#FAFAFA] px-4 sm:px-6">
          {faqItems.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>
    </div>
  );
}
