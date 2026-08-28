import Link from "next/link";
import {
  ArrowRight,
  Forward,
  Inbox,
  KeyRound,
  Mails,
  Send,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import { MailProductivitySection } from "@/components/marketing/mail-productivity-section";
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
  const primaryLabel = signedIn ? "Open console" : "Get started";
  const plans = listMailPlans();

  return (
    <MailMarketingShell signedIn={signedIn} plainBackground>
      <main className="overflow-x-clip pt-14">
        <section id="overview" className={`relative ${L.heroPad}`}>
          <div className="pointer-events-none absolute inset-0 mx-auto hidden min-h-[28rem] w-full max-w-6xl lg:block" aria-hidden>
            <div className="absolute inset-y-0 left-0 w-px bg-[#E8ECF0]/80" />
            <div className="absolute inset-y-0 right-0 w-px bg-[#E8ECF0]/80" />
          </div>

          <div className="relative mx-auto flex max-w-6xl flex-col items-center">
            <p className={`mail-hero-enter ${L.heroBadge}`}>Rukny Mail</p>
            <h1 className={`mail-hero-enter-delayed mt-5 ${L.heroTitle}`}>
            Business email on your domain
            <span className="mt-2 block text-[#02797E]">by Rukny</span>
            </h1>
            <p className={`mail-hero-enter-delayed mt-5 ${L.heroLead}`}>
              Create mailboxes, authenticate DNS, and send from webmail. You
              keep the domain.
            </p>
            <div className="mail-hero-enter-delayed mt-8 flex w-full max-w-sm flex-col gap-2.5 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
              <Link href={primaryHref} className={L.btnPrimary}>
                {primaryLabel}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/getting-started" className={L.btnGhost}>
                Getting started
              </Link>
              <Link href="/tutorials" className={L.btnGhost}>
                Tutorials
              </Link>
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

            <ul
              className="mt-10 grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 sm:rounded-3xl"
              style={{ borderColor: "#E8ECF0", backgroundColor: "#E8ECF0" }}
            >
              {BENEFITS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex gap-4 bg-white p-5 sm:p-6">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F6F7F8] text-[#062c30] sm:size-11">
                      <Icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="mb-1 font-mono text-[10px] tracking-wide text-[#132327]/45">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="text-[15px] font-semibold text-[#132327] sm:text-base">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-[13px] leading-[1.75] text-[#132327]/55 sm:text-[14px]">
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
            <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-4 sm:rounded-3xl" style={{ borderColor: "#E8ECF0", backgroundColor: "#E8ECF0" }}>
              {CONNECT_STEPS.map((item) => (
                <li key={item.step} className="bg-white p-5 sm:p-6">
                  <p className="font-mono text-[10px] tracking-wide text-[#132327]/45">
                    {item.step}
                  </p>
                  <h3 className="mt-2 text-[15px] font-semibold text-[#132327]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-[1.75] text-[#132327]/55">
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
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {USE_CASES.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-[#E8ECF0] bg-white/80 p-5 sm:p-6"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#F6F7F8] text-[#062c30]">
                      <Icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
                    </span>
                    <h3 className="mt-4 text-[15px] font-semibold text-[#132327] sm:text-base">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-[1.75] text-[#132327]/55 sm:text-[14px]">
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
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.id}
                  className="flex flex-col rounded-2xl border border-[#E8ECF0] bg-white p-5 sm:p-6"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[15px] font-semibold text-[#132327] sm:text-base">
                      {plan.name}
                    </h3>
                    {plan.popular ? (
                      <span className="rounded-full bg-[#EEF2F2] px-2.5 py-0.5 text-[11px] font-semibold text-[#062c30]">
                        Popular
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[#132327]/55">{plan.bestFor}</p>
                  <p className="mt-4 text-2xl font-bold tracking-tight text-[#132327]">
                    {formatMailIqD(plan.priceMonthly)}
                    <span className="text-sm font-medium text-[#132327]/45">
                      /mo
                    </span>
                  </p>
                  <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm text-[#132327]/55">
                    {mailPlanHighlights(plan).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <Link
              href={signedIn ? "/pricing" : "/login?next=/pricing"}
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[#062c30]"
            >
              Full pricing and plan requests
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>

        <section className="pb-12 sm:pb-16 md:pb-[72px]">
          <div className={L.container}>
            <div className="relative mx-auto flex flex-col gap-5 overflow-hidden rounded-2xl p-6 text-center sm:gap-8 sm:rounded-[34px] sm:p-12 md:p-16">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgba(210, 214, 239, 0.2) 0%, rgba(210, 214, 239, 0.2) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)",
                }}
              />
              <div className="relative">
                <h2 className="text-[1.5rem] font-bold leading-[1.25] tracking-[-0.025em] text-[#132327] sm:text-[2rem]">
                  Ready to send as yourself?
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-[1.85] text-[#132327]/58 sm:text-base">
                  Sign in, connect your domain, and open webmail when DNS is
                  ready.
                </p>
                <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
                  <Link href={primaryHref} className={L.btnPrimary}>
                    <Inbox className="size-4" aria-hidden />
                    {primaryLabel}
                  </Link>
                  <Link href="/getting-started" className={L.btnGhost}>
                    Getting started
                    <ArrowRight className="size-3.5 opacity-60" aria-hidden />
                  </Link>
                  <Link href="/tutorials" className={L.btnGhost}>
                    Tutorials
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MailMarketingShell>
  );
}
