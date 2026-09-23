"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Play } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@heroui/react";
import {
  MailCountUp,
} from "@/components/marketing/mail-motion-kit";
import {
  MailHeroMotion,
  MailReveal,
  MailRevealItem,
  MailStagger,
} from "@/components/marketing/mail-reveal";
import {
  formatMailIqD,
  listMailPlans,
  mailPlanHighlights,
  type MailPlanDefinition,
} from "@/lib/mail-plans";
import { optLayout } from "@/lib/mail-optimus-theme";

const STAT_TICKER = [
  { value: "5K+", label: "emails included", brand: "Starter" },
  { value: "99.9%", label: "delivery rate", brand: "SES" },
  { value: "3 min", label: "to first inbox", brand: "Setup" },
  { value: "24/7", label: "webmail access", brand: "Any device" },
] as const;

const CAPABILITIES = [
  {
    n: "01",
    title: "Your domain, your address",
    body: "Send as you@yourdomain.com — never a shared inbox that looks temporary.",
  },
  {
    n: "02",
    title: "Agentic Mail drafts",
    body: "Smart suggestions when you're stuck on a reply. Included on every plan.",
  },
  {
    n: "03",
    title: "Team-ready workspace",
    body: "Mailboxes, aliases, and forwards in one console — no extra tools.",
  },
  {
    n: "04",
    title: "Trusted delivery",
    body: "SPF, DKIM, and guided DNS setup so messages reach the inbox.",
  },
] as const;

const STEPS = [
  {
    n: "I",
    title: "Connect your domain",
    body: "Create a workspace and add the domain you already own.",
  },
  {
    n: "II",
    title: "Follow the checklist",
    body: "Copy DNS records we generate — SPF, DKIM, and verification.",
  },
  {
    n: "III",
    title: "Invite your team",
    body: "Hand out inboxes and start sending as your brand.",
  },
] as const;

const REGIONS = [
  { city: "Baghdad", region: "Middle East", ms: "18ms" },
  { city: "Riyadh", region: "Gulf", ms: "22ms" },
  { city: "Dubai", region: "Gulf", ms: "24ms" },
  { city: "London", region: "Europe", ms: "31ms" },
  { city: "New York", region: "US East", ms: "28ms" },
  { city: "Singapore", region: "Asia Pacific", ms: "35ms" },
] as const;

const INTEGRATIONS = [
  "Amazon SES",
  "AWS",
  "Google Workspace",
  "Microsoft 365",
  "Notion",
  "Slack",
  "Stripe",
  "GitHub",
] as const;

const SECURITY = [
  { title: "SPF & DKIM", body: "Authenticated sending on every message." },
  { title: "Anti-spam", body: "Built-in filtering before mail hits the inbox." },
  { title: "2FA per mailbox", body: "Optional two-step verification per user." },
  { title: "Private workspace", body: "Your data stays under your domain." },
] as const;

const DEV_FEATURES = [
  { title: "REST Email API", body: "Send transactional mail from your apps." },
  { title: "Zero guesswork DNS", body: "Copy-paste records from the console." },
  { title: "Webhooks & logs", body: "Track delivery events in one place." },
  { title: "Typed SDK docs", body: "Clear examples in the developer portal." },
] as const;

const CODE_LINES = [
  "import { RuknyMail } from '@rukny/mail'",
  "",
  "await RuknyMail.connect({",
  "  domain: 'yourbrand.com',",
  "  sync: true,",
  "})",
] as const;

