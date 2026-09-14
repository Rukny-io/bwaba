import Link from "next/link";
import { Check } from "lucide-react";
import { MailFrameLink } from "@/components/marketing/mail-frame-cta";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import {
  MAIL_ESTIMATE_INCLUDED_OUTBOUND,
  MAIL_ESTIMATE_OVERAGE_BRACKETS,
  estimateRawVolumeCost,
} from "@/lib/mail-estimate-catalog";
import {
  formatMailIqD,
  listMailPlans,
  mailPlanHighlights,
  type MailPlanDefinition,
  type MailPlanId,
} from "@/lib/mail-plans";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";
import { getCurrentMailUser } from "@/lib/current-user";

const CTA_BY_PLAN: Record<
  MailPlanId,
  { label: string; hrefSignedOut: string; hrefSignedIn: string }
> = {
  starter: {
    label: "Start for Free",
    hrefSignedOut: "/login",
    hrefSignedIn: "/apps",
  },
  standard: {
    label: "Get Started",
    hrefSignedOut: "/login?next=/billing",
    hrefSignedIn: "/billing",
  },
  premium: {
    label: "Get Started",
    hrefSignedOut: "/login?next=/billing",
    hrefSignedIn: "/billing",
  },
};

const STARTER_BUILDS = [
  {
    title: "Solo founder inbox",
    given: [
      "1 domain you already own",
      "you@yourdomain for sales and support",
      "Webmail from any device",
    ],
    gets: [
      "1 mailbox with 5 GB",
      "10 aliases for routing",
      "Agentic Mail drafts included",
    ],
  },
  {
    title: "Small team on one domain",
    given: [
      "Shared brand domain",
      "A few people who need real addresses",
      "Forwarders for roles like hello@",
    ],
    gets: [
      "Upgrade to Standard for 3 seats",
      "20 GB per mailbox",
      "Open tracking when you need it",
    ],
  },
  {
    title: "Ops-ready workspace",
    given: [
      "Higher seat count",
      "Catch-all and richer routing",
      "Premium delivery for critical mail",
    ],
    gets: [
      "Premium: 5 seats included",
      "Unlimited aliases",
      "Link/file tracking + premium delivery",
    ],
  },
] as const;

type CompareCell = string | boolean;

type CompareRow = {
  label: string;
  starter: CompareCell;
  standard: CompareCell;
  premium: CompareCell;
};

const COMPARE_SECTIONS: { title: string; rows: CompareRow[] }[] = [
  {
    title: "Workspace",
    rows: [
      { label: "Mailboxes included", starter: "1", standard: "3", premium: "5" },
      {
        label: "Extra mailbox",
        starter: "3,000 IQD/mo",
        standard: "2,000 IQD/mo",
        premium: "2,000 IQD/mo",
      },
      {
        label: "Storage per mailbox",
        starter: "5 GB",
        standard: "20 GB",
        premium: "30 GB",
      },
      { label: "Forwarding rules", starter: "5", standard: "20", premium: "50" },
      {
        label: "Aliases per mailbox",
        starter: "10",
        standard: "50",
        premium: "Unlimited",
      },
      {
        label: "Outbound emails included / mo",
        starter: "5,000",
        standard: "25,000",
        premium: "100,000",
      },
    ],
  },
  {
    title: "Outbound overage (estimate)",
    rows: [
      {
        label: "First 10K overage / 1K emails",
        starter: "1,000 IQD",
        standard: "1,000 IQD",
        premium: "1,000 IQD",
      },
      {
        label: "Next up to 50K / 1K emails",
        starter: "700 IQD",
        standard: "700 IQD",
        premium: "700 IQD",
      },
      {
        label: "Next up to 100K / 1K emails",
        starter: "500 IQD",
        standard: "500 IQD",
        premium: "500 IQD",
      },
      {
        label: "Above 100K / 1K emails",
        starter: "400 IQD",
        standard: "400 IQD",
        premium: "400 IQD",
      },
    ],
  },
  {
    title: "Product",
    rows: [
      { label: "Webmail & calendar", starter: true, standard: true, premium: true },
      { label: "AI email assistant", starter: true, standard: true, premium: true },
      { label: "Agentic Mail", starter: true, standard: true, premium: true },
      { label: "Smart AI replies", starter: true, standard: true, premium: true },
      { label: "Automatic replies", starter: true, standard: true, premium: true },
      { label: "Open tracking", starter: false, standard: true, premium: true },
      {
        label: "Link and file tracking",
        starter: false,
        standard: false,
        premium: true,
      },
      {
        label: "Premium email delivery",
        starter: false,
        standard: false,
        premium: true,
      },
    ],
  },
  {
    title: "Security & delivery",
    rows: [
      {
        label: "SPF, DKIM, DMARC setup",
        starter: true,
        standard: true,
        premium: true,
      },
      { label: "Anti-spam protection", starter: true, standard: true, premium: true },
      { label: "Mailbox 2FA (TOTP)", starter: true, standard: true, premium: true },
      {
        label: "Amazon SES delivery",
        starter: true,
        standard: true,
        premium: true,
      },
    ],
  },
];

