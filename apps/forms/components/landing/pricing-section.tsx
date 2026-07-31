'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M4 10.5L8 14.5L16 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
      className={`shrink-0 text-[var(--muted-foreground)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        open ? 'rotate-180' : ''
      }`}
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

const PLAN_HREF: Record<PlanId, string> = {
  free: '/app',
  pro: '/app/settings',
  whale: '/app/settings',
  business: '/app/settings',
};

/** Landing page shows only core form features in the comparison table. */
const LANDING_FEATURE_SECTIONS = FEATURE_SECTIONS.filter((section) => section.id === 'forms');

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] as const },
  },
};

function BillingToggle({
  period,
  onChange,
}: {
  period: BillingPeriod;
  onChange: (p: BillingPeriod) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
          period === 'monthly'
            ? 'landing-invert-btn'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        }`}
      >
        شهري
      </button>
      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
          period === 'yearly'
            ? 'landing-invert-btn'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        }`}
      >
        سنوي
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
            period === 'yearly'
              ? 'bg-[var(--background)]/20 text-[var(--background)]'
              : 'bg-[var(--brand-soft-lime)] text-[var(--success)]'
          }`}
        >
          وفّر {YEARLY_DISCOUNT_PERCENT}%
        </span>
      </button>
    </div>
  );
}

function PlanCard({
  plan,
  period,
}: {
  plan: PricingPlan;
  period: BillingPeriod;
}) {
  const isFree = plan.priceMonthly === 0;
  const displayPrice = isFree
    ? 0
    : period === 'yearly'
      ? monthlyEquivalentFromYearly(plan.priceYearly)
      : plan.priceMonthly;

  return (
    <div
      className={`relative flex flex-col rounded-3xl p-6 transition-shadow min-[720px]:p-7 ${
        plan.popular
          ? 'bg-[var(--surface)] shadow-[var(--card-shadow-hover)] ring-2 ring-[var(--primary)]'
          : 'bg-[var(--surface)] shadow-[var(--card-shadow)] ring-1 ring-[var(--border)] hover:shadow-[var(--card-shadow-hover)]'
      }`}
    >
      {plan.badge ? (
        <span className="absolute -top-3 right-6 rounded-full bg-[var(--primary)] px-3 py-1 text-[11px] font-bold text-[var(--primary-foreground)] shadow-sm">
          {plan.badge}
        </span>
      ) : null}

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold text-[var(--foreground)]">{plan.name}</h3>
        <span className="text-xs font-medium text-[var(--muted-foreground)]" lang="en">
          {plan.nameEn}
        </span>
      </div>

      <p className="mt-2 min-h-[40px] text-[13px] leading-relaxed text-[var(--muted-foreground)]">
        {plan.description}
      </p>

      <div className="mt-5 flex items-end gap-1.5">
        {isFree ? (
          <span className="text-3xl font-bold text-[var(--foreground)]">مجاناً</span>
        ) : (
          <>
            <AnimatedNumber
              value={displayPrice}
              className="text-3xl font-bold text-[var(--foreground)]"
            />
            <span className="pb-1 text-sm font-medium text-[var(--muted-foreground)]">
              {CURRENCY} / شهر
            </span>
          </>
        )}
      </div>

      <p className="mt-1 min-h-[18px] text-[12px] text-[var(--muted-foreground)]">
        {isFree
          ? 'بدون بطاقة ائتمان'
          : period === 'yearly'
            ? `يُدفع ${formatPrice(plan.priceYearly)} ${CURRENCY} سنوياً`
            : 'يُدفع شهرياً'}
      </p>

      <Link
        href={PLAN_HREF[plan.id]}
        className={`mt-5 flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-opacity hover:opacity-90 ${
          plan.popular
            ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
            : 'landing-invert-btn'
        }`}
      >
        {plan.ctaLabel}
      </Link>

      <ul className="mt-6 flex flex-col gap-3">
        {plan.highlights.map((item, index) => {
          const isHeader = item.endsWith(':');
          return (
            <li
              key={index}
              className={`flex items-start gap-2.5 text-[13px] leading-relaxed ${
                isHeader
                  ? 'font-semibold text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)]'
              }`}
            >
              {isHeader ? null : (
                <CheckIcon className="mt-0.5 shrink-0 text-[var(--success)]" />
              )}
              <span>{item}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ComparisonCell({ value }: { value: CellValue }) {
  if (value === true) {
    return (
      <span className="inline-flex">
        <CheckIcon className="text-[var(--success)]" />
      </span>
    );
  }
  if (value === false) {
    return <span className="text-[var(--muted-foreground)]/50">—</span>;
  }
  return <span className="text-[13px] font-medium text-[var(--foreground)]">{value}</span>;
}

function ComparisonHeaderCta({ plan }: { plan: PricingPlan }) {
  const base =
    'inline-flex h-9 items-center justify-center rounded-full px-4 text-[13px] font-semibold transition-opacity hover:opacity-90';
  const variant = plan.popular
    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
    : plan.priceMonthly === 0
      ? 'landing-surface-btn'
      : 'landing-invert-btn';
  return (
    <Link href={PLAN_HREF[plan.id]} className={`${base} ${variant}`}>
      {plan.ctaLabel}
    </Link>
  );
}

function ComparisonSectionHeader({
  section,
  compact = false,
}: {
  section: FeatureSection;
  compact?: boolean;
}) {
  return (
    <div className={`border-b border-[var(--border)] ${compact ? 'py-6' : 'py-9'}`}>
      <div className="flex items-start gap-2.5">
        <span className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-[3px] bg-[var(--primary)]" />
        <div className="min-w-0 flex-1">
          <h4
            className={`font-bold mt-2 text-[var(--foreground)] ${compact ? 'text-lg' : 'text-xl'}`}
          >
            {section.title}
          </h4>
          {section.description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
              {section.description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PlanTabs({
  activePlanId,
  onChange,
}: {
  activePlanId: PlanId;
  onChange: (id: PlanId) => void;
}) {
  return (
    <div
      className="mb-5 flex flex-wrap gap-2 min-[720px]:hidden"
      role="tablist"
      aria-label="اختر الباقة للمقارنة"
    >
      {PRICING_PLANS.map((plan) => {
        const isActive = activePlanId === plan.id;
        return (
          <button
            key={plan.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(plan.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'landing-invert-btn border-transparent'
                : 'landing-surface-btn'
            }`}
          >
            {plan.name}
          </button>
        );
      })}
    </div>
  );
}

