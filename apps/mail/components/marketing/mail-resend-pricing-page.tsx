import { resolveDeveloperUrl } from "@rukny/auth/client/env-urls";
import {
  EMAIL_API_ADDONS,
  EMAIL_API_AUTOMATION,
  EMAIL_API_MARKETING_PLANS,
  EMAIL_API_OVERAGE_PACK,
  EMAIL_API_TRANSACTIONAL_PLANS,
  type EmailApiPlanDefinition,
  formatEmailApiContacts,
  formatEmailApiIqD,
  formatEmailApiPlanTitle,
  formatEmailApiVolume,
} from "@rukny/email-api-pricing";
import {
  FEATURED_TRANSACTIONAL_PLAN_IDS,
  FEATURED_TRANSACTIONAL_PLANS,
  featuredPlanCopy,
  type FeaturedTransactionalPlanId,
} from "@/lib/email-api-featured-plans";
import { MailEmailApiPricingEstimate } from "@/components/marketing/mail-email-api-pricing-estimate";
import {
  MailEmailApiTierCard,
  MailEmailApiTierPrice,
} from "@/components/marketing/mail-email-api-tier-card";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import { MailReveal } from "@/components/marketing/mail-reveal";
import { agLayout } from "@/lib/mail-antigravity-theme";
import { getCurrentMailUser } from "@/lib/current-user";

const FEATURED_TRANSACTIONAL_IDS: ReadonlySet<string> = new Set(
  FEATURED_TRANSACTIONAL_PLAN_IDS,
);

const FAQ = [
  {
    q: "Is Email API separate from mailbox hosting?",
    a: "Yes. This page covers transactional and marketing email from your apps. Hosted mailboxes are managed inside the Mail console billing — not listed here.",
  },
  {
    q: "How does overage work?",
    a: `When you exceed your plan quota, prepaid packs are ${EMAIL_API_OVERAGE_PACK.priceIqd.toLocaleString("en-IQ")} IQD per ${EMAIL_API_OVERAGE_PACK.emails.toLocaleString("en-IQ")} emails.`,
  },
  {
    q: "Do marketing plans limit sends?",
    a: "Marketing plans are billed by contacts stored — broadcasts can only reach existing contacts, similar to Resend.",
  },
] as const;

function SectionIntro({
  eyebrow,
  title,
  lead,
  id,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <MailReveal className="mx-auto max-w-2xl text-center">
      <p className="text-[12px] font-medium tracking-[0.14em] text-[#9CA3AF]">{eyebrow}</p>
      <h2 id={id} className={`${agLayout.sectionTitle} mt-4`}>
        {title}
      </h2>
      {lead ? <p className={`${agLayout.lead} mx-auto mt-4 max-w-xl`}>{lead}</p> : null}
    </MailReveal>
  );
}

function PricingRow({
  label,
  price,
  detail,
}: {
  label: string;
  price: string;
  detail: string;
}) {
  return (
    <li className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[minmax(0,1.1fr)_auto_minmax(0,1fr)] sm:items-baseline sm:gap-x-8 sm:py-5">
      <span className="text-[15px] font-medium text-[#1D1D1D]">{label}</span>
      <span className="text-[15px] tabular-nums text-[#1D1D1D] sm:text-end">{price}</span>
      <span className="text-[14px] text-[#6B6F76] sm:text-end">{detail}</span>
    </li>
  );
}

function TransactionalPlanCard({
  plan,
  ctaHref,
}: {
  plan: EmailApiPlanDefinition;
  ctaHref: string;
}) {
  const card = featuredPlanCopy(plan.id as FeaturedTransactionalPlanId) ?? {
    taglineEn: "Transactional email for your apps",
    taglineAr: "بريد معاملات لتطبيقاتك",
    featuresEn: [formatEmailApiVolume(plan)],
    featuresAr: [formatEmailApiVolume(plan)],
  };
  const overageLine = plan.overagePer1kIqd
    ? `Extra emails ${plan.overagePer1kIqd.toLocaleString("en-IQ")} IQD / 1,000`
    : null;

  return (
    <MailEmailApiTierCard
      surface="muted"
      eyebrow={<span className="text-[12px] font-medium text-[#9CA3AF]">{card.taglineEn}</span>}
      title={formatEmailApiPlanTitle(plan)}
      priceAmount={plan.priceMonthlyIqd}
      volumeLine={formatEmailApiVolume(plan)}
      overageLine={overageLine}
      features={card.featuresEn}
      ctaHref={ctaHref}
    />
  );
}

