'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { YEARLY_DISCOUNT_PERCENT, type BillingPeriod } from '@rukny/forms-shared/pricing-plans';
import { PricingPlanCard } from '@/components/pricing/pricing-plan-card';
import { PublicEmailApiPricingSection } from '@/components/pricing/public-email-api-pricing-section';
import { useLocalizedPricingPlans } from '@/lib/use-localized-pricing';
import { agLayout } from '@/lib/public-antigravity-theme';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

function BillingToggle({
  period,
  onChange,
}: {
  period: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}) {
  const t = useTranslations('pricing.billing');

  return (
    <div
      className="inline-flex rounded-full bg-[#F5F5F5] p-1"
      role="group"
      aria-label={t('aria')}
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
        {t('monthly')}
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

export function PublicAgPricingBand() {
  const t = useTranslations('home.pricing');
  const reduceMotion = useReducedMotion();
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const plans = useLocalizedPricingPlans();

  return (
    <section
      id="pricing"
      className={`${agLayout.sectionMuted} py-16 sm:py-24 md:py-28`}
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
          <p className={agLayout.eyebrow}>{t('eyebrow')}</p>
          <h2 id="public-pricing-heading" className={`${agLayout.sectionTitle} mt-4`}>
            {t('title')}
            <span className="text-[#9CA3AF]">{t('titleMuted')}</span>
          </h2>
          <p className={`${agLayout.lead} mx-auto mt-4 max-w-xl sm:mt-5`}>{t('lead')}</p>

          <div className="mt-6 flex justify-center sm:mt-7">
            <BillingToggle period={period} onChange={setPeriod} />
          </div>
        </motion.div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.05, ease: EASE }}
            >
              <PricingPlanCard plan={plan} period={period} />
            </motion.div>
          ))}
        </div>

        <PublicEmailApiPricingSection compact />

        <motion.div
          className="mt-6 sm:mt-8"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="flex flex-col justify-between rounded-[1.25rem] bg-white p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="max-w-xl text-start">
              <p className="text-[11px] font-medium tracking-[0.12em] text-[#34A853]">
                {t('enterprise.eyebrow')}
              </p>
              <h3 className="mt-2 text-[1.125rem] font-medium tracking-[-0.02em] text-[#1D1D1D] sm:text-[1.25rem]">
                {t('enterprise.title')}
              </h3>
              <p className={`${agLayout.lead} mt-2 max-w-lg text-[14px]`}>
                {t('enterprise.lead')}
              </p>
            </div>
            <Link
              href="/enterprise"
              className={`${agLayout.btnSecondary} mt-4 h-9 shrink-0 px-5 text-[13px] sm:mt-0`}
            >
              {t('enterprise.cta')}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
