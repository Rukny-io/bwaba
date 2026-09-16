"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { MailFrameLink } from "@/components/marketing/mail-frame-cta";
import {
  MailDnsArchitectureSection,
  MailSecurityBand,
  MailResourcesSection,
} from "@/components/marketing/mail-home-bands";
import { MailEmailsSentSection } from "@/components/marketing/mail-emails-sent-section";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import { MailMagnetic } from "@/components/marketing/mail-motion-kit";
import {
  MailHeroMotion,
  MailReveal,
  MailRevealItem,
  MailStagger,
} from "@/components/marketing/mail-reveal";
import { MailHeroSignal } from "@/components/marketing/mail-hero-signal";
import { MailHeroPanorama } from "@/components/marketing/mail-hero-panorama";
import { MailProductivitySection } from "@/components/marketing/mail-productivity-section";
import { formatMailIqD, listMailPlans } from "@/lib/mail-plans";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

const STEPS = [
  {
    n: "01",
    title: "Workspace + domain",
    body: "Sign in, create a workspace, connect a domain you own.",
  },
  {
    n: "02",
    title: "Publish DNS",
    body: "SPF, DKIM, DMARC, and MAIL FROM from the console.",
  },
  {
    n: "03",
    title: "Send as yourself",
    body: "Mailboxes, team SSO, aliases, and forwarders — one place.",
  },
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

export function MailHomePage({
  signedIn,
  emailsSent = 0,
}: {
  signedIn: boolean;
  emailsSent?: number;
}) {
  const primaryHref = signedIn ? "/apps" : "/login";
  const primaryLabel = signedIn ? "Open console" : "Get started";
  const popular = listMailPlans().find((p) => p.popular) ?? listMailPlans()[1];
  const reduceMotion = useReducedMotion();

  return (
    <MailMarketingShell signedIn={signedIn}>
      <main className="overflow-x-clip">
        {/* Hero — one composition: brand, line, CTA, dominant visual */}
        <section
          className="relative isolate min-h-[100svh] overflow-hidden bg-[#0a0a0a] text-white"
          aria-labelledby="mail-hero-brand"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_72%_42%,rgba(180,210,255,0.11),transparent_58%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_12%_78%,rgba(255,255,255,0.05),transparent_55%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent"
          />

          <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-5xl flex-col justify-center px-5 pb-16 pt-[72px] sm:px-6 md:max-w-7xl md:pb-20 md:pt-14">
            <div className="grid items-center gap-10 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-6 lg:gap-10">
              <div className="relative z-10 w-full max-w-xl lg:pl-6">
                <MailHeroMotion>
                  <h1
                    id="mail-hero-brand"
                    className="text-[2.75rem] font-bold leading-[0.92] tracking-[-0.05em] text-white sm:text-5xl md:text-[3.75rem] lg:text-[4.35rem]"
                  >
                    Rukny Mail
                  </h1>
                </MailHeroMotion>

                <MailHeroMotion delay={0.1}>
                  <p className="mt-4 max-w-md text-balance text-[1.1rem] font-medium leading-snug tracking-[-0.025em] text-white/90 sm:mt-5 sm:text-[1.4rem]">
                    Business email on your domain
                  </p>
                </MailHeroMotion>

                <MailHeroMotion delay={0.18}>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#a3a3a3] sm:text-base">
                    Mailboxes, DNS auth, and webmail — you keep{" "}
                    <span className="font-medium text-white">
                      you@yourdomain
                    </span>
                    .
                  </p>
                </MailHeroMotion>

                <MailHeroMotion delay={0.26}>
                  <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-9">
                    <MailMagnetic strength={10}>
                      <Link
                        href={primaryHref}
                        className="inline-flex h-11 min-w-[9rem] items-center justify-center bg-white px-5 text-[14px] font-semibold text-[#0a0a0a] transition-colors hover:bg-[#e8e8e8]"
                      >
                        {primaryLabel}
                      </Link>
                    </MailMagnetic>
                    <Link
                      href="/documents"
                      className="inline-flex h-11 items-center gap-1.5 px-2 text-[14px] font-medium text-[#a3a3a3] transition-colors hover:text-white sm:px-3"
                    >
                      Documents
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                </MailHeroMotion>
              </div>

              <div className="relative mx-auto w-full max-w-[28rem] md:max-w-none">
                <MailHeroMotion delay={0.14} className="relative">
                  <MailHeroSignal />

                  {/* Product accent — one float, not a sticker cluster */}
                  <motion.div
                    className="pointer-events-none absolute -bottom-1 -right-1 z-20 w-[5.75rem] sm:bottom-1 sm:right-2 sm:w-[7rem] md:-bottom-3 md:right-4 md:w-[8rem]"
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 16, rotate: -6 }
                    }
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            opacity: 1,
                            y: [0, -7, 0],
                            rotate: [-3.5, -1.5, -3.5],
                          }
                    }
                    transition={
                      reduceMotion
                        ? undefined
                        : {
                            opacity: { duration: 0.75, delay: 0.35, ease: EASE },
                            y: {
                              duration: 5.2,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: 0.5,
                            },
                            rotate: {
                              duration: 5.2,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: 0.5,
                            },
                          }
                    }
                  >
                    <Image
                      src="/illustrations/hero-envelope-3d.png"
                      alt=""
                      width={200}
                      height={200}
                      className="h-auto w-full drop-shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
                      priority
                    />
                  </motion.div>
                </MailHeroMotion>
              </div>
            </div>
          </div>
        </section>

        <MailHeroPanorama />

        {emailsSent > 0 ? (
          <section
            className="border-t border-[#e8e8e8] bg-white"
            aria-labelledby="emails-sent-heading"
          >
            <div className={L.container}>
              <div className="flex flex-col items-center py-10 sm:py-12">
                <MailReveal>
                  <p
                    id="emails-sent-heading"
                    className="text-center text-[11px] font-semibold tracking-[0.18em] text-[#888888] uppercase"
                  >
                    Emails delivered
                  </p>
                </MailReveal>
                <MailEmailsSentSection emailsSent={emailsSent} />
              </div>
            </div>
          </section>
        ) : null}

        {/* How it works */}
        <section
          id="connect"
          className="scroll-mt-24 border-t border-[#e8e8e8] bg-[#fafafa]"
          aria-labelledby="connect-heading"
        >
          <div className={L.container}>
            <div className="py-14 md:py-20">
              <MailReveal>
                <h2
                  id="connect-heading"
                  className="text-[1.5rem] font-bold tracking-[-0.035em] text-[#111111] sm:text-[1.85rem]"
                >
                  Three steps to send as yourself
                </h2>
              </MailReveal>
              <MailStagger
                as="ol"
                className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8"
                stagger={0.08}
              >
                {STEPS.map((step) => (
                  <MailRevealItem key={step.n} as="li" className="relative">
                    <p className="font-mono text-[11px] tracking-[0.18em] text-[#888888]">
                      {step.n}
                    </p>
                    <h3 className="mt-3 text-[16px] font-semibold tracking-[-0.02em] text-[#111111]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#666666]">
                      {step.body}
                    </p>
                  </MailRevealItem>
                ))}
              </MailStagger>
            </div>
          </div>
        </section>

        <MailProductivitySection />

        {/* Trust — prose band, no feature cards */}
        <section
          id="features"
          className="scroll-mt-24 border-t border-[#e8e8e8] bg-[#111111]"
          aria-labelledby="trust-heading"
        >
          <div className={L.container}>
            <div className="grid gap-8 py-14 md:grid-cols-[1.15fr_0.85fr] md:items-end md:gap-20 md:py-20">
              <MailReveal>
                <h2
                  id="trust-heading"
                  className="text-[1.5rem] font-bold leading-snug tracking-[-0.035em] text-white sm:text-[1.85rem]"
                >
                  Authenticated outbound. Team console. One workspace per
                  domain.
                </h2>
              </MailReveal>
              <MailReveal delay={0.08}>
                <p className="text-[15px] leading-relaxed text-[#a3a3a3]">
                  Delivery through Amazon SES. SPF, Easy DKIM, and DMARC from
                  day one. Invite teammates, assign mailboxes, open webmail
                  with Rukny SSO — seats stay on that workspace.
                </p>
              </MailReveal>
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section
          id="pricing"
          className="scroll-mt-24 border-t border-[#e8e8e8] bg-white"
          aria-labelledby="pricing-heading"
        >
          <div className={L.container}>
            <div className="flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between md:py-16">
              <MailReveal>
                <h2
                  id="pricing-heading"
                  className="text-[1.35rem] font-bold tracking-[-0.03em] text-[#111111] sm:text-[1.6rem]"
                >
                  From {formatMailIqD(popular.priceMonthly)}
                  <span className="font-medium text-[#888888]">/mo</span>
                </h2>
                <p className="mt-2 text-[14px] text-[#666666]">
                  {popular.name} for small teams — billed per workspace in IQD.
                </p>
              </MailReveal>
              <MailReveal delay={0.06}>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#111111] transition-colors hover:opacity-70"
                >
                  Compare plans
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </MailReveal>
            </div>
          </div>
        </section>

        <MailDnsArchitectureSection />
        <MailSecurityBand />
        <MailResourcesSection />

        {/* Close */}
        <section className="border-t border-[#e8e8e8] bg-[#f5f5f5]">
          <div className={L.container}>
            <div className="flex flex-col items-start gap-6 py-14 md:flex-row md:items-center md:justify-between md:py-16">
              <MailReveal>
                <p className="text-[1.35rem] font-bold tracking-[-0.03em] text-[#111111] sm:text-[1.6rem]">
                  Ready to send as yourself?
                </p>
              </MailReveal>
              <MailReveal delay={0.06}>
                <MailMagnetic>
                  <MailFrameLink href={primaryHref}>{primaryLabel}</MailFrameLink>
                </MailMagnetic>
              </MailReveal>
            </div>
          </div>
        </section>
      </main>
    </MailMarketingShell>
  );
}