export async function MailResendPricingPage() {
  const user = await getCurrentMailUser();
  const signedIn = Boolean(user);
  const developer = resolveDeveloperUrl();
  const featuredTransactional = FEATURED_TRANSACTIONAL_PLANS;
  const scaleTransactional = EMAIL_API_TRANSACTIONAL_PLANS.filter(
    (plan) => plan.selfServe && !FEATURED_TRANSACTIONAL_IDS.has(plan.id),
  );
  const marketingPlans = EMAIL_API_MARKETING_PLANS.filter((plan) => plan.selfServe);
  const startHref = signedIn ? `${developer}/apps` : `${developer}/login?next=/apps`;

  return (
    <MailMarketingShell signedIn={signedIn} plainBackground variant="antigravity">
      <main className="overflow-x-clip bg-white text-[#1D1D1D]">
        <section className="bg-white py-16 sm:py-24">
          <div className={`${agLayout.container} text-center`}>
            <MailReveal className="mx-auto max-w-2xl">
              <p className="text-[12px] font-medium tracking-[0.14em] text-[#9CA3AF]">
                Email API pricing
              </p>
              <h1 className={`${agLayout.heroTitle} mt-6`}>
                Send email at scale
                <span className="text-[#9CA3AF]"> — in IQD</span>
              </h1>
              <p className={`${agLayout.lead} mx-auto mt-5 max-w-xl`}>
                Transactional, marketing contacts, automations, and add-ons — one catalog,
                billed monthly. Start free with 3,000 emails per month.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <a href={startHref} className={agLayout.btnPrimary}>
                  {signedIn ? "Open developer portal" : "Start with Email API"}
                </a>
                <a
                  href={`${developer}/documentation/email-api/quotas`}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#F5F5F5] px-6 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:bg-[#EBEBEB]"
                >
                  Quotas & limits
                </a>
              </div>
            </MailReveal>
          </div>
        </section>

        <section className="bg-[#FAFAFA] py-14 sm:py-20" aria-labelledby="estimate-heading">
          <div className={agLayout.container}>
            <SectionIntro
              id="estimate-heading"
              eyebrow="Estimate"
              title="Start free and scale as you grow"
              lead="Drag the slider to see which tier fits your volume — transactional or marketing contacts."
            />
            <div className="mt-14">
              <MailEmailApiPricingEstimate startHref={startHref} />
            </div>
          </div>
        </section>

        <section id="email-api" className="bg-white py-14 sm:py-20" aria-labelledby="transactional-heading">
          <div className={agLayout.container}>
            <SectionIntro
              id="transactional-heading"
              eyebrow="Transactional"
              title="Transactional email"
              lead="OTP, receipts, alerts, and product notifications via REST or @rukny/email."
            />

            <div className="mx-auto mt-14 max-w-6xl">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {featuredTransactional.map((plan) => (
                  <TransactionalPlanCard
                    key={plan.id}
                    plan={plan}
                    ctaHref={startHref}
                  />
                ))}
              </div>
            </div>

            {scaleTransactional.length > 0 ? (
              <ul className="mx-auto mt-12 max-w-3xl">
                <li className="mb-4 text-center text-[12px] font-medium tracking-[0.12em] text-[#9CA3AF]">
                  More volume
                </li>
                {scaleTransactional.map((plan) => (
                  <PricingRow
                    key={plan.id}
                    label={formatEmailApiPlanTitle(plan)}
                    price={`${formatEmailApiIqD(plan.priceMonthlyIqd)}${plan.priceMonthlyIqd > 0 ? " / mo" : ""}`}
                    detail={`${formatEmailApiVolume(plan)} · Overage ${plan.overagePer1kIqd.toLocaleString("en-IQ")} IQD / 1K`}
                  />
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        <section className="bg-[#FAFAFA] py-14 sm:py-20" aria-labelledby="marketing-heading">
          <div className={agLayout.container}>
            <SectionIntro
              id="marketing-heading"
              eyebrow="Marketing"
              title="Marketing contacts"
              lead="Billed by contacts stored — not by emails sent. Broadcasts reach existing contacts only."
            />
            <ul className="mx-auto mt-12 max-w-3xl">
              {marketingPlans.map((plan) => (
                <PricingRow
                  key={plan.id}
                  label={formatEmailApiPlanTitle(plan)}
                  price={`${formatEmailApiIqD(plan.priceMonthlyIqd)}${plan.priceMonthlyIqd > 0 ? " / mo" : ""}`}
                  detail={formatEmailApiContacts(plan.contactsLimit)}
                />
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-20" aria-labelledby="automations-heading">
          <div className={agLayout.container}>
            <SectionIntro
              id="automations-heading"
              eyebrow="Automations"
              title="Pay-as-you-go runs"
              lead="Every paid plan includes a monthly automation allowance. Free tier included — no overage on free."
            />
            <div className="mx-auto mt-10 max-w-xl rounded-[1.5rem] bg-white p-8 text-center sm:p-10">
              <p className="text-[2rem] font-medium tracking-[-0.03em] text-[#1D1D1D]">
                {EMAIL_API_AUTOMATION.includedRunsPerMonth.toLocaleString("en-IQ")}
              </p>
              <p className="mt-2 text-[14px] text-[#6B6F76]">automation runs / mo included</p>
              <p className="mt-6 text-[14px] text-[#6B6F76]">
                Then {EMAIL_API_AUTOMATION.overagePriceIqdPerRun} IQD per run on paid plans.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#FAFAFA] py-14 sm:py-20" aria-labelledby="addons-heading">
          <div className={agLayout.container}>
            <SectionIntro
              id="addons-heading"
              eyebrow="Add-ons"
              title="Optional add-ons"
              lead="Add or remove from the developer portal when you need more domains, deliverability, or SSO."
            />
            <ul className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
              <li className="rounded-[1.5rem] bg-[#FAFAFA] p-6">
                <p className="text-[15px] font-medium text-[#1D1D1D]">+100 domains</p>
                <div className="mt-5">
                  <MailEmailApiTierPrice amount={EMAIL_API_ADDONS.domainsPack.priceMonthlyIqd} />
                </div>
              </li>
              <li className="rounded-[1.5rem] bg-[#FAFAFA] p-6">
                <p className="text-[15px] font-medium text-[#1D1D1D]">Dedicated IP</p>
                <div className="mt-5">
                  <MailEmailApiTierPrice amount={EMAIL_API_ADDONS.dedicatedIp.priceMonthlyIqd} />
                </div>
              </li>
              <li className="rounded-[1.5rem] bg-[#FAFAFA] p-6">
                <p className="text-[15px] font-medium text-[#1D1D1D]">Single Sign-On</p>
                <div className="mt-5">
                  <MailEmailApiTierPrice amount={EMAIL_API_ADDONS.sso.priceMonthlyIqd} />
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-20" aria-labelledby="enterprise-heading">
          <div className={agLayout.container}>
            <div className="mx-auto max-w-2xl rounded-[1.5rem] bg-white p-8 text-center sm:p-10">
              <p className="text-[12px] font-medium tracking-[0.14em] text-[#9CA3AF]">
                Enterprise
              </p>
              <h2 id="enterprise-heading" className={`${agLayout.sectionTitle} mt-4`}>
                3M+ emails per month
              </h2>
              <p className={`${agLayout.lead} mx-auto mt-4 max-w-lg`}>
                Custom volume pricing, dedicated IPs, SLA, and migration support for high-volume
                senders.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a href="mailto:support@rukny.io?subject=Email%20API%20Enterprise" className={agLayout.btnPrimary}>
                  Contact sales
                </a>
                <a href={`${developer}/documentation/email-api`} className="inline-flex h-11 items-center justify-center rounded-full bg-[#F5F5F5] px-6 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:bg-[#EBEBEB]">
                  Read docs
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className={`${agLayout.container} mx-auto max-w-2xl`}>
            <h2 className={`${agLayout.sectionTitle} text-center`}>FAQ</h2>
            <ul className="mt-8 space-y-6">
              {FAQ.map((item) => (
                <li key={item.q}>
                  <p className="text-[15px] font-medium text-[#1D1D1D]">{item.q}</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#6B6F76]">{item.a}</p>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-center text-[13px] text-[#9CA3AF]">
              Overage packs: {EMAIL_API_OVERAGE_PACK.emails.toLocaleString("en-IQ")} emails for{" "}
              {EMAIL_API_OVERAGE_PACK.priceIqd.toLocaleString("en-IQ")} IQD.
            </p>
          </div>
        </section>
      </main>
    </MailMarketingShell>
  );
}
