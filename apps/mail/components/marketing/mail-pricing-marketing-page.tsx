import Link from "next/link";
import { Check } from "lucide-react";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import { MailReveal } from "@/components/marketing/mail-reveal";
import {
  MAIL_ESTIMATE_INCLUDED_OUTBOUND,
} from "@/lib/mail-estimate-catalog";
import {
  formatMailIqD,
  listMailPlans,
  mailPlanHighlights,
  type MailPlanDefinition,
  type MailPlanId,
} from "@/lib/mail-plans";
import { agLayout } from "@/lib/mail-antigravity-theme";
import { getCurrentMailUser } from "@/lib/current-user";

const CTA_BY_PLAN: Record<
  MailPlanId,
  { label: string; hrefSignedOut: string; hrefSignedIn: string }
> = {
  starter: {
    label: "Get started",
    hrefSignedOut: "/login",
    hrefSignedIn: "/apps",
  },
  standard: {
    label: "Get started",
    hrefSignedOut: "/login?next=/billing",
    hrefSignedIn: "/billing",
  },
  premium: {
    label: "Get started",
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
      "1 mailbox with 5 GB · owner-only console",
      "10 aliases for routing",
      "AI assistant + 4,000 outbound / mo included",
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
      "Upgrade to Standard for 3 seats + console team",
      "20 GB per mailbox · open tracking",
      "10,000 outbound emails / mo included",
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
        label: "Console members",
        starter: "Owner only",
        standard: "4",
        premium: "10",
      },
      {
        label: "Extra mailbox",
        starter: "2,000 IQD/mo",
        standard: "3,000 IQD/mo",
        premium: "4,000 IQD/mo",
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
        label: "Extra outbound emails",
        starter: "800 IQD / 1,000",
        standard: "800 IQD / 1,000",
        premium: "800 IQD / 1,000",
      },
      {
        label: "Outbound emails included / mo",
        starter: "4,000",
        standard: "10,000",
        premium: "30,000",
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
      <Check
        className="mx-auto size-4 text-[#34A853]"
        strokeWidth={2.4}
        aria-label="Included"
      />
    ) : (
      <span className="text-[#9CA3AF]" aria-label="Not included">
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
    <article
      className={
        plan.popular
          ? "flex flex-col rounded-2xl border border-[#1D1D1D] bg-white p-6 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.18)] sm:p-7"
          : "flex flex-col rounded-2xl border border-[#E8E8E8] bg-white p-6 sm:p-7"
      }
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[1.25rem] font-medium text-[#1D1D1D]">{plan.name}</h2>
        {plan.popular ? (
          <span className="rounded-full bg-[#1D1D1D] px-2.5 py-0.5 text-[11px] font-medium text-white">
            Popular
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-[#6B6F76]">For {plan.bestFor}.</p>

      <p className="mt-6 text-[2rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
        {formatMailIqD(plan.priceMonthly)}
        <span className="text-sm font-medium text-[#9CA3AF]">/mo</span>
      </p>
      <p className="mt-1 text-xs text-[#6B6F76]">
        + {formatMailIqD(plan.priceExtraMailbox)}/mo per extra mailbox
      </p>
      <p className="mt-3 text-sm font-medium text-[#6B6F76]">
        {MAIL_ESTIMATE_INCLUDED_OUTBOUND[plan.id].toLocaleString("en-IQ")}{" "}
        outbound emails / mo included
      </p>

      <Link
        href={href}
        className={`${plan.popular ? agLayout.btnPrimary : agLayout.btnSecondary} mt-6 w-full`}
      >
        {cta.label}
      </Link>

      <ul className="mt-7 flex flex-1 flex-col gap-2.5 border-t border-[#E8E8E8] pt-6">
        {highlights.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-[#6B6F76]">
            <Check
              className="mt-0.5 size-4 shrink-0 text-[#34A853]"
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
    <MailMarketingShell
      signedIn={signedIn}
      plainBackground
      variant="antigravity"
    >
      <main className="overflow-x-clip bg-white text-[#1D1D1D]">
        <section className="border-b border-[#E8E8E8]">
          <div
            className={`${agLayout.container} flex flex-col items-center py-16 text-center sm:py-20`}
          >
            <MailReveal className="max-w-2xl">
              <p className={agLayout.pill}>Pricing</p>
              <h1 className={`${agLayout.heroTitle} mt-6`}>
                Start with one mailbox, scale when you are ready
              </h1>
              <p className={`${agLayout.lead} mx-auto mt-5 max-w-xl`}>
                Plans are per workspace, billed monthly in IQD. Starter is one
                mailbox and an owner-only console — open tracking, console team,
                and more seats start on Standard.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Link href={primaryHref} className={agLayout.btnPrimary}>
                  {signedIn ? "Open console" : "Get started"}
                </Link>
                <Link href="/pricing/estimate" className={agLayout.btnSecondary}>
                  Estimate costs
                </Link>
              </div>
            </MailReveal>
          </div>
        </section>

        <section
          className={`${agLayout.container} py-14 sm:py-20`}
          aria-labelledby="plans-heading"
        >
          <h2 id="plans-heading" className="sr-only">
            Plans
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} signedIn={signedIn} />
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-[13px] text-[#9CA3AF]">
            Starter activates after DNS verification and checkout in the
            console. Standard and Premium are requested from Billing.
          </p>
        </section>

        <section className="border-t border-[#E8E8E8] bg-[#FAFAFA] py-14 sm:py-20">
          <div className={agLayout.container}>
            <MailReveal className="mx-auto max-w-xl text-center">
              <h2 className={agLayout.sectionTitle}>Outbound included by plan</h2>
              <p className={`${agLayout.lead} mt-4`}>
                Each plan includes a monthly send quota. When you run out, buy
                prepaid packs at 800 IQD per 1,000 emails from Billing → Usage.
              </p>
            </MailReveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {plans.map((plan) => (
                <Link
                  key={plan.id}
                  href="/pricing/estimate"
                  className={`${agLayout.card} block hover:bg-white`}
                >
                  <p className="text-[12px] font-medium text-[#9CA3AF]">
                    {plan.name}
                  </p>
                  <p className="mt-2 text-2xl font-medium tracking-tight text-[#1D1D1D]">
                    {MAIL_ESTIMATE_INCLUDED_OUTBOUND[plan.id].toLocaleString(
                      "en-IQ",
                    )}
                  </p>
                  <p className="mt-1 text-xs text-[#6B6F76]">
                    outbound emails / mo included
                  </p>
                </Link>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-[#9CA3AF]">
              Planning for higher volume?{" "}
              <Link
                href="/pricing/estimate"
                className="font-medium text-[#6B6F76] underline-offset-2 hover:underline"
              >
                Estimate seats and quotas
              </Link>
              .
            </p>
          </div>
        </section>

        <section
          id="enterprise-contact"
          className="border-t border-[#E8E8E8] py-14 sm:py-20"
        >
          <div className={agLayout.container}>
            <div className="grid items-center gap-8 rounded-2xl border border-[#E8E8E8] bg-white p-8 sm:p-10 md:grid-cols-2">
              <div>
                <h2 className={agLayout.sectionTitle}>
                  Need more seats or a custom setup?
                </h2>
                <p className={`${agLayout.lead} mt-4`}>
                  For larger workspaces, volume seats, or onboarding help —
                  contact us. We will size Premium seats and activate your plan
                  in the console.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link
                  href={signedIn ? "/billing" : "/login?next=/billing"}
                  className={agLayout.btnPrimary}
                >
                  Open billing
                </Link>
                <a href="mailto:support@rukny.io" className={agLayout.btnSecondary}>
                  Contact support
                </a>
              </div>
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                "Mailboxes on a domain you own",
                "DNS auth with SPF, DKIM, and DMARC",
                "Webmail, aliases, forwarders, catch-all",
              ].map((item) => (
                <li
                  key={item}
                  className="flex gap-2 rounded-2xl border border-[#E8E8E8] bg-white px-5 py-4 text-sm text-[#6B6F76]"
                >
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-[#34A853]"
                    strokeWidth={2.4}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="starter-plan-examples"
          className="border-t border-[#E8E8E8] bg-[#FAFAFA] py-14 sm:py-20"
        >
          <div className={agLayout.container}>
            <MailReveal className="mx-auto max-w-xl text-center">
              <p className={agLayout.pill}>Examples</p>
              <h2 className={`${agLayout.sectionTitle} mt-5`}>
                What you can build on Starter
              </h2>
            </MailReveal>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {STARTER_BUILDS.map((item) => (
                <article key={item.title} className={agLayout.card}>
                  <h3 className="text-[15px] font-medium text-[#1D1D1D] sm:text-base">
                    {item.title}
                  </h3>
                  <p className="mt-5 text-[12px] font-medium text-[#9CA3AF]">
                    Given
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-[#6B6F76]">
                    {item.given.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <p className="mt-5 text-[12px] font-medium text-[#6B6F76]">
                    Starter / upgrade path
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-[#6B6F76]">
                    {item.gets.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-[#9CA3AF]">
              Starter is one mailbox and an owner-only console. Open tracking,
              console team seats, and higher outbound quotas start on Standard.
              Examples are illustrative — limits follow the plan catalog.
            </p>
          </div>
        </section>

        <section
          id="plan-comparison-table"
          className="border-t border-[#E8E8E8] py-14 sm:py-20"
        >
          <div className={agLayout.container}>
            <MailReveal className="mx-auto max-w-xl text-center">
              <h2 className={agLayout.sectionTitle}>Plan comparison</h2>
            </MailReveal>

            <div className="mt-10 space-y-10 overflow-x-auto">
              {COMPARE_SECTIONS.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-3 text-sm font-medium text-[#1D1D1D]">
                    {section.title}
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-[#E8E8E8]">
                    <table className="w-full min-w-[40rem] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-[#E8E8E8] bg-[#FAFAFA] text-left">
                          <th className="px-4 py-3 font-medium text-[#9CA3AF]">
                            Feature
                          </th>
                          {plans.map((plan) => (
                            <th
                              key={plan.id}
                              className="px-3 py-3 text-center font-medium text-[#1D1D1D]"
                            >
                              {plan.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.map((row) => (
                          <tr
                            key={row.label}
                            className="border-b border-[#E8E8E8] last:border-b-0"
                          >
                            <td className="px-4 py-3 text-[#6B6F76]">
                              {row.label}
                            </td>
                            <td className="px-3 py-3 text-center text-[#1D1D1D]">
                              <CellValue value={row.starter} />
                            </td>
                            <td className="px-3 py-3 text-center text-[#1D1D1D]">
                              <CellValue value={row.standard} />
                            </td>
                            <td className="px-3 py-3 text-center text-[#1D1D1D]">
                              <CellValue value={row.premium} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[#E8E8E8] pb-16 pt-14 sm:pb-20 sm:pt-16">
          <div className={agLayout.container}>
            <div className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] px-6 py-14 text-center sm:px-12">
              <h2 className={agLayout.sectionTitle}>Ready to send as yourself?</h2>
              <p className={`${agLayout.lead} mx-auto mt-4 max-w-lg`}>
                Create a workspace, verify DNS, complete checkout for Starter,
                and open webmail. Upgrade seats when your team needs more.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href={primaryHref} className={agLayout.btnPrimary}>
                  {signedIn ? "Open console" : "Get started"}
                </Link>
                <Link href="/pricing/estimate" className={agLayout.btnSecondary}>
                  Estimate costs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MailMarketingShell>
  );
}
