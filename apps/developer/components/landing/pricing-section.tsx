'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AnimatedNumber } from './animated-number';
import {
  CURRENCY,
  CURRENCY_EN,
  FEATURE_SECTIONS,
  PRICING_FAQS,
  PRICING_PLANS,
  USAGE_RATES,
  USAGE_SECTION_COPY,
  YEARLY_DISCOUNT_PERCENT,
  formatPrice,
  monthlyEquivalentFromYearly,
  type BillingPeriod,
  type CellValue,
  type FeatureSection,
  type PlanId,
  type PricingPlan,
} from '@/lib/pricing-plans';

function CheckIcon({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
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
  free: '/login?next=/apps',
  pro: '/login?next=/apps',
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
            ? 'bg-[var(--foreground)] text-white'
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
            ? 'bg-[var(--foreground)] text-white'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        }`}
      >
        سنوي
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
            period === 'yearly'
              ? 'bg-white/20 text-white'
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
      className={`relative flex flex-col rounded-2xl p-5 transition-shadow sm:p-6 ${
        plan.popular
          ? 'bg-[var(--surface)] shadow-[0_16px_48px_rgba(15,23,42,0.1)] ring-2 ring-[var(--primary)]'
          : 'bg-[var(--surface)] shadow-[var(--card-shadow)] ring-1 ring-[var(--border)] hover:shadow-[var(--card-shadow-hover)]'
      }`}
    >
      {plan.badge ? (
        <span className="absolute -top-3 right-5 rounded-full bg-[var(--primary)] px-3 py-1 text-[11px] font-bold text-[var(--primary-foreground)] shadow-sm">
          {plan.badge}
        </span>
      ) : null}

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold text-[var(--foreground)]">{plan.name}</h3>
        <span className="text-xs font-medium text-[var(--muted-foreground)]" lang="en">
          {plan.nameEn}
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
        {plan.description}
      </p>

      <div className="mt-4 flex items-end gap-1.5">
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

      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        {isFree
          ? 'بدون بطاقة ائتمان'
          : period === 'yearly'
            ? `يُدفع ${formatPrice(plan.priceYearly)} ${CURRENCY} سنوياً`
            : 'يُدفع شهرياً'}
      </p>

      <Link
        href={PLAN_HREF[plan.id]}
        className={`mt-4 flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition-opacity hover:opacity-90 ${
          plan.popular
            ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
            : 'bg-[var(--foreground)] text-white'
        }`}
      >
        {plan.ctaLabel}
      </Link>

      <ul className="mt-5 flex flex-col gap-2.5">
        {plan.highlights.map((item, index) => {
          const isHeader = item.endsWith(':');
          return (
            <li
              key={index}
              className={`flex items-start gap-2.5 text-sm leading-relaxed ${
                isHeader
                  ? 'font-semibold text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)]'
              }`}
            >
              {isHeader ? null : (
                <CheckIcon size={16} className="mt-0.5 shrink-0 text-[var(--success)]" />
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
      ? 'border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]'
      : 'bg-[var(--foreground)] text-white';
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
            className={`mt-2 font-bold text-[var(--foreground)] ${compact ? 'text-lg' : 'text-xl'}`}
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
                ? 'border-[var(--foreground)] bg-[var(--foreground)] text-white'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]'
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
        كل التفاصيل بين الخطتين في مكان واحد
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

          {FEATURE_SECTIONS.map((section) => (
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
          <div className="min-w-[560px]">
            <div className="sticky top-16 z-20 grid grid-cols-[1.6fr_repeat(2,1fr)] items-center gap-x-2 border-b border-[var(--border)] bg-[var(--surface)]/95 py-5 backdrop-blur">
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

            {FEATURE_SECTIONS.map((section) => (
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
                    className="grid grid-cols-[1.6fr_repeat(2,1fr)] items-center border-b border-[var(--border)]/60 transition-colors hover:bg-[var(--surface-secondary)]/40"
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

function UsageRatesBlock() {
  const accent: Record<(typeof USAGE_RATES)[number]['id'], string> = {
    authentication: 'bg-[var(--primary)]',
    utility: 'bg-slate-500',
    marketing: 'bg-amber-500',
    service: 'bg-[var(--success)]',
  };

  return (
    <div className="mt-12 min-[720px]:mt-16" dir="ltr" lang="en">
      <div className="text-center">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          {USAGE_SECTION_COPY.eyebrow}
        </p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)] min-[720px]:text-3xl">
          {USAGE_SECTION_COPY.title}
        </h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[var(--muted-foreground)]">
          {USAGE_SECTION_COPY.subtitle}
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-[720px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)]">
        <div className="grid grid-cols-2 divide-x divide-y divide-[var(--border)] min-[520px]:grid-cols-4 min-[520px]:divide-y-0">
          {USAGE_RATES.map((rate) => (
            <div
              key={rate.id}
              className="relative flex flex-col px-4 py-5 min-[520px]:px-5 min-[520px]:py-6"
            >
              <span
                className={`mb-2.5 inline-flex h-1.5 w-8 rounded-full ${accent[rate.id]}`}
                aria-hidden
              />
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]">
                {rate.label}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-[var(--muted-foreground)] min-[520px]:text-xs">
                {rate.description}
              </p>
              <div className="mt-4 flex items-baseline gap-1.5">
                {rate.price === 0 ? (
                  <span className="text-xl font-bold text-[var(--success)] min-[520px]:text-2xl">
                    {USAGE_SECTION_COPY.free}
                  </span>
                ) : (
                  <>
                    <span className="text-xl font-bold tabular-nums text-[var(--foreground)] min-[520px]:text-2xl">
                      {formatPrice(rate.price)}
                    </span>
                    <span className="text-xs font-medium text-[var(--muted-foreground)]">
                      {CURRENCY_EN}
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1 text-[11px] text-[var(--muted-foreground)] min-[520px]:text-xs">
                {rate.price === 0
                  ? ('note' in rate ? rate.note : '')
                  : USAGE_SECTION_COPY.perMessage}
              </p>
            </div>
          ))}
        </div>
        <p className="border-t border-[var(--border)] bg-[var(--surface-secondary)]/60 px-5 py-3 text-center text-xs leading-relaxed text-[var(--muted-foreground)]">
          {USAGE_SECTION_COPY.footnote}
        </p>
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
      className="mx-auto w-full max-w-[960px] scroll-mt-24 px-5 py-14 min-[720px]:px-6 min-[720px]:py-20"
    >
      <div className="pricing-fade-up grid place-items-center">
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-4 py-1.5 text-sm font-semibold text-[var(--foreground)] shadow-sm">
          خطط الأسعار
        </span>
        <h2 className="mt-4 max-w-[560px] text-center text-3xl font-bold leading-tight tracking-tight text-[var(--foreground)] min-[720px]:text-[40px] min-[720px]:leading-[1.12]">
          ابنِ على WhatsApp API بدون تعقيد
        </h2>
        <p className="mt-3 max-w-[520px] text-center text-base leading-relaxed text-[var(--muted-foreground)] min-[720px]:text-lg">
          ابدأ مجاناً مع حدود واضحة، أو انتقل إلى Pro للإنتاج. الرسائل تُفوتر
          من محفظة التطبيق حسب الاستخدام الفعلي.
        </p>

        <div className="mt-6">
          <BillingToggle period={period} onChange={setPeriod} />
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-[720px] grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[640px]:gap-5">
        {PRICING_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} period={period} />
        ))}
      </div>

      <UsageRatesBlock />
      <ComparisonTable />

      <div className="mx-auto mt-12 max-w-[640px] min-[720px]:mt-14">
        <h3 className="text-center text-xl font-bold tracking-tight text-[var(--foreground)] min-[720px]:text-2xl">
          الأسئلة الشائعة
        </h3>
        <div className="mt-5">
          {PRICING_FAQS.map((faq) => (
            <FaqItem key={faq.question} {...faq} />
          ))}
        </div>
      </div>
    </section>
  );
}
