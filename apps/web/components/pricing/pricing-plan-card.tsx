'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown } from 'lucide-react';
import {
  formatPrice,
  monthlyEquivalentFromYearly,
  type BillingPeriod,
  type PlanId,
} from '@rukny/forms-shared/pricing-plans';
import { agLayout } from '@/lib/public-antigravity-theme';
import { siteUrls } from '@/lib/site-urls';
import type { LocalizedPricingPlan } from '@/lib/use-localized-pricing';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from './animated-number';

const PLAN_HREF: Record<PlanId, string> = {
  free: siteUrls.accounts,
  pro: siteUrls.accounts,
  whale: siteUrls.accounts,
  business: siteUrls.accounts,
};

const PREVIEW_FEATURES = 3;

function PlanPrice({
  plan,
  period,
  popular,
  freePriceLabel,
  currencyLabel,
  perMonthLabel,
}: {
  plan: LocalizedPricingPlan;
  period: BillingPeriod;
  popular?: boolean;
  freePriceLabel: string;
  currencyLabel: string;
  perMonthLabel: string;
}) {
  const isFree = plan.priceMonthly === 0;
  const displayPrice = isFree
    ? 0
    : period === 'yearly'
      ? monthlyEquivalentFromYearly(plan.priceYearly)
      : plan.priceMonthly;

  if (isFree) {
    return (
      <p className="text-end text-[1.35rem] font-medium leading-none tracking-[-0.03em] sm:text-[1.5rem]">
        {freePriceLabel}
      </p>
    );
  }

  return (
    <div className="text-end">
      <p className="flex items-baseline justify-end gap-1">
        <AnimatedNumber
          value={displayPrice}
          className="text-[1.35rem] font-medium leading-none tracking-[-0.03em] sm:text-[1.5rem]"
        />
        <span
          className={cn(
            'text-[11px] font-medium',
            popular ? 'text-white/55' : 'text-[#9CA3AF]',
          )}
        >
          {currencyLabel}
        </span>
      </p>
      <p className={cn('mt-0.5 text-[10px]', popular ? 'text-white/45' : 'text-[#9CA3AF]')}>
        {perMonthLabel}
      </p>
    </div>
  );
}

