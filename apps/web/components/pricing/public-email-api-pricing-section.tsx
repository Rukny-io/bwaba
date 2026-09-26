'use client';

import { useTranslations } from 'next-intl';
import {
  FEATURED_TRANSACTIONAL_PLAN_IDS,
  EMAIL_API_TRANSACTIONAL_PLANS,
  formatEmailApiIqD,
  formatEmailApiPlanTitle,
  formatEmailApiVolume,
} from '@rukny/email-api-pricing';
import { agLayout } from '@/lib/public-antigravity-theme';
import { siteUrls } from '@/lib/site-urls';

const FEATURED_IDS = new Set(FEATURED_TRANSACTIONAL_PLAN_IDS);

export function PublicEmailApiPricingSection({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('pricing.emailApi');
  const featured = EMAIL_API_TRANSACTIONAL_PLANS.filter((plan) =>
    FEATURED_IDS.has(plan.id as (typeof FEATURED_TRANSACTIONAL_PLAN_IDS)[number]),
  );
  const scale = EMAIL_API_TRANSACTIONAL_PLANS.filter(
    (plan) => plan.selfServe && !FEATURED_IDS.has(plan.id as (typeof FEATURED_TRANSACTIONAL_PLAN_IDS)[number]),
  );

  return (
    <section
      id="email-api"
      className={compact ? 'mt-10 sm:mt-12' : 'mt-14 sm:mt-16'}
      aria-labelledby="public-email-api-pricing-heading"
    >
      <div className={compact ? 'text-center' : 'mx-auto max-w-2xl text-center'}>
        <p className={agLayout.eyebrow}>{t('eyebrow')}</p>
        <h2
          id="public-email-api-pricing-heading"
          className={`${agLayout.sectionTitle} mt-3 ${compact ? 'text-[clamp(1.35rem,4vw,2rem)]' : ''}`}
        >
          {t('title')}
          <span className="text-[#9CA3AF]">{t('titleMuted')}</span>
        </h2>
        <p className={`${agLayout.lead} mx-auto mt-4 max-w-2xl`}>{t('lead')}</p>
      </div>

      <div className="mx-auto mt-8 max-w-5xl">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {featured.map((plan) => (
            <article
              key={plan.id}
              className="flex h-full flex-col rounded-[1.5rem] bg-[#FAFAFA] p-5 sm:p-6"
            >
              <p className="text-[15px] font-medium text-[#1D1D1D]">{formatEmailApiPlanTitle(plan)}</p>
              <p className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-[#1D1D1D] sm:text-[2rem]">
                {formatEmailApiIqD(plan.priceMonthlyIqd)}
                {plan.priceMonthlyIqd > 0 ? (
                  <span className="text-[14px] font-medium text-[#9CA3AF]"> / mo</span>
                ) : null}
              </p>
              <p className="mt-2 text-[14px] text-[#6B6F76]">{formatEmailApiVolume(plan)}</p>
            </article>
          ))}
        </div>

        {scale.length > 0 ? (
          <ul className="mx-auto mt-10 max-w-3xl">
            <li className="mb-4 text-center text-[12px] font-medium tracking-[0.12em] text-[#9CA3AF]">
              {t('scaleEyebrow')}
            </li>
            {scale.map((plan) => (
              <li
                key={plan.id}
                className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-baseline sm:gap-x-8 sm:py-5"
              >
                <span className="text-[15px] font-medium text-[#1D1D1D]">{formatEmailApiPlanTitle(plan)}</span>
                <span className="text-[15px] text-[#1D1D1D] sm:text-end">
                  {formatEmailApiIqD(plan.priceMonthlyIqd)}
                  {plan.priceMonthlyIqd > 0 ? ' / mo' : ''}
                </span>
                <span className="text-[14px] text-[#6B6F76] sm:text-end">
                  {formatEmailApiVolume(plan)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mx-auto mt-8 max-w-2xl text-center text-[13px] leading-relaxed text-[#9CA3AF]">
          {t('footnote')}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={`${siteUrls.mail}/pricing`} className={agLayout.btnPrimary}>
            {t('mailPricingCta')}
          </a>
          <a
            href={`${siteUrls.developers}/documentation/email-api`}
            className={agLayout.btnGhost}
          >
            {t('developersCta')}
          </a>
        </div>
      </div>
    </section>
  );
}
