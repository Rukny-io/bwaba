import type { Metadata } from 'next';
import Link from 'next/link';
import { DocumentationShell } from '@/components/documentation/docs-shell';
import {
  EMAIL_ADDON_PLANS,
  EMAIL_AUTOMATION_PRICING,
  EMAIL_OVERAGE_PACK,
  RESEND_COMPARE_HIGHLIGHTS,
  formatPrice,
} from '@/lib/pricing-plans';

export const metadata: Metadata = {
  title: 'Rukny vs Resend — Email API pricing',
  description:
    'Compare Rukny Email API pricing with Resend across transactional, marketing, automations, and add-ons.',
};

export default function CompareResendPricingPage() {
  return (
    <DocumentationShell>
      <main className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-[13px] font-medium text-[var(--muted-foreground)]">
            Email API
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Rukny vs Resend
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--muted-foreground)]">
            Same tier structure — typically 15–40% lower in IQD. Pay locally,
            integrate with WhatsApp, Forms, and Mail in one Rukny account.
          </p>
        </div>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">High-volume examples</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {RESEND_COMPARE_HIGHLIGHTS.map((row) => (
              <div
                key={row.volume}
                className="rounded-2xl bg-[var(--surface-secondary)] p-5"
              >
                <p className="font-medium">{row.volume}</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Resend: {row.resend}
                </p>
                <p className="text-sm font-medium">Rukny: {row.rukny}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 overflow-x-auto">
          <h2 className="text-lg font-semibold">Transactional email</h2>
          <table className="mt-4 w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="text-[12px] text-[var(--muted-foreground)]">
                <th className="py-2 text-start">Plan</th>
                <th className="py-2 text-end">Resend (USD)</th>
                <th className="py-2 text-end">Rukny ({CURRENCY})</th>
                <th className="py-2 text-end">Emails / mo</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Free', '$0', '0', '3,000'],
                ['Pro 10K', '$20*', '5,000', '10,000'],
                ['Pro 50K', '$20', '16,000', '50,000'],
                ['Pro 100K', '$35', '28,000', '100,000'],
                ['Scale 100K', '$90', '72,000', '100,000'],
                ['Scale 500K', '$350', '275,000', '500,000'],
                ['Scale 1M', '$650', '500,000', '1,000,000'],
              ].map(([name, resend, rukny, volume]) => (
                <tr
                  key={name}
                  className="border-t border-[color-mix(in_srgb,var(--border)_70%,transparent)]"
                >
                  <td className="py-2.5">{name}</td>
                  <td className="py-2.5 text-end">{resend}</td>
                  <td className="py-2.5 text-end tabular-nums">
                    {rukny === '0' ? 'Free' : `${formatPrice(Number(rukny.replace(/,/g, '')))} IQD`}
                  </td>
                  <td className="py-2.5 text-end">{volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[12px] text-[var(--muted-foreground)]">
            * Resend&apos;s $20 plan includes 50K emails — Rukny Pro 10K is sized
            for teams that need a smaller paid tier.
          </p>
        </section>

        <section className="mt-12 overflow-x-auto">
          <h2 className="text-lg font-semibold">Marketing contacts</h2>
          <table className="mt-4 w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="text-[12px] text-[var(--muted-foreground)]">
                <th className="py-2 text-start">Contacts</th>
                <th className="py-2 text-end">Resend</th>
                <th className="py-2 text-end">Rukny</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['1,500 / 1,000', 'Free $0', 'Free'],
                ['5,000', '$40', '35,000 IQD'],
                ['10,000', '$80', '65,000 IQD'],
                ['25,000', '$180', '140,000 IQD'],
                ['50,000', '$250', '190,000 IQD'],
                ['100,000', '$450', '340,000 IQD'],
              ].map(([contacts, resend, rukny]) => (
                <tr
                  key={contacts}
                  className="border-t border-[color-mix(in_srgb,var(--border)_70%,transparent)]"
                >
                  <td className="py-2.5">{contacts}</td>
                  <td className="py-2.5 text-end">{resend}</td>
                  <td className="py-2.5 text-end">{rukny}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-[var(--surface-secondary)] p-5">
            <h2 className="font-semibold">Automations</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Resend: 10,000 runs/mo included · $0.0015/run overage
            </p>
            <p className="mt-1 text-sm font-medium">
              Rukny: {formatPrice(EMAIL_AUTOMATION_PRICING.includedRuns)} runs/mo
              · {EMAIL_AUTOMATION_PRICING.overagePerRun} IQD/run overage
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--surface-secondary)] p-5">
            <h2 className="font-semibold">Overage packs</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Resend: $0.46–0.90 / 1,000 emails
            </p>
            <p className="mt-1 text-sm font-medium">
              Rukny: {formatPrice(EMAIL_OVERAGE_PACK.priceIqd)} IQD /{' '}
              {formatPrice(EMAIL_OVERAGE_PACK.emails)} emails
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">Add-ons</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {EMAIL_ADDON_PLANS.map((addon) => (
              <li key={addon.id} className="flex justify-between gap-4">
                <span>{addon.name}</span>
                <span className="font-medium tabular-nums">
                  {formatPrice(addon.priceMonthly)} IQD / mo
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12px] text-[var(--muted-foreground)]">
            Rukny also offers annual billing with a 17% discount — Resend
            self-serve plans are monthly only.
          </p>
        </section>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/pricing"
            className="inline-flex h-10 items-center rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)]"
          >
            View full pricing
          </Link>
          <Link
            href="/documentation/email-api"
            className="inline-flex h-10 items-center rounded-full border border-[var(--border)] px-5 text-sm font-medium"
          >
            Email API docs
          </Link>
        </div>
      </main>
    </DocumentationShell>
  );
}