function CellValue({ value }: { value: CompareCell }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto size-4 text-[#062c30]" strokeWidth={2.4} aria-label="Included" />
    ) : (
      <span className="text-[#a8a29e]" aria-label="Not included">
        —
      </span>
    );
  }
  return <span>{value}</span>;
}

function PlanCard({
  plan,
  signedIn,
}: {
  plan: MailPlanDefinition;
  signedIn: boolean;
}) {
  const cta = CTA_BY_PLAN[plan.id];
  const href = signedIn ? cta.hrefSignedIn : cta.hrefSignedOut;
  const highlights = mailPlanHighlights(plan);

  return (
    <article className="flex flex-col bg-white">
      <div className="border-b border-[#e7e5e4] px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[#1c1917]">{plan.name}</h2>
          {plan.popular ? (
            <span className="border border-[#e7e5e4] bg-[#f2f3f6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#062c30]">
              Popular
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-[#57534e]">
          For {plan.bestFor}.
        </p>
        <div className="mt-5">
          <MailFrameLink href={href} className="w-full [&_span.relative]:w-full">
            {cta.label}
          </MailFrameLink>
        </div>
        <p className="mt-5 text-3xl font-bold tracking-[-0.03em] text-[#1c1917]">
          {formatMailIqD(plan.priceMonthly)}
          <span className="text-sm font-medium text-[#a8a29e]">/mo</span>
        </p>
        <p className="mt-1 text-xs text-[#57534e]">
          + {formatMailIqD(plan.priceExtraMailbox)}/mo per extra mailbox
        </p>
        <p className="mt-3 text-sm font-medium text-[#02797E]">
          {MAIL_ESTIMATE_INCLUDED_OUTBOUND[plan.id].toLocaleString("en-IQ")}{" "}
          outbound emails / mo included
        </p>
      </div>
      <ul className="flex flex-1 flex-col gap-2.5 px-5 py-5 sm:px-6">
        {highlights.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-[#57534e]">
            <Check
              className="mt-0.5 size-4 shrink-0 text-[#062c30]"
              strokeWidth={2.4}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export async function MailPricingMarketingPage() {
  const user = await getCurrentMailUser();
  const signedIn = Boolean(user);
  const plans = listMailPlans();
  const primaryHref = signedIn ? "/apps" : "/login";

  return (
    <MailMarketingShell signedIn={signedIn} plainBackground>
      <main className="overflow-x-clip">
        <section className="border-b border-[#e7e5e4]">
          <div className={L.container}>
            <div className="grid grid-cols-1 items-center gap-8 py-10 md:grid-cols-2 md:py-14">
              <div className="space-y-6 max-w-screen-sm">
                <p className={`mail-hero-enter ${L.heroBadge}`}>Pricing</p>
                <h1 className={`mail-hero-enter-delayed ${L.heroTitle}`}>
                  Start free, scale effortlessly
                </h1>
                <p className={`mail-hero-enter-delayed ${L.heroLead}`}>
                  Rukny Mail runs on managed infrastructure that scales with you.
                  Plans are per workspace, billed monthly in IQD — tailored from a
                  first mailbox to a full team.
                </p>
                <div className="mail-hero-enter-delayed flex flex-wrap gap-2">
                  <MailFrameLink href={primaryHref}>
                    {signedIn ? "Open console" : "Start Building"}
                  </MailFrameLink>
                  <MailFrameLink href="/pricing/estimate" variant="ghost">
                    Estimate your costs
                  </MailFrameLink>
                </div>
              </div>
              <div className="mail-hero-enter-late border border-[#e7e5e4] bg-[#f2f3f6] p-5 sm:p-6">
                <p className="text-xs font-medium uppercase tracking-[1.2px] text-[#02797E]">
                  Also available
                </p>
                <ul className="mt-4 space-y-3 text-sm text-[#57534e]">
                  <li className="border-b border-[#e7e5e4] pb-3">
                    Starter activates after you verify DNS — no card required to begin.
                  </li>
                  <li className="border-b border-[#e7e5e4] pb-3">
                    Standard and Premium are requested in the console and activated by an admin.
                  </li>
                  <li>
                    Estimate seats and outbound volume (1K–100K) in the{" "}
                    <Link
                      href="/pricing/estimate"
                      className="font-medium text-[#062c30] underline-offset-2 hover:underline"
                    >
                      cost calculator
                    </Link>
                    .
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#e7e5e4] py-12 sm:py-16" aria-labelledby="plans-heading">
          <div className={L.container}>
            <h2 id="plans-heading" className="sr-only">
              Plans
            </h2>
            <div className="grid gap-px overflow-hidden border border-[#e7e5e4] bg-[#e7e5e4] md:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} signedIn={signedIn} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#e7e5e4] py-12 sm:py-16">
          <div className={L.container}>
            <p className={L.eyebrow}>Outbound volume</p>
            <h2 className={L.sectionTitle}>What does volume cost?</h2>
            <p className={L.sectionLead}>
              After your plan’s included send, overage is priced per 1,000 emails
              with volume discounts. Tap a pack in the calculator for a live total
              with seats.
            </p>
            <div className={`mt-10 ${L.gridFrame} sm:grid-cols-2 lg:grid-cols-4`}>
              {[1_000, 10_000, 50_000, 100_000].map((emails) => (
                <Link
                  key={emails}
                  href="/pricing/estimate"
                  className={`${L.cell} bg-white transition-colors hover:bg-[#f2f3f6]`}
                >
                  <p className="text-xs font-medium uppercase tracking-[1.2px] text-[#a8a29e]">
                    {emails.toLocaleString("en-IQ")} emails
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-[#1c1917]">
                    {formatMailIqD(estimateRawVolumeCost(emails))}
                  </p>
                  <p className="mt-1 text-xs text-[#57534e]">
                    Overage list price · before included quota
                  </p>
                </Link>
              ))}
            </div>
            <p className="mt-6 text-xs text-[#a8a29e]">
              Brackets:{" "}
              {MAIL_ESTIMATE_OVERAGE_BRACKETS.map((b) =>
                Number.isFinite(b.upToEmails)
                  ? `≤${b.upToEmails.toLocaleString("en-IQ")}: ${b.iqdPerThousand.toLocaleString("en-IQ")} IQD/1K`
                  : `above: ${b.iqdPerThousand.toLocaleString("en-IQ")} IQD/1K`,
              ).join(" · ")}
              . Estimate catalog — not yet metered in console billing.
            </p>
          </div>
        </section>

        <section id="enterprise-contact" className="border-b border-[#e7e5e4]">
          <div className={L.container}>
            <div className="grid gap-8 border-x border-[#e7e5e4] px-4 py-10 sm:px-8 md:grid-cols-2 md:items-center md:py-14">
              <div>
                <h2 className={L.sectionTitle}>Need more seats or a custom setup?</h2>
                <p className="mt-4 text-[15px] leading-[1.7] text-[#57534e]">
                  For larger workspaces, volume seats, or onboarding help — contact us.
                  We will size Premium seats and activate your plan in the console.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <MailFrameLink href={signedIn ? "/billing" : "/login?next=/billing"}>
                  Get Started
                </MailFrameLink>
                <a
                  href="mailto:support@rukny.io"
                  className="mail-frame-cta mail-frame-cta--ghost group relative inline-flex items-center justify-center gap-2 p-1.5 focus-visible:outline-none"
                >
                  <span className="mail-frame-ticks" aria-hidden>
                    <span className="mail-frame-tick mail-frame-tick--tl" />
                    <span className="mail-frame-tick mail-frame-tick--tr" />
                    <span className="mail-frame-tick mail-frame-tick--bl" />
                    <span className="mail-frame-tick mail-frame-tick--br" />
                  </span>
                  <span className="relative inline-flex items-center justify-center gap-2 border border-[#e7e5e4] bg-transparent px-5 py-2.5 text-[15px] font-medium leading-[1.4] text-[#57534e] transition-[color,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:border-[#1c1917]/30 group-hover:text-[#1c1917]">
                    Contact Us for Pricing
                  </span>
                </a>
              </div>
            </div>
            <ul className={`${L.gridFrame} border-t-0 sm:grid-cols-3`}>
              {[
                "Mailboxes on a domain you own",
                "DNS auth with SPF, DKIM, and DMARC",
                "Webmail, aliases, forwarders, catch-all",
              ].map((item) => (
                <li key={item} className={`${L.cell} flex gap-2 text-sm text-[#57534e]`}>
                  <Check className="mt-0.5 size-4 shrink-0 text-[#062c30]" strokeWidth={2.4} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="starter-plan-examples"
          className="border-b border-[#e7e5e4] py-12 sm:py-16"
        >
          <div className={L.container}>
            <p className={L.eyebrow}>Examples</p>
            <h2 className={L.sectionTitle}>What you can build on Starter</h2>
            <div className={`mt-10 ${L.gridFrame} md:grid-cols-3`}>
              {STARTER_BUILDS.map((item) => (
                <article key={item.title} className={`${L.cell} bg-white`}>
                  <h3 className="text-[15px] font-semibold text-[#1c1917] sm:text-base">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[1.2px] text-[#a8a29e]">
                    Given
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-[#57534e]">
                    {item.given.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <p className="mt-5 text-[11px] font-semibold uppercase tracking-[1.2px] text-[#02797E]">
                    Starter / upgrade path
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-[#57534e]">
                    {item.gets.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <p className="mt-8 border-t border-[#e7e5e4] pt-6 text-xs leading-relaxed text-[#a8a29e]">
              Disclaimer: Examples are illustrative only, not quotes or binding offers.
              Limits and features follow the plan catalog and may change. Starter starts
              after DNS verification; Standard and Premium require a console request.
            </p>
          </div>
        </section>

        <section id="plan-comparison-table" className="py-12 sm:py-16">
          <div className={L.container}>
            <p className={L.eyebrow}>Compare</p>
            <h2 className={L.sectionTitle}>Plan comparison</h2>

            <div className="mt-10 space-y-10 overflow-x-auto">
              {COMPARE_SECTIONS.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-3 text-sm font-semibold text-[#1c1917]">
                    {section.title}
                  </h3>
                  <table className="w-full min-w-[40rem] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#e7e5e4] text-left">
                        <th className="py-3 pr-4 font-medium text-[#a8a29e]">Feature</th>
                        {plans.map((plan) => (
                          <th
                            key={plan.id}
                            className="px-3 py-3 text-center font-semibold text-[#1c1917]"
                          >
                            {plan.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row) => (
                        <tr key={row.label} className="border-b border-[#e7e5e4]">
                          <td className="py-3 pr-4 text-[#57534e]">{row.label}</td>
                          <td className="px-3 py-3 text-center text-[#1c1917]">
                            <CellValue value={row.starter} />
                          </td>
                          <td className="px-3 py-3 text-center text-[#1c1917]">
                            <CellValue value={row.standard} />
                          </td>
                          <td className="px-3 py-3 text-center text-[#1c1917]">
                            <CellValue value={row.premium} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[#e7e5e4] pb-12 sm:pb-16 md:pb-[72px]">
          <div className={L.container}>
            <div className="border border-[#e7e5e4] bg-white px-6 py-12 text-center sm:px-12 md:py-16">
              <p className={L.eyebrow}>Get started</p>
              <h2 className="mt-2 text-[1.5rem] font-bold leading-[1.2] tracking-[-0.03em] text-[#1c1917] sm:text-[2rem]">
                Ready to send as yourself?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-[1.7] text-[#57534e] sm:text-base">
                Create a workspace, verify DNS, and open webmail. Upgrade seats when you
                are ready.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                <MailFrameLink href={primaryHref}>
                  {signedIn ? "Open console" : "Start Building"}
                </MailFrameLink>
                <MailFrameLink href="/pricing/estimate" variant="ghost">
                  Estimate your costs
                </MailFrameLink>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MailMarketingShell>
  );
}
