'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { siteUrls } from '@/lib/site-urls';
import { marketingLayout } from '@/lib/marketing-theme';
import { AnimatedNumber } from './animated-number';
import {
  CURRENCY,
  FEATURE_SECTIONS,
  PRICING_FAQS,
  PRICING_PLANS,
  YEARLY_DISCOUNT_PERCENT,
  formatPrice,
  monthlyEquivalentFromYearly,
  type BillingPeriod,
  type CellValue,
  type FeatureSection,
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

const BRAND = '#062c30';
const TEXT = '#132327';
const BORDER = '#E8ECF0';

function PlanCta({
  plan,
  variant = 'card',
}: {
  plan: PricingPlan;
  variant?: 'card' | 'table' | 'table-inline';
}) {
  const isFree = plan.priceMonthly === 0;

  const className =
    variant === 'card'
      ? 'inline-flex h-10 w-full items-center justify-center rounded-md text-[14px] font-semibold transition-opacity hover:opacity-90'
      : variant === 'table-inline'
        ? 'inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[11px] font-semibold transition-opacity hover:opacity-85 sm:h-9 sm:px-4 sm:text-[12px]'
        : 'inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-[12px] font-semibold transition-opacity hover:opacity-85';

  return (
    <Link
      href={PLAN_HREF[plan.id]}
      className={className}
      data-testid="PricingOptions__primaryAction"
      style={
        isFree
          ? {
              border: `1px solid ${BORDER}`,
              backgroundColor: '#ffffff',
              color: TEXT,
            }
          : plan.popular
            ? { backgroundColor: BRAND, color: '#ffffff' }
            : { backgroundColor: TEXT, color: '#ffffff' }
      }
    >
      {plan.ctaLabel}
    </Link>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <ChevronDown
      aria-hidden
      className={cn('size-4 shrink-0 text-[#132327]/45 transition-transform duration-300', open && 'rotate-180')}
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
      className="inline-flex max-w-full rounded-full border border-[#E8ECF0] bg-white/80 p-1 shadow-[0_2px_12px_rgba(6,44,48,0.04)] backdrop-blur-sm"
      role="group"
      aria-label="دورة الفوترة"
    >
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={cn(
          'min-h-9 rounded-full px-4 py-2 text-[12px] font-medium transition-all duration-200 sm:px-5 sm:text-[13px]',
          period === 'monthly' ? 'bg-[#062c30] text-white shadow-sm' : 'text-[#132327]/55 hover:text-[#132327]',
        )}
      >
        شهري
      </button>
      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={cn(
          'flex min-h-9 items-center gap-1 rounded-full px-3 py-2 text-[12px] font-medium transition-all duration-200 sm:gap-1.5 sm:px-4 sm:text-[13px]',
          period === 'yearly' ? 'bg-[#062c30] text-white shadow-sm' : 'text-[#132327]/55 hover:text-[#132327]',
        )}
      >
        سنوي
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[9px] font-semibold sm:text-[10px]',
            period === 'yearly' ? 'bg-white/20 text-white' : 'bg-[#EEF2F2] text-[#02797E]',
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
    <header className="mx-auto w-full max-w-3xl px-4 pt-4 text-center sm:px-6 sm:pt-8 md:pt-10">
      <div className={cn('home-hero-enter mb-4 sm:mb-5', marketingLayout.heroBadge)}>
        <Sparkles className="size-3 shrink-0 text-[#02797E]" aria-hidden />
        <span>أسعار شفافة — بدون مفاجآت</span>
      </div>

      <h1 className={cn('home-hero-enter-delayed', marketingLayout.heroTitle)}>
        خطط تناسب نموّ مشروعك
      </h1>

      <p className={cn('home-hero-enter-delayed mt-3 sm:mt-4', marketingLayout.heroLead, 'max-w-2xl')}>
        ابدأ مجاناً على ركني — متجرك، نماذجك، روابطك، وتحليلاتك في منصة واحدة.
        ارتقِ متى احتجت بأسعار بالدينار العراقي.
      </p>

      <div className="home-hero-enter-delayed mt-6 flex justify-center sm:mt-8">
        <BillingToggle period={period} onChange={onPeriodChange} />
      </div>
    </header>
  );
}

function PlanFeatureAccordion({ plan }: { plan: PricingPlan }) {
  const introLine = plan.highlights.find((h) => h.endsWith(':'));
  const bullets = plan.highlights.filter((h) => !h.endsWith(':'));
  const heading = introLine ? introLine.replace(/:$/, '') : 'ما المتضمّن';

  return (
    <div
      className="mt-6 border-t border-[#E8ECF0] pt-6"
      data-testid="PricingOptions__featureList"
    >
      <details className="group" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <h4
            className="text-[15px] font-normal text-[#132327]"
            data-testid="PricingOptions__featureListHeading"
          >
            {heading}:
          </h4>
          <ChevronDown
            aria-hidden
            className="size-4 shrink-0 text-[#132327]/45 transition-transform duration-300 group-open:rotate-180"
          />
        </summary>
        <ul className="mt-4 space-y-3">
          {bullets.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#132327]/70"
              data-testid="PricingOptions__featureListItem"
            >
              <Check className="mt-0.5 size-4 shrink-0 text-[#02797E]" strokeWidth={2.25} aria-hidden />
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
        'flex min-w-0 flex-col border-b border-[#E8ECF0] p-5 sm:p-6 lg:border-b-0 lg:border-s lg:p-7 lg:first:border-s-0',
        plan.popular &&
          'bg-[linear-gradient(180deg,rgba(2,121,126,0.08)_0%,rgba(255,255,255,0)_100%)]',
      )}
      data-testid="PricingOptions__item"
    >
      <div>
        <h3
          className="text-xl font-bold tracking-tight text-[#132327] sm:text-2xl"
          data-testid="PricingOptions__heading"
        >
          {plan.name}
        </h3>
      </div>

      <p
        className="mt-2 text-[14px] leading-relaxed text-[#132327]/55 sm:mt-3"
        data-testid="PricingOptions__description"
      >
        {plan.description}
      </p>

      <div className="mt-5 sm:mt-6" data-testid="PricingOptions__price">
        {isFree ? (
          <p className="flex flex-wrap items-baseline gap-x-1">
            <span className="text-[2rem] font-normal leading-none tracking-tight text-[#132327] sm:text-[2.5rem]">
              مجاناً
            </span>
          </p>
        ) : (
          <p className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
            <AnimatedNumber
              value={displayPrice}
              className="text-[2rem] font-normal leading-none tracking-tight text-[#132327] sm:text-[2.5rem]"
            />
            <span className="text-xs font-normal text-[#132327]/55">{CURRENCY}</span>
            <span className="w-full text-[14px] text-[#132327]/55 sm:w-auto">لكل حساب / شهر</span>
          </p>
        )}
      </div>

      <div className="mt-5 sm:mt-6" data-testid="PricingOptions__actions">
        <PlanCta plan={plan} />
      </div>

      <PlanFeatureAccordion plan={plan} />

      <p className="mt-4 text-[12px] leading-relaxed text-[#132327]/50" data-testid="PricingOptions__footnote">
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
    <div className="mt-8 sm:mt-12">
      <div
        className="overflow-hidden rounded-2xl border border-[#E8ECF0] bg-[linear-gradient(180deg,rgba(238,242,242,0.65)_0%,rgba(255,255,255,0.98)_38%,#ffffff_100%)] shadow-[0_16px_48px_rgba(6,44,48,0.08)]"
        data-testid="PricingOptions"
      >
        <div className="grid grid-cols-1 lg:grid-cols-4">
          {PRICING_PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} period={period} />
          ))}
        </div>
      </div>

      <div
        className="mt-3 hidden grid-cols-4 gap-0 lg:grid"
        data-testid="PricingOptions__labels"
        aria-hidden
      >
        {PRICING_PLANS.map((plan) => (
          <div key={plan.id} className="flex min-h-7 justify-center">
            {plan.badge ? (
              <span className="rounded-full bg-[#EEF2F2] px-3 py-1 text-[11px] font-bold text-[#02797E]">
                {plan.badge}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonCell({ value, compact = false }: { value: CellValue; compact?: boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center" aria-label="متضمّن">
        <Check
          className={cn(compact ? 'size-4' : 'size-[18px]', 'text-[#02797E]')}
          strokeWidth={2.25}
          aria-hidden
        />
      </span>
    );
  }

  if (value === false) {
    return <span className="text-[13px] text-[#132327]/25">—</span>;
  }

  return (
    <span className="text-[12px] font-medium leading-snug text-[#132327] sm:text-[13px]">{value}</span>
  );
}

function ComparisonMatrixMobile() {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('pro');
  const selectedPlan = PRICING_PLANS.find((plan) => plan.id === selectedPlanId) ?? PRICING_PLANS[0];

  return (
    <div
      id="compare-features"
      className="overflow-hidden rounded-2xl border border-[#E8ECF0] bg-white/80 backdrop-blur-sm lg:hidden"
    >
      <div className="pricing-comparison-sticky-header">
        <div className="pricing-comparison-sticky-inner pricing-comparison-sticky-inner--table">
          <div className="space-y-3 px-4 py-4 sm:px-5">
            <div
              className="flex gap-1 overflow-x-auto rounded-full border border-[#E8ECF0] bg-[#F6F7F8] p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="اختر الباقة"
            >
              {PRICING_PLANS.map((plan) => {
                const active = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={cn(
                      'min-h-9 shrink-0 rounded-full px-4 text-[13px] font-medium transition-colors',
                      active ? 'bg-[#062c30] text-white' : 'text-[#132327]/55',
                    )}
                  >
                    {plan.name}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-[#132327]/55">
                ميزات{' '}
                <span className="font-semibold text-[#132327]">{selectedPlan.name}</span>
              </p>
              <PlanCta plan={selectedPlan} variant="table" />
            </div>
          </div>
        </div>
      </div>

      <div className="pricing-compare-stack divide-y divide-[#E8ECF0]">
        {FEATURE_SECTIONS.map((section) => (
          <MobileFeatureSection key={section.id} section={section} planId={selectedPlanId} />
        ))}
      </div>
    </div>
  );
}

function MobileFeatureSection({
  section,
  planId,
}: {
  section: FeatureSection;
  planId: PlanId;
}) {
  return (
    <div>
      <div className="bg-[#F6F7F8]/80 px-4 py-5 sm:px-5">
        {section.eyebrow ? (
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#132327]/45">
            {section.eyebrow}
          </p>
        ) : null}
        <h3 className="text-base font-semibold text-[#132327]">{section.title}</h3>
        {section.description ? (
          <p className="mt-1 text-[12px] leading-relaxed text-[#132327]/55">{section.description}</p>
        ) : null}
      </div>

      <div>
        {section.rows.map((row, index) => (
          <div
            key={row.label}
            className={cn(
              'grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3.5',
              index % 2 === 0 ? 'bg-white/70' : 'bg-[#F6F7F8]/50',
            )}
          >
            <div>
              <span className="block text-[13px] font-medium text-[#132327]">{row.label}</span>
              {row.hint ? (
                <span className="mt-0.5 block text-[11px] text-[#132327]/50">{row.hint}</span>
              ) : null}
            </div>
            <ComparisonCell value={row.values[planId]} compact />
          </div>
        ))}
      </div>
    </div>
  );
}

const COMPARE_GRID_CLASS =
  'grid grid-cols-[minmax(11rem,1.15fr)_repeat(4,minmax(0,1fr))]';

function ComparisonTableDesktop() {
  return (
    <div
      id="compare-features"
      className="pricing-compare-desktop overflow-hidden rounded-2xl border border-[#E8ECF0] bg-white/80 shadow-[0_8px_30px_rgba(6,44,48,0.04)] backdrop-blur-sm"
    >
      <div
        className={cn(
          COMPARE_GRID_CLASS,
          'sticky top-20 z-30 items-end border-b border-[#E8ECF0] bg-white/97 py-5 backdrop-blur-md',
        )}
      >
        <div className="px-5 pb-1">
          <span className="text-base font-bold text-[#132327]">الميزة</span>
        </div>
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              'flex flex-col items-center gap-2.5 border-s border-[#E8ECF0] px-3 py-1 text-center',
              plan.popular && 'bg-[linear-gradient(180deg,rgba(2,121,126,0.08)_0%,transparent_100%)]',
            )}
          >
            <span className="text-sm font-bold text-[#132327] sm:text-base">{plan.name}</span>
            <PlanCta plan={plan} variant="table-inline" />
          </div>
        ))}
      </div>

      {FEATURE_SECTIONS.map((section, index) => (
        <DesktopFeatureSection key={section.id} section={section} isFirst={index === 0} />
      ))}
    </div>
  );
}

function DesktopFeatureSection({
  section,
  isFirst = false,
}: {
  section: FeatureSection;
  isFirst?: boolean;
}) {
  return (
    <section aria-labelledby={`compare-section-${section.id}`}>
      <div
        className={cn(
          'border-b border-[#E8ECF0] bg-[#F6F7F8]/80 px-5 py-5',
          !isFirst && 'border-t border-[#E8ECF0]',
        )}
      >
        {section.eyebrow ? (
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#132327]/45">
            {section.eyebrow}
          </p>
        ) : null}
        <h3
          id={`compare-section-${section.id}`}
          className="text-lg font-semibold text-[#132327] sm:text-xl"
        >
          {section.title}
        </h3>
        {section.description ? (
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[#132327]/55 sm:text-[14px]">
            {section.description}
          </p>
        ) : null}
      </div>

      {section.rows.map((row, index) => (
        <div
          key={row.label}
          className={cn(
            COMPARE_GRID_CLASS,
            'items-center border-b border-[#E8ECF0]/90 last:border-b-0',
            index % 2 === 1 && 'bg-[#F6F7F8]/35',
          )}
        >
          <div className="px-5 py-4">
            <span className="block text-[14px] font-medium text-[#132327]">{row.label}</span>
            {row.hint ? (
              <span className="mt-1 block text-[12px] leading-relaxed text-[#132327]/50">{row.hint}</span>
            ) : null}
          </div>
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'flex min-h-[3.25rem] items-center justify-center border-s border-[#E8ECF0]/90 px-3 py-4 text-center',
                plan.popular && 'bg-[#EEF2F2]/25',
              )}
            >
              <ComparisonCell value={row.values[plan.id]} />
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

function ComparisonMatrix() {
  return (
    <section id="compare" className="mt-14 scroll-mt-24 sm:mt-24" aria-labelledby="comparison-heading">
      <div className="mb-8 text-center sm:mb-10 lg:mb-12">
        <p className={cn('mb-2', marketingLayout.sectionEyebrow)}>مقارنة تفصيلية</p>
        <h2 id="comparison-heading" className={cn(marketingLayout.sectionTitle, 'text-xl sm:text-2xl lg:text-[1.75rem]')}>
          كل ما تحصل عليه في كل باقة
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-[#132327]/55">
          نماذج، متجر، تحليلات، تكاملات، وأمان — في جدول واحد واضح.
        </p>
      </div>

      <ComparisonMatrixMobile />
      <div className="hidden lg:block">
        <ComparisonTableDesktop />
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#E8ECF0] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-right sm:py-5"
      >
        <span className="text-start text-[14px] font-medium text-[#132327] sm:text-[15px]">{question}</span>
        <ChevronIcon open={open} />
      </button>
      <div
        className={cn(
          'grid transition-all duration-300',
          open ? 'grid-rows-[1fr] pb-4 opacity-100 sm:pb-5' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <p className="text-start text-[13px] leading-relaxed text-[#132327]/55 sm:text-sm">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function PricingView() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');

  return (
    <div className={cn(marketingLayout.container, 'pb-8 sm:pb-12')}>
      <PricingHero period={period} onPeriodChange={setPeriod} />

      <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 sm:mt-10 sm:gap-2">
        {TRUST_PILLS.map((item) => (
          <span
            key={item}
            className="rounded-full border border-[#E8ECF0] bg-white/70 px-2.5 py-0.5 text-[11px] font-medium text-[#132327]/55 backdrop-blur-sm sm:px-3 sm:py-1 sm:text-[12px]"
          >
            {item}
          </span>
        ))}
      </div>

      <PricingPlansGrid period={period} />

      <ComparisonMatrix />

      <section className="mt-14 sm:mt-20" aria-labelledby="faq-heading">
        <div className="mb-6 text-center sm:mb-8">
          <p className={cn('mb-2', marketingLayout.sectionEyebrow)}>مساعدة</p>
          <h2 id="faq-heading" className={cn(marketingLayout.sectionTitle, 'text-xl sm:text-2xl')}>
            الأسئلة الشائعة
          </h2>
        </div>
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#E8ECF0] bg-white/85 px-4 backdrop-blur-sm sm:rounded-[1.75rem] sm:px-6">
          {PRICING_FAQS.map((faq) => (
            <FaqItem key={faq.question} {...faq} />
          ))}
        </div>
      </section>
    </div>
  );
}