function ComparisonTable() {
  const [activePlanId, setActivePlanId] = useState<PlanId>('pro');
  const activePlan = PRICING_PLANS.find((plan) => plan.id === activePlanId)!;

  return (
    <div className="mt-16 min-[720px]:mt-20">
      <h3 className="text-center text-2xl font-bold tracking-tight text-[var(--foreground)] min-[720px]:text-3xl">
        قارن كل الميزات
      </h3>
      <p className="mt-2 text-center text-sm text-[var(--muted-foreground)]">
        كل التفاصيل بين الباقات في مكان واحد
      </p>

      <div className="mt-10">
        <PlanTabs activePlanId={activePlanId} onChange={setActivePlanId} />

        {/* Mobile: single plan column */}
        <div className="min-[720px]:hidden">
          <div className="sticky top-16 z-10 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)]/95 px-2 py-4 backdrop-blur">
            <span className="text-base font-bold text-[var(--foreground)]">الميزة</span>
            <div className="flex flex-col items-end gap-2">
              <span className="flex items-center gap-1.5 text-sm font-bold text-[var(--foreground)]">
                {activePlan.name}
                {activePlan.popular ? (
                  <span className="rounded-full bg-[var(--primary)]/10 px-1.5 py-0.5 text-[9px] font-bold text-[var(--primary)]">
                    الأشهر
                  </span>
                ) : null}
              </span>
              <ComparisonHeaderCta plan={activePlan} />
            </div>
          </div>

          {LANDING_FEATURE_SECTIONS.map((section) => (
            <div key={section.id}>
              <ComparisonSectionHeader section={section} compact />

              {section.rows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[var(--border)]/60"
                >
                  <div className="px-2 py-4 text-[13px] text-[var(--foreground)]">
                    {row.label}
                    {row.hint ? (
                      <span className="mt-0.5 block text-[11px] text-[var(--muted-foreground)]">
                        {row.hint}
                      </span>
                    ) : null}
                  </div>
                  <div className="px-2 py-4 text-center">
                    <ComparisonCell value={row.values[activePlanId]} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Desktop: full comparison table */}
        <div className="hidden min-[720px]:block overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="sticky top-16 z-20 grid grid-cols-[1.6fr_repeat(4,1fr)] items-center gap-x-2 border-b border-[var(--border)] bg-[var(--surface)]/95 py-5 backdrop-blur">
              <div className="px-2 text-base font-bold text-[var(--foreground)]">الميزة</div>
              {PRICING_PLANS.map((plan) => (
                <div key={plan.id} className="flex flex-col items-center gap-2 px-2 text-center">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-[var(--foreground)]">
                    {plan.name}
                    {plan.popular ? (
                      <span className="rounded-full bg-[var(--primary)]/10 px-1.5 py-0.5 text-[9px] font-bold text-[var(--primary)]">
                        الأشهر
                      </span>
                    ) : null}
                  </span>
                  <ComparisonHeaderCta plan={plan} />
                </div>
              ))}
            </div>

            {LANDING_FEATURE_SECTIONS.map((section) => (
              <div key={section.id}>
                <div className="border-b border-[var(--border)] py-9">
                  {section.eyebrow ? (
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                      {section.eyebrow}
                    </div>
                  ) : null}
                  <h4 className="mt-8 flex items-center gap-2 text-xl font-bold text-[var(--foreground)]">
                    <span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-[var(--primary)]" />
                    {section.title}
                  </h4>
                  {section.description ? (
                    <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
                      {section.description}
                    </p>
                  ) : null}
                </div>

                {section.rows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[1.6fr_repeat(4,1fr)] items-center border-b border-[var(--border)]/60 transition-colors hover:bg-[var(--surface-secondary)]/40"
                  >
                    <div className="px-2 py-4 text-[13px] text-[var(--foreground)]">
                      {row.label}
                      {row.hint ? (
                        <span className="mt-0.5 block text-[11px] text-[var(--muted-foreground)]">
                          {row.hint}
                        </span>
                      ) : null}
                    </div>
                    {PRICING_PLANS.map((plan) => (
                      <div key={plan.id} className="px-2 py-4 text-center">
                        <ComparisonCell value={row.values[plan.id]} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-right"
      >
        <span className="text-[15px] font-semibold text-[var(--foreground)]">
          {question}
        </span>
        <ChevronIcon open={open} />
      </button>
      <div
        className={`grid transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PricingSection() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');

  return (
    <section
      id="pricing"
      className="mx-auto w-full max-w-[var(--max-content-width)] scroll-mt-24 px-5 py-20 min-[720px]:px-6 min-[720px]:py-28 min-[1280px]:px-0"
    >
      <motion.div
        className="grid place-items-center"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-4 py-1.5 text-sm font-semibold text-[var(--foreground)] shadow-sm">
          خطط الأسعار
        </span>
        <h2 className="mt-5 max-w-[640px] text-center text-3xl font-bold leading-tight tracking-tight text-[var(--foreground)] min-[720px]:text-[44px] min-[720px]:leading-[1.12]">
          باقات تناسب كل مرحلة من نمو عملك
        </h2>
        <p className="mt-4 max-w-[540px] text-center text-[15px] leading-relaxed text-[var(--muted-foreground)] min-[720px]:text-lg">
          ابدأ مجاناً وارتقِ متى احتجت. كل الباقات تشمل النماذج والمتجر والروابط
          والتحليلات بحدود مختلفة.
        </p>

        <div className="mt-8">
          <BillingToggle period={period} onChange={setPeriod} />
        </div>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 gap-5 min-[720px]:grid-cols-2 min-[1280px]:grid-cols-4">
        {PRICING_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} period={period} />
        ))}
      </div>

      <ComparisonTable />

      <div className="mx-auto mt-16 max-w-[720px] min-[720px]:mt-20">
        <h3 className="text-center text-2xl font-bold tracking-tight text-[var(--foreground)] min-[720px]:text-3xl">
          الأسئلة الشائعة
        </h3>
        <div className="mt-8">
          {PRICING_FAQS.map((faq) => (
            <FaqItem key={faq.question} {...faq} />
          ))}
        </div>
      </div>
    </section>
  );
}
