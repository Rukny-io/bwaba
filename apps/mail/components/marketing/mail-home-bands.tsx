"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  MailClipReveal,
  MailMagnetic,
  MailSplitWords,
} from "@/components/marketing/mail-motion-kit";
import {
  MailReveal,
  MailRevealItem,
  MailStagger,
} from "@/components/marketing/mail-reveal";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

const DNS_LAYERS = [
  {
    n: "01",
    title: "Your brand address",
    body: "you@yourbrand.com — never a shared free inbox that looks unprofessional.",
  },
  {
    n: "02",
    title: "Trusted delivery",
    body: "We walk you through setup so clients actually receive your mail.",
  },
  {
    n: "03",
    title: "Team inboxes",
    body: "Create addresses, nicknames, and forwards in one place — no extra tools.",
  },
] as const;

const SECURITY = [
  {
    title: "Separate passwords",
    body: "Every inbox has its own login. Lock one person out without affecting the rest.",
  },
  {
    title: "Extra protection",
    body: "Turn on two-step verification when you’re ready — optional, per mailbox.",
  },
  {
    title: "Looks like you",
    body: "Mail leaves as your company name and domain, so people trust the sender.",
  },
] as const;

const RESOURCES = [
  {
    href: "/getting-started",
    title: "Getting started",
    body: "Connect your domain and send your first message.",
  },
  {
    href: "/documents",
    title: "Documents",
    body: "Simple guides for setup, inboxes, and your team.",
  },
  {
    href: "/faqs",
    title: "FAQs",
    body: "Short answers to common questions.",
  },
  {
    href: "/pricing/estimate",
    title: "Cost calculator",
    body: "See what seats and sending volume might cost.",
  },
] as const;

export function MailDnsArchitectureSection() {
  return (
    <section
      id="architecture"
      className="scroll-mt-24 border-t border-[#e8e8e8] bg-white"
      aria-labelledby="architecture-heading"
    >
      <div className={L.container}>
        <div className="py-14 md:py-20">
          <MailReveal>
            <p className={L.eyebrow}>How it fits together</p>
            <MailClipReveal>
              <h2 id="architecture-heading" className={L.sectionTitle}>
                Your domain. Trusted sending. Room for the team.
              </h2>
            </MailClipReveal>
            <p className={L.sectionLead}>
              Built around the domain you already own — not a free inbox you’ll
              outgrow next year.
            </p>
          </MailReveal>

          <MailStagger
            as="ol"
            className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8"
            stagger={0.09}
          >
            {DNS_LAYERS.map((layer) => (
              <MailRevealItem key={layer.title} as="li">
                <p className="font-mono text-[11px] tracking-[0.18em] text-[#888888]">
                  {layer.n}
                </p>
                <h3 className="mt-3 text-[16px] font-semibold tracking-[-0.02em] text-[#111111]">
                  {layer.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#666666]">
                  {layer.body}
                </p>
              </MailRevealItem>
            ))}
          </MailStagger>
        </div>
      </div>
    </section>
  );
}

export function MailSecurityBand() {
  return (
    <section
      id="security"
      className={`${L.sectionInk} mail-mkt-band-ink`}
      aria-labelledby="security-heading"
    >
      <div className={L.container}>
        <MailReveal>
          <p className={L.eyebrowOnInk}>Security</p>
          <MailSplitWords
            as="h2"
            mode="scroll"
            text="Keep control of every inbox"
            className={L.sectionTitleOnInk}
          />
          <p className={L.sectionLeadOnInk}>
            Protect each mailbox on its own — without stacking another tool for
            every layer.
          </p>
        </MailReveal>

        <MailStagger
          as="ul"
          className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8"
          stagger={0.09}
        >
          {SECURITY.map((item) => (
            <MailRevealItem key={item.title} as="li">
              <h3 className="text-[15px] font-semibold text-white sm:text-base">
                {item.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#a3a3a3]">
                {item.body}
              </p>
            </MailRevealItem>
          ))}
        </MailStagger>
      </div>
    </section>
  );
}

export function MailResourcesSection() {
  return (
    <section
      id="resources"
      className={L.sectionMist}
      aria-labelledby="resources-heading"
    >
      <div className={L.container}>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <MailReveal>
            <p className={L.eyebrow}>Resources</p>
            <h2 id="resources-heading" className={L.sectionTitle}>
              Learn the basics, then open your workspace
            </h2>
          </MailReveal>
          <MailReveal delay={0.08}>
            <Link
              href="/documents"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111111] transition-opacity hover:opacity-70"
            >
              Browse documents
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </MailReveal>
        </div>

        <MailStagger
          className="mt-10 grid gap-px overflow-hidden border border-[#e8e8e8] bg-[#e8e8e8] sm:grid-cols-2 lg:grid-cols-4"
          stagger={0.07}
        >
          {RESOURCES.map((item) => (
            <MailRevealItem key={item.href} className="contents">
              <MailMagnetic strength={8} className="block h-full">
                <Link
                  href={item.href}
                  className="group flex h-full flex-col bg-white p-5 transition-colors duration-300 hover:bg-[#f5f5f5] sm:p-6"
                >
                  <h3 className="text-[15px] font-semibold text-[#111111]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[#666666]">
                    {item.body}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#666666]">
                    Open
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </MailMagnetic>
            </MailRevealItem>
          ))}
        </MailStagger>
      </div>
    </section>
  );
}