export function PricingPlanCard({
  plan,
  period,
  compact = true,
}: {
  plan: LocalizedPricingPlan;
  period: BillingPeriod;
  compact?: boolean;
}) {
  const t = useTranslations('pricing');
  const isFree = plan.priceMonthly === 0;
  const popular = plan.popular;
  const bullets = plan.localizedHighlights.filter((item) => !item.endsWith(':'));
  const preview = bullets.slice(0, PREVIEW_FEATURES);
  const rest = bullets.slice(PREVIEW_FEATURES);

  return (
    <article
      className={cn(
        'group relative flex h-full min-w-0 flex-col overflow-hidden',
        compact ? 'rounded-[1.25rem] p-4 sm:p-5' : 'rounded-[2rem] p-6 sm:p-7 lg:p-8',
        popular ? 'bg-[#1D1D1D] text-white' : 'bg-[#FAFAFA] text-[#1D1D1D]',
      )}
      data-testid="PricingOptions__item"
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {plan.badge ? (
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                popular ? 'bg-white/12 text-white/90' : 'bg-white/80 text-[#6B6F76]',
              )}
            >
              {plan.badge}
            </span>
          ) : (
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                popular ? 'bg-white/10 text-white/70' : 'bg-white/70 text-[#9CA3AF]',
              )}
            >
              {plan.nameEn}
            </span>
          )}
          <h3
            className={cn(
              'mt-2 font-medium tracking-[-0.02em]',
              compact ? 'text-[1.05rem] sm:text-[1.125rem]' : 'text-[1.35rem]',
            )}
            data-testid="PricingOptions__heading"
          >
            {plan.name}
          </h3>
          <p
            className={cn(
              'mt-1 line-clamp-2 leading-[1.6]',
              compact ? 'text-[12px] sm:text-[13px]' : 'text-[14px] leading-[1.75]',
              popular ? 'text-white/65' : 'text-[#6B6F76]',
            )}
            data-testid="PricingOptions__description"
          >
            {plan.description}
          </p>
        </div>

        <div className="relative shrink-0 pt-5" data-testid="PricingOptions__price">
          <PlanPrice
            plan={plan}
            period={period}
            popular={popular}
            freePriceLabel={t('card.freePrice')}
            currencyLabel={t('currency')}
            perMonthLabel={t('card.perMonth')}
          />
        </div>
      </div>

      <ul
        className={cn(
          'relative mt-3 space-y-1.5',
          compact ? 'sm:mt-4' : 'mt-6 space-y-3',
        )}
        data-testid="PricingOptions__featureList"
      >
        {preview.map((item) => (
          <li
            key={item}
            className={cn(
              'flex items-start gap-2',
              compact ? 'text-[11px] leading-[1.55] sm:text-[12px]' : 'text-[13px] leading-[1.7]',
            )}
            data-testid="PricingOptions__featureListItem"
          >
            <Check
              className={cn(
                'mt-0.5 shrink-0',
                compact ? 'size-3' : 'size-4',
                popular ? 'text-white/70' : 'text-[#1D1D1D]/45',
              )}
              strokeWidth={2.25}
              aria-hidden
            />
            <span className={popular ? 'text-white/80' : 'text-[#6B6F76]'}>{item}</span>
          </li>
        ))}
      </ul>

      {rest.length > 0 ? (
        <details className="relative mt-2 group/details">
          <summary
            className={cn(
              'flex cursor-pointer list-none items-center gap-1 text-[11px] font-medium [&::-webkit-details-marker]:hidden',
              popular ? 'text-white/55 hover:text-white/75' : 'text-[#9CA3AF] hover:text-[#6B6F76]',
            )}
          >
            {t('card.moreFeatures', { count: rest.length })}
            <ChevronDown
              className="size-3 transition-transform group-open/details:rotate-180"
              aria-hidden
            />
          </summary>
          <ul
            className={cn(
              'mt-2 space-y-1.5 border-t border-dashed pt-2',
              popular ? 'border-white/15' : 'border-[#EBEBEB]/80',
            )}
          >
            {rest.map((item) => (
              <li
                key={item}
                className={cn(
                  'flex items-start gap-2 text-[11px] leading-[1.55]',
                  popular ? 'text-white/70' : 'text-[#6B6F76]',
                )}
              >
                <Check
                  className={cn(
                    'mt-0.5 size-3 shrink-0',
                    popular ? 'text-white/55' : 'text-[#1D1D1D]/40',
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

      <div
        className={cn('relative mt-auto', compact ? 'pt-4' : 'pt-6')}
        data-testid="PricingOptions__actions"
      >
        <Link
          href={PLAN_HREF[plan.id]}
          className={cn(
            'inline-flex w-full items-center justify-center rounded-full font-medium transition-colors',
            compact ? 'h-9 text-[13px]' : 'h-11 text-[14px]',
            isFree
              ? popular
                ? 'bg-white text-[#1D1D1D] hover:bg-[#FAFAFA]'
                : agLayout.btnPrimary
              : popular
                ? 'bg-white text-[#1D1D1D] hover:bg-[#FAFAFA]'
                : 'bg-[#1D1D1D] text-white hover:bg-[#0A0A0A]',
          )}
          data-testid="PricingOptions__primaryAction"
        >
          {plan.ctaLabel}
        </Link>

        <p
          className={cn(
            'mt-2 text-center text-[10px] leading-relaxed',
            popular ? 'text-white/45' : 'text-[#9CA3AF]',
          )}
          data-testid="PricingOptions__footnote"
        >
          {isFree
            ? t('card.freeForever')
            : period === 'yearly'
              ? t('card.yearly', {
                  price: formatPrice(plan.priceYearly),
                  currency: t('currency'),
                })
              : t('card.monthly')}
        </p>
      </div>
    </article>
  );
}
