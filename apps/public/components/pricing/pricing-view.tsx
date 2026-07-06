'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { siteUrls } from '@/lib/site-urls';
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

const BRAND = '#062c30';
const TEXT = '#132327';
const MUTED = 'rgba(19, 35, 39, 0.55)';
const BORDER = '#E8ECF0';
const SURFACE = '#F6F7F8';

const PLAN_HREF: Record<PlanId, string> = {
  free: siteUrls.forms,
  pro: siteUrls.formsLogin,
  whale: siteUrls.formsLogin,
  business: siteUrls.formsLogin,
};

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
      ? 'mt-6 inline-flex h-10 w-full items-center justify-center rounded-full text-[13px] font-semibold transition-opacity hover:opacity-85'
      : variant === 'table-inline'
        ? 'inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[11px] font-semibold transition-opacity hover:opacity-85 sm:h-9 sm:px-4 sm:text-[12px]'
        : 'inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-[12px] font-semibold transition-opacity hover:opacity-85';

  return (
    <a
      href={PLAN_HREF[plan.id]}
      className={className}
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
    </a>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
      style={{ color: MUTED }}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
    <div className="inline-flex flex-col items-center gap-2">
      <div
        className="inline-flex rounded-full border p-1"
        style={{ borderColor: BORDER, backgroundColor: SURFACE }}
        role="group"
        aria-label="دورة الفوترة"
      >
        <button
          type="button"
          onClick={() => onChange('monthly')}
          className="min-h-9 rounded-full px-5 py-2 text-[13px] font-medium transition-colors"
          style={
            period === 'monthly'
              ? { backgroundColor: TEXT, color: '#ffffff' }
              : { color: MUTED }
          }
        >
          شهري
        </button>
        <button
          type="button"
          onClick={() => onChange('yearly')}
          className="flex min-h-9 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
          style={
            period === 'yearly'
              ? { backgroundColor: TEXT, color: '#ffffff' }
              : { color: MUTED }
          }
        >
          سنوي
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={
              period === 'yearly'
                ? { backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }
                : { backgroundColor: '#eef2f2', color: BRAND }
            }
          >
            −{YEARLY_DISCOUNT_PERCENT}%
          </span>
        </button>
      </div>
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

  const introLine = plan.highlights.find((h) => h.endsWith(':'));
  const bullets = plan.highlights.filter((h) => !h.endsWith(':')).slice(0, introLine ? 5 : 6);

  return (
    <article
      className="flex h-full flex-col rounded-4xl border p-6 sm:p-7"
      style={{
        borderColor: plan.popular ? BRAND : BORDER,
        backgroundColor: '#ffffff',
        boxShadow: plan.popular ? `0 0 0 1px ${BRAND}` : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold tracking-tight" style={{ color: TEXT }}>
          {plan.name}
        </h3>
        {plan.badge ? (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: '#eef2f2', color: BRAND }}
          >
            {plan.badge}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-baseline gap-1">
        {isFree ? (
          <span className="text-3xl font-bold tracking-tight" style={{ color: TEXT }}>
            مجاناً
          </span>
        ) : (
          <>
            <AnimatedNumber value={displayPrice} className="text-3xl font-bold tracking-tight" />
            <span className="text-sm font-medium" style={{ color: MUTED }}>
              {CURRENCY}
            </span>
            <span className="text-sm" style={{ color: MUTED }}>
              / شهر
            </span>
          </>
        )}
      </div>

      <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
        {isFree
          ? 'مجاني للأبد.'
          : period === 'yearly'
            ? `${formatPrice(plan.priceYearly)} ${CURRENCY} يُدفع سنوياً`
            : 'يُدفع شهرياً'}
      </p>

      <p className="mt-4 text-[13px] leading-relaxed" style={{ color: MUTED }}>
        {plan.description}
      </p>

      <PlanCta plan={plan} />

      <ul className="mt-6 flex flex-1 flex-col gap-2.5 border-t pt-6" style={{ borderColor: BORDER }}>
        {introLine ? (
          <li className="text-[12px] font-medium leading-relaxed" style={{ color: TEXT }}>
            {introLine}
          </li>
        ) : null}
        {bullets.map((item) => (
          <li key={item} className="flex items-start gap-2 text-[13px] leading-relaxed" style={{ color: MUTED }}>
            <Check className="mt-0.5 size-3.5 shrink-0" style={{ color: BRAND }} strokeWidth={2.25} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function ComparisonCell({ value, compact = false }: { value: CellValue; compact?: boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center" aria-label="متضمّن">
        <Check className={compact ? 'size-4' : 'size-[18px]'} style={{ color: BRAND }} strokeWidth={2.25} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="text-[13px]" style={{ color: 'rgba(19, 35, 39, 0.28)' }}>
        —
      </span>
    );
  }
  return (
    <span className="text-[12px] font-medium leading-snug sm:text-[13px]" style={{ color: TEXT }}>
      {value}
    </span>
  );
}

/* ─── Mobile: plan tabs + feature list ─── */

function ComparisonMatrixMobile() {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('pro');
  const selectedPlan = PRICING_PLANS.find((plan) => plan.id === selectedPlanId) ?? PRICING_PLANS[0];

  return (
    <div className="overflow-hidden rounded-4xl border lg:hidden" style={{ borderColor: BORDER }}>
      <div className="pricing-comparison-sticky-header">
        <div className="pricing-comparison-sticky-inner pricing-comparison-sticky-inner--table">
          <div className="space-y-3 px-4 py-4 sm:px-5">
            <div
              className="flex gap-1 overflow-x-auto rounded-full border p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ borderColor: BORDER, backgroundColor: SURFACE }}
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
                    className="min-h-9 shrink-0 rounded-full px-4 text-[13px] font-medium transition-colors"
                    style={
                      active
                        ? { backgroundColor: TEXT, color: '#ffffff' }
                        : { color: MUTED }
                    }
                  >
                    {plan.name}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px]" style={{ color: MUTED }}>
                ميزات <span className="font-semibold" style={{ color: TEXT }}>{selectedPlan.name}</span>
              </p>
              <PlanCta plan={selectedPlan} variant="table" />
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: BORDER }}>
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
      <div className="px-4 py-5 sm:px-5" style={{ backgroundColor: SURFACE }}>
        {section.eyebrow ? (
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: MUTED }}>
            {section.eyebrow}
          </p>
        ) : null}
        <h3 className="text-base font-semibold" style={{ color: TEXT }}>
          {section.title}
        </h3>
        {section.description ? (
          <p className="mt-1 text-[12px] leading-relaxed" style={{ color: MUTED }}>
            {section.description}
          </p>
        ) : null}
      </div>

      <div className="bg-white">
        {section.rows.map((row, index) => (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3.5"
            style={{
              backgroundColor: index % 2 === 0 ? '#ffffff' : 'rgba(246, 247, 248, 0.6)',
            }}
          >
            <div>
              <span className="block text-[13px] font-medium" style={{ color: TEXT }}>
                {row.label}
              </span>
              {row.hint ? (
                <span className="mt-0.5 block text-[11px]" style={{ color: MUTED }}>
                  {row.hint}
                </span>
              ) : null}
            </div>
            <ComparisonCell value={row.values[planId]} compact />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Desktop: GitHub Copilot-style comparison table ─── */

function ComparisonTableDesktop() {
  return (
    <div className="pricing-copilot-compare">
      <table className="pricing-copilot-compare-table w-full text-start">
        <thead>
          <tr className="border-b" style={{ borderColor: BORDER }}>
            <th className="pricing-copilot-compare-th w-[26%] min-w-[10rem] px-4 py-5 text-start align-middle sm:px-5">
              <span className="text-base font-bold" style={{ color: TEXT }}>
                الميزة
              </span>
            </th>
            {PRICING_PLANS.map((plan) => (
              <th
                key={plan.id}
                className="pricing-copilot-compare-th border-s px-3 py-6 align-middle sm:px-4"
                style={{ borderColor: BORDER }}
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <span className="text-sm font-bold sm:text-base" style={{ color: TEXT }}>
                    {plan.name}
                  </span>
                  <PlanCta plan={plan} variant="table-inline" />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_SECTIONS.map((section) => (
            <SectionTableRows key={section.id} section={section} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionTableRows({ section }: { section: FeatureSection }) {
  return (
    <>
      <tr>
        <td
          colSpan={PRICING_PLANS.length + 1}
          className="border-b px-4 py-5 sm:px-5"
          style={{ borderColor: BORDER, backgroundColor: SURFACE }}
        >
          {section.eyebrow ? (
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: MUTED }}>
              {section.eyebrow}
            </p>
          ) : null}
          <p className="text-base font-semibold sm:text-lg" style={{ color: TEXT }}>
            {section.title}
          </p>
          {section.description ? (
            <p className="mt-1 max-w-3xl text-[13px] leading-relaxed" style={{ color: MUTED }}>
              {section.description}
            </p>
          ) : null}
        </td>
      </tr>
      {section.rows.map((row) => (
        <tr
          key={row.label}
          className="border-b transition-colors hover:bg-[#FAFBFC]"
          style={{ borderColor: 'rgba(232, 236, 240, 0.9)' }}
        >
          <td className="px-4 py-4 sm:px-5">
            <span className="block text-[13px] font-medium sm:text-[14px]" style={{ color: TEXT }}>
              {row.label}
            </span>
            {row.hint ? (
              <span className="mt-0.5 block text-[11px] sm:text-[12px]" style={{ color: MUTED }}>
                {row.hint}
              </span>
            ) : null}
          </td>
          {PRICING_PLANS.map((plan) => (
            <td
              key={plan.id}
              className="border-s px-3 py-4 text-center sm:px-4"
              style={{ borderColor: BORDER }}
            >
              <ComparisonCell value={row.values[plan.id]} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function ComparisonMatrix({ period }: { period: BillingPeriod }) {
  return (
    <section className="mt-16 sm:mt-24" aria-labelledby="comparison-heading">
      <div className="mb-10 text-center lg:mb-12">
        <h2
          id="comparison-heading"
          className="text-xl font-bold tracking-tight sm:text-2xl lg:text-[1.75rem]"
          style={{ color: TEXT }}
        >
          قارن الميزات
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed" style={{ color: MUTED }}>
          جدول تفصيلي لكل ما تحصل عليه في كل باقة.
        </p>
      </div>

      <ComparisonMatrixMobile />
      <div className="hidden rounded-4xl border lg:block" style={{ borderColor: BORDER }}>
        <ComparisonTableDesktop />
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: BORDER }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-right sm:py-5"
      >
        <span className="text-start text-[14px] font-medium sm:text-[15px]" style={{ color: TEXT }}>
          {question}
        </span>
        <ChevronIcon open={open} />
      </button>
      <div
        className={`grid transition-all duration-300 ${
          open ? 'grid-rows-[1fr] pb-4 opacity-100 sm:pb-5' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-start text-[13px] leading-relaxed sm:text-sm" style={{ color: MUTED }}>
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PricingView() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16">
      <header className="mx-auto max-w-3xl pt-4 text-center sm:pt-8">
        <h1
          className="text-[2rem] font-bold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.1]"
          style={{ color: TEXT }}
        >
          الأسعار
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed sm:text-base" style={{ color: MUTED }}>
          ابدأ مجاناً وارتقِ متى احتجت. كل الباقات تشمل النماذج والمتجر والروابط والتحليلات.
        </p>
        <div className="mt-8 flex justify-center">
          <BillingToggle period={period} onChange={setPeriod} />
        </div>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-14 md:grid-cols-2 xl:grid-cols-4">
        {PRICING_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} period={period} />
        ))}
      </div>

      <ComparisonMatrix period={period} />

      <section className="mt-16 border-t pt-14 sm:mt-20 sm:pt-16" style={{ borderColor: BORDER }} aria-labelledby="faq-heading">
        <h2
          id="faq-heading"
          className="mb-8 text-center text-xl font-bold tracking-tight sm:text-2xl"
          style={{ color: TEXT }}
        >
          الأسئلة الشائعة
        </h2>
        <div className="mx-auto max-w-2xl">
          {PRICING_FAQS.map((faq) => (
            <FaqItem key={faq.question} {...faq} />
          ))}
        </div>
      </section>
    </div>
  );
}
