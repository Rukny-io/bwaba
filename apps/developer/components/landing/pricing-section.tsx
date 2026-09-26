'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { AnimatedNumber } from './animated-number';
import {
  CURRENCY,
  EMAIL_PRODUCT_PLANS,
  EMAIL_SECTION_COPY,
  EMAIL_TRANSACTIONAL_PLANS,
  EMAIL_AUTOMATION_PRICING,
  EMAIL_OVERAGE_PACK,
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
  type PlanId,
  type PricingPlan,
} from '@/lib/pricing-plans';
import { cn } from '@/lib/utils';
import { redirectToDeveloperCheckout } from '@/lib/developer-checkout';
import { appToast } from '@/lib/app-toast';

const PLAN_HREF: Record<PlanId, string> = {
  free: '/apps',
  pro: '/login?next=/settings/platform',
};

function CellValue({ value }: { value: CellValue }) {
  if (value === true) {
    return (
      <span className="inline-flex w-full items-center justify-center">
        <Check
          className="size-4 text-[var(--success)]"
          strokeWidth={2.4}
          aria-label="Included"
        />
      </span>
    );
  }
  if (value === false) {
    return (
      <span
        className="inline-flex w-full items-center justify-center text-[var(--muted-foreground)]/40"
        aria-label="Not included"
      >
        —
      </span>
    );
  }
  return (
    <span className="inline-flex w-full items-center justify-center text-center text-[13px] font-medium leading-snug text-[var(--foreground)]">
      {value}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p className="text-[13px] font-medium text-[var(--muted-foreground)]">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          'text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl',
          eyebrow && 'mt-2',
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-[15px]">
          {subtitle}
        </p>
      ) : null}
    </header>
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
      className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1"
      role="group"
      aria-label="Billing period"
    >
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={cn(
          'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
          period === 'monthly'
            ? 'bg-[var(--foreground)] text-[var(--background)]'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={cn(
          'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
          period === 'yearly'
            ? 'bg-[var(--foreground)] text-[var(--background)]'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
        )}
      >
        Yearly
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-bold',
            period === 'yearly'
              ? 'bg-white/20 text-white'
              : 'bg-[var(--brand-soft-lime)] text-[var(--success)]',
          )}
        >
          Save {YEARLY_DISCOUNT_PERCENT}%
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
  const [busy, setBusy] = useState(false);
  const displayPrice = isFree
    ? 0
    : period === 'yearly'
      ? monthlyEquivalentFromYearly(plan.priceYearly)
      : plan.priceMonthly;

  async function handleProCheckout() {
    if (busy) return;
    setBusy(true);
    try {
      await redirectToDeveloperCheckout({
        kind: 'PRO_UPGRADE',
        billingCycle: period === 'yearly' ? 'YEARLY' : 'MONTHLY',
      });
    } catch (error) {
      // Unauthenticated users land on login; authenticated get a toast.
      const message =
        error instanceof Error ? error.message : 'Could not start checkout.';
      if (/401|unauthor|login|جلسة|تسجيل/i.test(message)) {
        window.location.href = `/login?next=${encodeURIComponent('/pricing')}`;
        return;
      }
      appToast.fromError(error, 'Could not continue to Checkout');
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        'relative flex h-full flex-col rounded-2xl bg-[var(--surface-secondary)] p-6 sm:p-7',
      )}
    >
      <div className="flex min-h-[26px] items-center">
        {plan.badge ? (
          <span className="inline-flex rounded-full bg-[var(--primary)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary-foreground)]">
            {plan.badge}
          </span>
        ) : (
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted-foreground)]">
            Platform
          </span>
        )}
      </div>

      <h3 className="mt-4 text-xl font-semibold tracking-tight text-[var(--foreground)]">
        {plan.name}
      </h3>
      <p className="mt-2 min-h-[3.5rem] text-sm leading-relaxed text-[var(--muted-foreground)]">
        {plan.description}
      </p>

      <div className="mt-6 flex min-h-[2.75rem] items-end gap-1.5">
        {isFree ? (
          <span className="text-4xl font-semibold tracking-tight text-[var(--foreground)]">
            Free
          </span>
        ) : (
          <>
            <AnimatedNumber
              value={displayPrice}
              className="text-4xl font-semibold tracking-tight text-[var(--foreground)]"
            />
            <span className="pb-1.5 text-sm font-medium text-[var(--muted-foreground)]">
              {CURRENCY} / mo
            </span>
          </>
        )}
      </div>

      <p className="mt-1.5 min-h-[1rem] text-xs text-[var(--muted-foreground)]">
        {isFree
          ? 'No credit card required'
          : period === 'yearly'
            ? `Billed ${formatPrice(plan.priceYearly)} ${CURRENCY} yearly`
            : 'Billed monthly'}
      </p>

      {isFree ? (
        <Link
          href={PLAN_HREF.free}
          className={cn(
            'mt-6 flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-opacity hover:opacity-90',
            'bg-[var(--foreground)] text-[var(--background)]',
          )}
        >
          {plan.ctaLabel}
        </Link>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleProCheckout()}
          className={cn(
            'mt-6 flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60',
            plan.popular
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
              : 'bg-[var(--foreground)] text-[var(--background)]',
          )}
        >
          {busy
            ? '…'
            : `Continue to Checkout · ${formatPrice(
                period === 'yearly' ? plan.priceYearly : plan.priceMonthly,
              )} ${CURRENCY}`}
        </button>
      )}

      <ul className="mt-7 flex flex-1 flex-col gap-2.5 border-t border-[color-mix(in_srgb,var(--border)_70%,transparent)] pt-6">
        {plan.highlights.map((item, index) => {
          const isHeader = item.endsWith(':');
          return (
            <li
              key={index}
              className={cn(
                'flex items-start gap-2.5 text-sm leading-relaxed',
                isHeader
                  ? 'font-semibold text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)]',
              )}
            >
              {isHeader ? null : (
                <Check
                  size={16}
                  className="mt-0.5 shrink-0 text-[var(--success)]"
                  strokeWidth={2.4}
                />
              )}
              <span>{item}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-start"
      >
        <span className="text-[15px] font-semibold text-[var(--foreground)]">
          {question}
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-[var(--muted-foreground)] transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          open ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
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
    <main className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[13px] font-medium text-[var(--muted-foreground)]">
          Pricing
        </p>
        <h1 className="mt-3 text-[2.25rem] font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl sm:leading-[1.1]">
          Build without pricing surprises
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--muted-foreground)] sm:text-[17px] sm:leading-8">
          Start free with clear limits. Upgrade to Pro for production scale.
          Messages bill from your app wallet by real usage.
        </p>
        <div className="mt-8 flex justify-center">
          <BillingToggle period={period} onChange={setPeriod} />
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-5">
        {PRICING_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} period={period} />
        ))}
      </div>

      {/* WhatsApp usage */}
      <section className="mt-20 sm:mt-24">
        <SectionHeader
          eyebrow={USAGE_SECTION_COPY.eyebrow}
          title={USAGE_SECTION_COPY.title}
          subtitle={USAGE_SECTION_COPY.subtitle}
        />

        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {USAGE_RATES.map((rate) => (
            <div
              key={rate.id}
              className="flex h-full flex-col rounded-2xl bg-[var(--surface-secondary)] p-5"
            >
              <p className="text-[13px] font-semibold text-[var(--foreground)]">
                {rate.label}
              </p>
              <p className="mt-1 min-h-[2.25rem] text-[12px] leading-snug text-[var(--muted-foreground)]">
                {rate.description}
              </p>
              <div className="mt-auto pt-5">
                <div className="flex items-baseline gap-1.5">
                  {rate.price === 0 ? (
                    <span className="text-2xl font-semibold text-[var(--success)]">
                      Free
                    </span>
                  ) : (
                    <>
                      <span className="text-2xl font-semibold tabular-nums text-[var(--foreground)]">
                        {formatPrice(rate.price)}
                      </span>
                      <span className="text-xs font-medium text-[var(--muted-foreground)]">
                        IQD
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-1 min-h-[1rem] text-[12px] text-[var(--muted-foreground)]">
                  {rate.price === 0
                    ? 'note' in rate
                      ? rate.note
                      : ''
                    : USAGE_SECTION_COPY.perMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[12px] leading-relaxed text-[var(--muted-foreground)]">
          {USAGE_SECTION_COPY.footnote}
        </p>
      </section>

      {/* Email API */}
      <section className="mt-20 sm:mt-24">
        <SectionHeader
          eyebrow={EMAIL_SECTION_COPY.eyebrow}
          title={EMAIL_SECTION_COPY.title}
          subtitle={EMAIL_SECTION_COPY.subtitle}
        />

        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EMAIL_PRODUCT_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="flex h-full flex-col rounded-2xl bg-[var(--surface-secondary)] p-6"
            >
              <p className="text-[13px] font-semibold text-[var(--foreground)]">
                {plan.name}
              </p>
              <p className="mt-1 min-h-[2.5rem] text-[13px] leading-relaxed text-[var(--muted-foreground)]">
                {plan.description}
              </p>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                  {plan.priceLabel}
                </span>
                {plan.priceNote ? (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {plan.priceNote}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[13px] font-medium text-[var(--foreground)]">
                {plan.volume}
              </p>
              <ul className="mt-5 flex flex-1 flex-col gap-2 border-t border-[color-mix(in_srgb,var(--border)_70%,transparent)] pt-5">
                {plan.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-[13px] text-[var(--muted-foreground)]"
                  >
                    <Check
                      size={14}
                      className="mt-0.5 shrink-0 text-[var(--success)]"
                      strokeWidth={2.4}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-4xl overflow-x-auto rounded-2xl bg-[var(--surface-secondary)] p-4 sm:p-6">
          <h3 className="text-[15px] font-semibold text-[var(--foreground)]">
            Transactional tiers
          </h3>
          <table className="mt-4 w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="text-[12px] text-[var(--muted-foreground)]">
                <th className="py-2 text-start">Plan</th>
                <th className="py-2 text-end">Price / mo</th>
                <th className="py-2 text-end">Emails / mo</th>
                <th className="py-2 text-end">Overage / 1K</th>
              </tr>
            </thead>
            <tbody>
              {EMAIL_TRANSACTIONAL_PLANS.map((plan) => (
                <tr key={plan.id} className="border-t border-[color-mix(in_srgb,var(--border)_70%,transparent)]">
                  <td className="py-2.5 font-medium">{plan.name}</td>
                  <td className="py-2.5 text-end tabular-nums">
                    {plan.priceMonthly === 0 ? 'Free' : `${formatPrice(plan.priceMonthly)} IQD`}
                  </td>
                  <td className="py-2.5 text-end tabular-nums">{formatPrice(plan.volume)}</td>
                  <td className="py-2.5 text-end tabular-nums">
                    {plan.overagePer1k ? `${formatPrice(plan.overagePer1k)} IQD` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-[12px] text-[var(--muted-foreground)]">
            Overage packs: {formatPrice(EMAIL_OVERAGE_PACK.emails)} emails for{' '}
            {formatPrice(EMAIL_OVERAGE_PACK.priceIqd)} IQD. Automations:{' '}
            {formatPrice(EMAIL_AUTOMATION_PRICING.includedRuns)} runs included, then{' '}
            {EMAIL_AUTOMATION_PRICING.overagePerRun} IQD/run.
          </p>
        </div>

        <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={EMAIL_SECTION_COPY.docsHref}
            className="text-sm font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:decoration-[var(--foreground)]"
          >
            {EMAIL_SECTION_COPY.docsCta}
          </Link>
          <Link
            href={EMAIL_SECTION_COPY.compareHref}
            className="text-sm font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:decoration-[var(--foreground)]"
          >
            {EMAIL_SECTION_COPY.compareCta}
          </Link>
        </div>
      </section>

      {/* Comparison */}
      <section className="mt-20 sm:mt-24">
        <SectionHeader
          title="Compare plans"
          subtitle="Free vs Pro side by side."
        />

        <div className="mx-auto mt-10 max-w-4xl space-y-10 overflow-x-auto">
          {FEATURE_SECTIONS.map((section) => (
            <div key={section.id}>
              <div className="mb-4">
                <h3 className="text-[15px] font-semibold text-[var(--foreground)]">
                  {section.title}
                </h3>
                {section.description ? (
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {section.description}
                  </p>
                ) : null}
              </div>
              <table className="w-full min-w-[32rem] table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[48%]" />
                  <col className="w-[26%]" />
                  <col className="w-[26%]" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="py-2.5 pe-4 text-start text-[12px] font-medium text-[var(--muted-foreground)]">
                      Feature
                    </th>
                    {PRICING_PLANS.map((plan) => (
                      <th
                        key={plan.id}
                        className="px-2 py-2.5 text-center text-[13px] font-semibold text-[var(--foreground)]"
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={row.label}>
                      <td className="py-3 pe-4 align-middle text-start text-[13px] leading-snug text-[var(--muted-foreground)]">
                        <span className="text-[var(--foreground)]/85">
                          {row.label}
                        </span>
                        {row.hint ? (
                          <span className="mt-0.5 block text-[11px] leading-snug text-[var(--muted-foreground)]">
                            {row.hint}
                          </span>
                        ) : null}
                      </td>
                      {PRICING_PLANS.map((plan) => (
                        <td
                          key={plan.id}
                          className="px-2 py-3 align-middle text-center"
                        >
                          <CellValue value={row.values[plan.id]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-20 max-w-2xl sm:mt-24">
        <SectionHeader title="FAQ" />
        <div className="mt-6">
          {PRICING_FAQS.map((faq) => (
            <FaqItem key={faq.question} {...faq} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-20 max-w-2xl rounded-2xl bg-[var(--surface-secondary)] px-6 py-10 text-center sm:mt-24 sm:px-10 sm:py-12">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
          Ready to build with Rukny?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">
          Create an app, grab an API key, and send your first message.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/login?next=/apps"
            className="inline-flex h-10 items-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            Start Building
          </Link>
          <Link
            href="/documentation"
            className="inline-flex h-10 items-center rounded-full bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_85%,var(--foreground)_6%)]"
          >
            Browse docs
          </Link>
        </div>
      </section>
    </main>
  );
}