function Ticker() {
  const reduceMotion = useReducedMotion();
  const items = [...STAT_TICKER, ...STAT_TICKER];

  if (reduceMotion) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-8">
        {STAT_TICKER.map((item) => (
          <TickerItem key={item.brand} {...item} />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden border-y border-[#E5E5E5] bg-white py-8">
      <motion.div
        className="flex w-max gap-12"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {items.map((item, i) => (
          <TickerItem key={`${item.brand}-${i}`} {...item} />
        ))}
      </motion.div>
    </div>
  );
}

function TickerItem({
  value,
  label,
  brand,
}: {
  value: string;
  label: string;
  brand: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-4 px-2">
      <div>
        <p className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[#0A0A0A]">
          {value}
        </p>
        <p className="text-[13px] text-[#737373]">{label}</p>
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A3A3A3]">
        {brand}
      </span>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  lead,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  center?: boolean;
}) {
  return (
    <MailReveal className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? <p className={optLayout.eyebrow}>{eyebrow}</p> : null}
      <h2 className={cn(optLayout.title, eyebrow && "mt-3")}>{title}</h2>
      {lead ? <p className={cn(optLayout.lead, "mt-4")}>{lead}</p> : null}
    </MailReveal>
  );
}

function PricingCard({
  plan,
  index,
  href,
}: {
  plan: MailPlanDefinition;
  index: number;
  href: string;
}) {
  const highlights = mailPlanHighlights(plan).slice(0, 5);

  return (
    <MailRevealItem
      className={cn(
        optLayout.card,
        "flex h-full flex-col",
        plan.popular && "border-[#0A0A0A] shadow-[0_0_0_1px_#0A0A0A]",
      )}
    >
      <p className="font-mono text-[12px] text-[#A3A3A3]">
        {String(index + 1).padStart(2, "0")}
      </p>
      {plan.popular ? (
        <p className="mt-3 inline-flex w-fit rounded-full bg-[#0A0A0A] px-2.5 py-0.5 text-[11px] font-medium text-white">
          Most popular
        </p>
      ) : (
        <span className="mt-3 block h-5" aria-hidden />
      )}
      <h3 className="mt-4 text-[1.25rem] font-semibold tracking-[-0.02em]">
        {plan.name}
      </h3>
      <p className="mt-1 text-[14px] text-[#737373]">{plan.bestFor}</p>
      <p className="mt-6 text-[2rem] font-semibold tracking-[-0.04em]">
        {formatMailIqD(plan.priceMonthly)}
        <span className="text-[14px] font-medium text-[#737373]">/mo</span>
      </p>
      <ul className="mt-6 flex flex-1 flex-col gap-2.5">
        {highlights.map((item) => (
          <li key={item} className="flex gap-2.5 text-[14px] text-[#525252]">
            <Check className="mt-0.5 size-4 shrink-0 text-[#0A0A0A]" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
      <Link href={href} className={`${optLayout.btnPrimary} mt-8 w-full`}>
        Get started
      </Link>
    </MailRevealItem>
  );
}

export function MailOptimusHome({
  signedIn,
  emailsSent = 0,
}: {
  signedIn: boolean;
  emailsSent?: number;
}) {
  const primaryHref = signedIn ? "/apps" : "/login";
  const primaryLabel = signedIn ? "Open console" : "Start creating";
  const plans = listMailPlans();
  const [codeVisible, setCodeVisible] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setCodeVisible(CODE_LINES.length);
      return;
    }
    setCodeVisible(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCodeVisible(i);
      if (i >= CODE_LINES.length) window.clearInterval(id);
    }, 400);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <main className="overflow-x-clip bg-[#FAFAFA] text-[#0A0A0A]">
      {/* Hero */}
      <section className="relative overflow-hidden pt-28 sm:pt-32 md:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(0,0,0,0.06),transparent_70%)]"
        />
        <div className={`${optLayout.container} relative pb-16 text-center sm:pb-20`}>
          <MailHeroMotion>
            <p className="mx-auto inline-flex rounded-full border border-[#E5E5E5] bg-white px-4 py-1.5 text-[12px] font-medium text-[#737373]">
              The platform for modern teams
            </p>
          </MailHeroMotion>

          <MailHeroMotion delay={0.08}>
            <h1 className={`${optLayout.titleLg} mx-auto mt-8 max-w-[12ch] sm:max-w-none`}>
              <span className="block">The platform</span>
              <span className="block">to send</span>
            </h1>
          </MailHeroMotion>

          <MailHeroMotion delay={0.16}>
            <p className={`${optLayout.lead} mx-auto mt-6 max-w-[38rem]`}>
              Your toolkit to stop using shared inboxes and start sending as
              your brand. Securely set up, deliver, and scale mail on your domain.
            </p>
          </MailHeroMotion>

          <MailHeroMotion delay={0.22}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href={primaryHref} className={optLayout.btnPrimary}>
                {signedIn ? "Open console" : "Start free trial"}
              </Link>
              <Link href="/getting-started" className={optLayout.btnSecondary}>
                <Play className="me-1.5 size-3.5 fill-current" aria-hidden />
                Watch demo
              </Link>
            </div>
          </MailHeroMotion>
        </div>
      </section>

      <Ticker />

      {/* Capabilities */}
      <section id="features" className={`${optLayout.container} ${optLayout.section} scroll-mt-24`}>
        <SectionHeading
          eyebrow="Capabilities"
          title="Everything you need. Nothing you don't."
          center
        />
        <MailStagger className="mt-14 grid gap-4 sm:grid-cols-2" stagger={0.07}>
          {CAPABILITIES.map((item) => (
            <MailRevealItem key={item.n} className={optLayout.card}>
              <p className="font-mono text-[12px] text-[#A3A3A3]">{item.n}</p>
              <h3 className="mt-4 text-[1.1rem] font-semibold tracking-[-0.02em]">
                {item.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#737373]">
                {item.body}
              </p>
            </MailRevealItem>
          ))}
        </MailStagger>
      </section>

      {/* Process */}
      <section id="process" className="border-y border-[#E5E5E5] bg-white scroll-mt-24">
        <div className={`${optLayout.container} ${optLayout.section}`}>
          <SectionHeading
            eyebrow="Process"
            title="Three steps. Infinite possibilities."
            center
          />
          <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <MailStagger as="ol" className="space-y-8" stagger={0.08}>
              {STEPS.map((step) => (
                <MailRevealItem key={step.n} as="li" className="flex gap-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#E5E5E5] font-mono text-[13px] text-[#737373]">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="text-[1.05rem] font-semibold">{step.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-[#737373]">
                      {step.body}
                    </p>
                  </div>
                </MailRevealItem>
              ))}
            </MailStagger>

            <MailReveal delay={0.1}>
              <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA]">
                <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-3">
                  <span className="text-[12px] font-medium text-[#737373]">
                    setup.ts
                  </span>
                  <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-medium text-[#166534]">
                    Ready
                  </span>
                </div>
                <pre className="overflow-x-auto p-5 font-mono text-[12px] leading-[1.8] text-[#525252] sm:text-[13px]">
                  {CODE_LINES.slice(0, codeVisible).map((line, i) => (
                    <div key={`${line}-${i}`}>
                      {line || "\u00A0"}
                    </div>
                  ))}
                </pre>
              </div>
            </MailReveal>
          </div>
        </div>
      </section>

      {/* Infrastructure — cities only, no globe */}
      <section className={`${optLayout.container} ${optLayout.section}`}>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Infrastructure"
              title="Global by default."
              lead="Send once, deliver everywhere. Reliable routing across regions with low latency to your team and clients."
            />
            <div className="mt-10 grid grid-cols-3 gap-6">
              {[
                { v: "6", l: "Regions" },
                { v: "99.9%", l: "Uptime" },
                { v: "<50ms", l: "Avg latency" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="text-[1.75rem] font-semibold tracking-[-0.03em]">
                    {s.v}
                  </p>
                  <p className="mt-1 text-[13px] text-[#737373]">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <MailStagger className="grid gap-3 sm:grid-cols-2" stagger={0.06}>
            {REGIONS.map((r) => (
              <MailRevealItem
                key={r.city}
                className="flex items-center justify-between rounded-xl border border-[#E5E5E5] bg-white px-4 py-3.5"
              >
                <div>
                  <p className="text-[14px] font-medium">{r.city}</p>
                  <p className="text-[12px] text-[#737373]">{r.region}</p>
                </div>
                <span className="font-mono text-[13px] text-[#737373]">{r.ms}</span>
              </MailRevealItem>
            ))}
          </MailStagger>
        </div>
      </section>

      {/* Live metrics */}
      <section className="border-y border-[#E5E5E5] bg-white">
        <div className={`${optLayout.container} ${optLayout.section}`}>
          <SectionHeading
            eyebrow="Live metrics"
            title="Performance you can measure."
            center
          />
          <MailStagger
            className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4"
            stagger={0.08}
          >
            {[
              {
                value: emailsSent > 0 ? emailsSent : 5000,
                suffix: emailsSent > 0 ? "" : "+",
                label: emailsSent > 0 ? "Emails delivered" : "Emails / mo included",
              },
              { value: 99.9, suffix: "%", label: "Delivery success" },
              { value: 50, suffix: "ms", label: "Average routing" },
              { value: 6, suffix: "", label: "Regions covered" },
            ].map((m) => (
              <MailRevealItem key={m.label} className="text-center">
                <p className="text-[2rem] font-semibold tabular-nums tracking-[-0.04em] sm:text-[2.25rem]">
                  <MailCountUp value={m.value} suffix={m.suffix} />
                </p>
                <p className="mt-2 text-[14px] text-[#737373]">{m.label}</p>
              </MailRevealItem>
            ))}
          </MailStagger>
        </div>
      </section>

      {/* Integrations */}
      <section className={`${optLayout.container} ${optLayout.section}`}>
        <SectionHeading
          eyebrow="Integrations"
          title="Works with everything you already use."
          lead="Connect your stack in minutes — cloud providers, productivity tools, and developer services."
          center
        />
        <MailStagger
          className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4"
          stagger={0.05}
        >
          {INTEGRATIONS.map((name) => (
            <MailRevealItem
              key={name}
              className="rounded-xl border border-[#E5E5E5] bg-white px-4 py-5 text-center"
            >
              <p className="text-[14px] font-medium">{name}</p>
            </MailRevealItem>
          ))}
        </MailStagger>
      </section>

      {/* Security */}
      <section id="security" className="border-y border-[#E5E5E5] bg-white scroll-mt-24">
        <div className={`${optLayout.container} ${optLayout.section}`}>
          <SectionHeading
            eyebrow="Security"
            title="Trust is non-negotiable."
            lead="Enterprise-grade protection built into every layer — from DNS to inbox."
            center
          />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {["SPF", "DKIM", "2FA", "Anti-spam", "TLS"].map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[#E5E5E5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#737373]"
              >
                {badge}
              </span>
            ))}
          </div>
          <MailStagger className="mt-12 grid gap-4 sm:grid-cols-2" stagger={0.07}>
            {SECURITY.map((item) => (
              <MailRevealItem key={item.title} className={optLayout.card}>
                <h3 className="text-[1rem] font-semibold">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#737373]">
                  {item.body}
                </p>
              </MailRevealItem>
            ))}
          </MailStagger>
        </div>
      </section>

      {/* Developers */}
      <section id="developers" className={`${optLayout.container} ${optLayout.section} scroll-mt-24`}>
        <SectionHeading
          eyebrow="For developers"
          title="Built by devs. For devs."
          lead="Email API, webhooks, and clear docs — ship faster with tools that get out of your way."
        />
        <MailStagger className="mt-12 grid gap-4 sm:grid-cols-2" stagger={0.07}>
          {DEV_FEATURES.map((item) => (
            <MailRevealItem key={item.title} className={optLayout.card}>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#737373]">
                {item.body}
              </p>
            </MailRevealItem>
          ))}
        </MailStagger>
        <MailReveal delay={0.08} className="mt-8">
          <Link
            href="/developers"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0A0A0A] hover:opacity-70"
          >
            Read the docs
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </MailReveal>
      </section>

      {/* Testimonial */}
      <section className="border-y border-[#E5E5E5] bg-white">
        <div className={`${optLayout.container} py-16 md:py-20`}>
          <MailReveal className="mx-auto max-w-3xl text-center">
            <p className={optLayout.eyebrow}>What people say · 01 / 04</p>
            <blockquote className="mt-6 text-[1.35rem] font-medium leading-snug tracking-[-0.02em] sm:text-[1.65rem]">
              &ldquo;Rukny Mail replaced our shared inboxes in a day. Setup was
              clear, and every message now leaves as our brand.&rdquo;
            </blockquote>
            <figcaption className="mt-8">
              <p className="font-semibold">Sara Al-Mahdi</p>
              <p className="mt-1 text-[14px] text-[#737373]">
                Operations lead, growing team
              </p>
              <p className="mt-4 text-[13px] font-medium text-[#0A0A0A]">
                Key result: professional mail in 3 minutes
              </p>
            </figcaption>
          </MailReveal>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={`${optLayout.container} ${optLayout.section} scroll-mt-24`}>
        <SectionHeading
          eyebrow="Pricing"
          title="Simple, transparent pricing"
          lead="Start free and scale as you grow. Monthly billing in IQD — no hidden fees."
          center
        />
        <MailStagger className="mt-14 grid gap-4 lg:grid-cols-3" stagger={0.08}>
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              index={index}
              href={signedIn ? "/billing" : "/login?next=/billing"}
            />
          ))}
        </MailStagger>
        <MailReveal delay={0.08} className="mt-8 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0A0A0A] hover:opacity-70"
          >
            Compare all features
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </MailReveal>
      </section>

      {/* Final CTA */}
      <section className={`${optLayout.container} pb-20 pt-4 sm:pb-24`}>
        <MailReveal>
          <div className="rounded-3xl bg-[#0A0A0A] px-6 py-14 text-center text-white sm:px-10 sm:py-16">
            <h2 className="text-balance text-[2rem] font-semibold tracking-[-0.04em] sm:text-[2.5rem]">
              Ready to build something great?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-white/65">
              Join teams sending faster on their own domain. Start free — no
              credit card required.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={primaryHref}
                className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-[14px] font-medium text-[#0A0A0A] transition-colors hover:bg-[#F5F5F5]"
              >
                {primaryLabel}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-6 text-[14px] font-medium text-white transition-colors hover:bg-white/10"
              >
                Talk to sales
              </Link>
            </div>
            <p className="mt-5 text-[12px] text-white/45">No credit card required</p>
          </div>
        </MailReveal>
      </section>
    </main>
  );
}
