import Link from "next/link";
import {
  ArrowRight,
  Forward,
  KeyRound,
  Mails,
  Send,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { MailFrameLink } from "@/components/marketing/mail-frame-cta";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import { MailProductivitySection } from "@/components/marketing/mail-productivity-section";
import { MailWebmailPreview } from "@/components/marketing/mail-webmail-preview";
import {
  formatMailIqD,
  listMailPlans,
  mailPlanHighlights,
} from "@/lib/mail-plans";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

const BENEFITS = [
  {
    icon: Send,
    title: "Send at scale",
    body: "Outbound mail is delivered through Amazon SES, so transactional and team mail can grow without running your own SMTP fleet.",
  },
  {
    icon: ShieldCheck,
    title: "Authenticated from day one",
    body: "SPF, Easy DKIM, DMARC, and a custom MAIL FROM keep your From address aligned with your brand.",
  },
  {
    icon: Mails,
    title: "One console for routing",
    body: "Mailboxes, aliases, forwarders, catch-all, and automatic replies — without a separate admin panel per tool.",
  },
  {
    icon: KeyRound,
    title: "Mailbox sign-in",
    body: "Each mailbox has its own password. Optional TOTP is enrolled with a QR code before it is required.",
  },
] as const;

const USE_CASES = [
  {
    icon: Zap,
    title: "Transactional messages",
    body: "Order updates, password mail, and product notices from addresses such as you@yourdomain.",
  },
  {
    icon: Users,
    title: "Team inboxes",
    body: "Give people real addresses, webmail, and optional 2FA. Seats and storage stay on that workspace.",
  },
  {
    icon: Forward,
    title: "Routing without extra servers",
    body: "Forwarders, aliases, and catch-all keep mail flowing while you grow.",
  },
] as const;

const CONNECT_STEPS = [
  {
    step: "01",
    title: "Create a workspace",
    body: "Sign in with Rukny, create a workspace, then verify DNS. Starter starts after DNS.",
  },
  {
    step: "02",
    title: "Add your domain",
    body: "Connect a domain you own. You send as you@yourdomain.",
  },
  {
    step: "03",
    title: "Publish DNS",
    body: "Copy the records from the console. Keep them DNS-only.",
  },
  {
    step: "04",
    title: "Send from webmail",
    body: "Set a mailbox password, optionally turn on 2FA, then send.",
  },
] as const;

export function MailHomePage({
  signedIn,
}: {
  signedIn: boolean;
  emailsSent?: number;
}) {
  const primaryHref = signedIn ? "/apps" : "/login";
  const primaryLabel = signedIn ? "Open console" : "Start Building";
  const plans = listMailPlans();

  return (
    <MailMarketingShell signedIn={signedIn} plainBackground>
      <main className="overflow-x-clip">
        <section id="overview" className="relative border-b border-[#e7e5e4]">
          <div className={L.container}>
            <div className="grid grid-cols-1 items-start gap-10 py-12 md:gap-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-8">
              <div className="space-y-8 max-w-screen-sm">
                <p className={`mail-hero-enter ${L.heroBadge}`}>Rukny Mail</p>
                <h1 className={`mail-hero-enter-delayed ${L.heroTitle}`}>
                  Business email on your domain
                </h1>
                <p className={`mail-hero-enter-delayed ${L.heroLead}`}>
                  Create mailboxes, authenticate DNS, and send from webmail. You
                  keep the domain.
                </p>
                <div className="mail-hero-enter-delayed flex flex-wrap gap-2">
                  <MailFrameLink href={primaryHref}>{primaryLabel}</MailFrameLink>
                  <MailFrameLink href="/getting-started" variant="ghost">
                    Getting started
                  </MailFrameLink>
                </div>
              </div>

              <div className="mail-hero-enter-late hidden min-w-0 lg:block">
                <MailWebmailPreview />
              </div>
            </div>
          </div>

          <div className="mail-hero-enter-late border-t border-[#e7e5e4] lg:hidden">
            <div className="mx-auto max-w-6xl">
              <MailWebmailPreview fullBleed />
            </div>
          </div>
        </section>

        <section id="features" className={L.section} aria-labelledby="features-heading">
          <div className={L.container}>
            <p className={L.eyebrow}>Why Rukny Mail</p>
            <h2 id="features-heading" className={L.sectionTitle}>
              Outbound, inbound, and the mailbox your team uses
            </h2>
            <p className={L.sectionLead}>
              A cloud email stack for businesses that already own a domain:
              delivery, DNS you publish, and a console for people and routing.
            </p>

            <ul className={`mt-10 ${L.gridFrame} sm:grid-cols-2`}>
              {BENEFITS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className={`flex gap-4 ${L.cell}`}>
                    <span className="flex size-10 shrink-0 items-center justify-center border border-[#e7e5e4] bg-white text-[#062c30] sm:size-11">
                      <Icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="mb-1 font-mono text-[10px] tracking-wide text-[#a8a29e]">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="text-[15px] font-semibold text-[#1c1917] sm:text-base">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-[13px] leading-[1.75] text-[#57534e] sm:text-[14px]">
                        {item.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <MailProductivitySection />

        <section id="connect" className={L.section}>
          <div className={L.container}>
            <p className={L.eyebrow}>Connect</p>
            <h2 className={L.sectionTitle}>
              Link your domain, then send as yourself
            </h2>
            <p className={L.sectionLead}>
              Connect a domain you own. DNS records appear in the console after
              you add the domain.
            </p>
            <ol className={`mt-10 ${L.gridFrame} sm:grid-cols-2 lg:grid-cols-4`}>
              {CONNECT_STEPS.map((item) => (
                <li key={item.step} className={L.cell}>
                  <p className="font-mono text-[10px] tracking-wide text-[#a8a29e]">
                    {item.step}
                  </p>
                  <h3 className="mt-2 text-[15px] font-semibold text-[#1c1917]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-[1.75] text-[#57534e]">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="use-cases" className={L.section}>
          <div className={L.container}>
            <p className={L.eyebrow}>Use cases</p>
            <h2 className={L.sectionTitle}>Built for the mail you already send</h2>
            <div className={`mt-10 ${L.gridFrame} md:grid-cols-3`}>
              {USE_CASES.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className={L.cell}>
                    <span className="flex size-10 items-center justify-center border border-[#e7e5e4] bg-white text-[#062c30]">
                      <Icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
                    </span>
                    <h3 className="mt-4 text-[15px] font-semibold text-[#1c1917] sm:text-base">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-[1.75] text-[#57534e] sm:text-[14px]">
                      {item.body}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className={L.section}>
          <div className={L.container}>
            <p className={L.eyebrow}>Pricing</p>
            <h2 className={L.sectionTitle}>
              Plans per workspace, billed monthly in IQD
            </h2>
            <p className={L.sectionLead}>
              Each workspace has its own subscription. Starter starts after DNS is verified;
              Standard and Premium are requested in the console.
            </p>
            <div className={`mt-10 ${L.gridFrame} md:grid-cols-3`}>
              {plans.map((plan) => (
                <article key={plan.id} className={`flex flex-col ${L.cell} bg-white`}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[15px] font-semibold text-[#1c1917] sm:text-base">
                      {plan.name}
                    </h3>
                    {plan.popular ? (
                      <span className="border border-[#e7e5e4] bg-[#f2f3f6] px-2.5 py-0.5 text-[11px] font-semibold text-[#062c30]">
                        Popular
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[#57534e]">{plan.bestFor}</p>
                  <p className="mt-4 text-2xl font-bold tracking-tight text-[#1c1917]">
                    {formatMailIqD(plan.priceMonthly)}
                    <span className="text-sm font-medium text-[#a8a29e]">/mo</span>
                  </p>
                  <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm text-[#57534e]">
                    {mailPlanHighlights(plan).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <Link
              href="/pricing"
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[#062c30] transition-colors hover:text-[#1c1917]"
            >
              Full pricing and plan requests
              <ArrowRight className="size-4" aria-hidden />
            </Link>
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
                Sign in, connect your domain, and open webmail when DNS is ready.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                <MailFrameLink href={primaryHref}>{primaryLabel}</MailFrameLink>
                <MailFrameLink href="/getting-started" variant="ghost">
                  Getting started
                </MailFrameLink>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MailMarketingShell>
  );
}
