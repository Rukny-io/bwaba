"use client";

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
import {
  MailDnsArchitectureSection,
  MailResourcesSection,
  MailSecurityBand,
} from "@/components/marketing/mail-home-bands";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import {
  MailClipReveal,
  MailCountUp,
  MailMagnetic,
  MailParallaxFrame,
  MailSplitWords,
  MailSpotlight,
} from "@/components/marketing/mail-motion-kit";
import { MailProductivitySection } from "@/components/marketing/mail-productivity-section";
import { MailProvidersMarquee } from "@/components/marketing/mail-providers-marquee";
import {
  MailHeroMotion,
  MailReveal,
  MailRevealItem,
  MailStagger,
} from "@/components/marketing/mail-reveal";
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

const SIGNAL_STATS = [
  { value: 99, suffix: ".9%", label: "Delivery focus" },
  { value: 1, suffix: " console", label: "Mailboxes + routing" },
  { value: 3, suffix: " auth layers", label: "SPF · DKIM · DMARC" },
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
        <section id="overview" className="relative border-b border-[#d7ebea]">
          <div className={L.container}>
            <div className="relative grid grid-cols-1 items-start gap-10 py-12 md:gap-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-8">
              <div className="max-w-screen-sm space-y-8">
                <MailHeroMotion>
                  <p className={L.heroBadge}>Rukny Mail</p>
                </MailHeroMotion>
                <MailSplitWords
                  text="Business email on your domain"
                  className={L.heroTitle}
                  delay={0.06}
                />
                <MailHeroMotion delay={0.28}>
                  <p className={L.heroLead}>
                    Create mailboxes, authenticate DNS, and send from webmail. You
                    keep the domain.
                  </p>
                </MailHeroMotion>
                <MailHeroMotion delay={0.36}>
                  <div className="flex flex-wrap gap-2">
                    <MailMagnetic strength={14}>
                      <MailFrameLink href={primaryHref}>{primaryLabel}</MailFrameLink>
                    </MailMagnetic>
                    <MailMagnetic strength={10}>
                      <MailFrameLink href="/getting-started" variant="ghost">
                        Getting started
                      </MailFrameLink>
                    </MailMagnetic>
                  </div>
                </MailHeroMotion>
              </div>

              <MailHeroMotion delay={0.22} className="hidden min-w-0 lg:block">
                <MailParallaxFrame>
                  <MailWebmailPreview />
                </MailParallaxFrame>
              </MailHeroMotion>
            </div>
          </div>

          <MailHeroMotion delay={0.3} className="border-t border-[#d7ebea] lg:hidden">
            <div className="mx-auto max-w-6xl">
              <MailWebmailPreview fullBleed />
            </div>
          </MailHeroMotion>
        </section>

        <MailProvidersMarquee />

        <section className="border-b border-[#d7ebea] bg-[#eef5f4]">
          <div className={L.container}>
            <MailStagger
              className="grid border-x border-[#d7ebea] sm:grid-cols-3"
              stagger={0.1}
            >
              {SIGNAL_STATS.map((stat) => (
                <MailRevealItem
                  key={stat.label}
                  className="border-b border-[#d7ebea] bg-[#eef5f4] px-5 py-8 sm:border-b-0 sm:border-e sm:last:border-e-0 sm:px-8"
                >
                  <p className="text-3xl font-bold tracking-tight text-[#062c30] sm:text-4xl">
                    <MailCountUp value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-sm text-[#4a5c5a]">{stat.label}</p>
                </MailRevealItem>
              ))}
            </MailStagger>
          </div>
        </section>

        <section id="features" className={L.section} aria-labelledby="features-heading">
          <div className={L.container}>
            <MailReveal>
              <p className={L.eyebrow}>Why Rukny Mail</p>
              <MailClipReveal>
                <h2 id="features-heading" className={L.sectionTitle}>
                  Outbound, inbound, and the mailbox your team uses
                </h2>
              </MailClipReveal>
              <p className={L.sectionLead}>
                A cloud email stack for businesses that already own a domain:
                delivery, DNS you publish, and a console for people and routing.
              </p>
            </MailReveal>

            <MailStagger
              as="ul"
              className={`mt-10 ${L.gridFrame} sm:grid-cols-2`}
              stagger={0.09}
            >
              {BENEFITS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <MailRevealItem key={item.title} as="li" className="contents">
                    <MailSpotlight
                      className={`flex h-full gap-4 ${L.cellPaper} transition-colors duration-300 hover:bg-[#eef5f4]`}
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center border border-[#d7ebea] bg-[#eef5f4] text-[#062c30] sm:size-11">
                        <Icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="mb-1 font-mono text-[10px] tracking-wide text-[#1aabb2]">
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        <h3 className="text-[15px] font-semibold text-[#041f22] sm:text-base">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 text-[13px] leading-[1.75] text-[#4a5c5a] sm:text-[14px]">
                          {item.body}
                        </p>
                      </div>
                    </MailSpotlight>
                  </MailRevealItem>
                );
              })}
            </MailStagger>
          </div>
        </section>

        <MailDnsArchitectureSection />

        <MailProductivitySection />

        <MailSecurityBand />

        <section id="connect" className={L.sectionMist}>
          <div className={L.container}>
            <MailReveal>
              <p className={L.eyebrow}>Connect</p>
              <MailSplitWords
                as="h2"
                mode="scroll"
                text="Link your domain, then send as yourself"
                className={L.sectionTitle}
                delay={0.05}
              />
              <p className={L.sectionLead}>
                Connect a domain you own. DNS records appear in the console after
                you add the domain.
              </p>
            </MailReveal>
            <MailStagger
              as="ol"
              className={`mt-10 ${L.gridFrame} sm:grid-cols-2 lg:grid-cols-4`}
              stagger={0.07}
            >
              {CONNECT_STEPS.map((item, index) => (
                <MailRevealItem
                  key={item.step}
                  as="li"
                  className={`relative ${L.cellPaper}`}
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-[2px] origin-left bg-[#02797E]"
                    style={{
                      transform: `scaleX(${(index + 1) / CONNECT_STEPS.length})`,
                    }}
                  />
                  <p className="font-mono text-[10px] tracking-wide text-[#1aabb2]">
                    {item.step}
                  </p>
                  <h3 className="mt-2 text-[15px] font-semibold text-[#041f22]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-[1.75] text-[#4a5c5a]">
                    {item.body}
                  </p>
                </MailRevealItem>
              ))}
            </MailStagger>
          </div>
        </section>

        <section id="use-cases" className={L.section}>
          <div className={L.container}>
            <MailReveal>
              <p className={L.eyebrow}>Use cases</p>
              <h2 className={L.sectionTitle}>Built for the mail you already send</h2>
            </MailReveal>
            <MailStagger
              className={`mt-10 ${L.gridFrame} md:grid-cols-3`}
              stagger={0.08}
            >
              {USE_CASES.map((item) => {
                const Icon = item.icon;
                return (
                  <MailRevealItem key={item.title} as="article" className="contents">
                    <MailSpotlight
                      className={`${L.cellPaper} transition-colors duration-300 hover:bg-[#eef5f4]`}
                    >
                      <span className="flex size-10 items-center justify-center border border-[#d7ebea] bg-[#eef5f4] text-[#062c30]">
                        <Icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
                      </span>
                      <h3 className="mt-4 text-[15px] font-semibold text-[#041f22] sm:text-base">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-[13px] leading-[1.75] text-[#4a5c5a] sm:text-[14px]">
                        {item.body}
                      </p>
                    </MailSpotlight>
                  </MailRevealItem>
                );
              })}
            </MailStagger>
          </div>
        </section>

        <MailResourcesSection />

        <section id="pricing" className={L.section}>
          <div className={L.container}>
            <MailReveal>
              <p className={L.eyebrow}>Pricing</p>
              <h2 className={L.sectionTitle}>
                Plans per workspace, billed monthly in IQD
              </h2>
              <p className={L.sectionLead}>
                Each workspace has its own subscription. Starter starts after DNS is verified;
                Standard and Premium are requested in the console.
              </p>
            </MailReveal>
            <MailStagger
              className={`mt-10 ${L.gridFrame} md:grid-cols-3`}
              stagger={0.08}
            >
              {plans.map((plan) => (
                <MailRevealItem key={plan.id} as="article" className="contents">
                  <MailSpotlight
                    className={`flex h-full flex-col ${L.cellPaper} transition-shadow duration-300 hover:shadow-[0_20px_50px_-36px_rgba(4,31,34,0.45)]`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[15px] font-semibold text-[#041f22] sm:text-base">
                        {plan.name}
                      </h3>
                      {plan.popular ? (
                        <span className="border border-[#d7ebea] bg-[#eef5f4] px-2.5 py-0.5 text-[11px] font-semibold text-[#02797E]">
                          Popular
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-[#4a5c5a]">{plan.bestFor}</p>
                    <p className="mt-4 text-2xl font-bold tracking-tight text-[#041f22]">
                      {formatMailIqD(plan.priceMonthly)}
                      <span className="text-sm font-medium text-[#a8a29e]">/mo</span>
                    </p>
                    <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm text-[#4a5c5a]">
                      {mailPlanHighlights(plan).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </MailSpotlight>
                </MailRevealItem>
              ))}
            </MailStagger>
            <MailReveal delay={0.1}>
              <Link
                href="/pricing"
                className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[#062c30] transition-colors hover:text-[#041f22]"
              >
                Full pricing and plan requests
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </MailReveal>
          </div>
        </section>

        <section className="border-t border-[#062c30]">
          <div className="mail-mkt-band-ink px-4 py-16 sm:px-8 sm:py-20 md:py-24">
            <div className={L.container}>
              <MailReveal>
                <div className="mx-auto max-w-2xl text-center">
                  <p className={L.eyebrowOnInk}>Get started</p>
                  <MailSplitWords
                    as="h2"
                    mode="scroll"
                    text="Ready to send as yourself?"
                    className="mt-2 text-[1.5rem] font-bold leading-[1.2] tracking-[-0.03em] text-white sm:text-[2rem]"
                  />
                  <p className="mx-auto mt-4 max-w-xl text-[15px] leading-[1.7] text-[#a8c5c3] sm:text-base">
                    Sign in, connect your domain, and open webmail when DNS is ready.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                    <MailMagnetic>
                      <MailFrameLink href={primaryHref}>{primaryLabel}</MailFrameLink>
                    </MailMagnetic>
                    <MailMagnetic strength={10}>
                      <Link
                        href="/getting-started"
                        className="mail-frame-cta mail-frame-cta--ghost group relative inline-flex items-center justify-center gap-2 border border-white/25 bg-transparent px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:border-white/50 hover:bg-white/5"
                      >
                        Getting started
                      </Link>
                    </MailMagnetic>
                  </div>
                </div>
              </MailReveal>
            </div>
          </div>
        </section>
      </main>
    </MailMarketingShell>
  );
}
