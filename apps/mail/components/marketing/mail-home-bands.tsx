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
    title: "Your domain",
    body: "you@yourbrand.com — never a shared @rukny.io address.",
  },
  {
    n: "02",
    title: "Auth records",
    body: "SPF, Easy DKIM, DMARC, and custom MAIL FROM from the console.",
  },
  {
    n: "03",
    title: "Routing",
    body: "Mailboxes, aliases, forwarders, and catch-all in one place.",
  },
] as const;

const SECURITY = [
  {
    title: "Mailbox passwords",
    body: "Each mailbox has its own credential — revoke without touching the workspace.",
  },
  {
    title: "Optional TOTP",
    body: "Enroll 2FA with a QR code before you require it for a mailbox.",
  },
  {
    title: "Aligned sending",
    body: "Domain authentication keeps From aligned so messages look like you.",
  },
] as const;

const RESOURCES = [
  {
    href: "/getting-started",
    title: "Getting started",
    body: "Connect DNS and send as yourself.",
  },
  {
    href: "/documents",
    title: "Documents",
    body: "Guides for DNS, mailboxes, and routing.",
  },
  {
    href: "/faqs",
    title: "FAQs",
    body: "Short answers, no manual.",
  },
  {
    href: "/pricing/estimate",
    title: "Cost calculator",
    body: "Estimate seats and outbound volume.",
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
            <p className={L.eyebrow}>Architecture</p>
            <MailClipReveal>
              <h2 id="architecture-heading" className={L.sectionTitle}>
                Domain first. Auth built in. Routing next.
              </h2>
            </MailClipReveal>
            <p className={L.sectionLead}>
              Rukny Mail is layered around a domain you already own — not a free
              inbox you outgrow.
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
            text="Credentials and auth that match business mail"
            className={L.sectionTitleOnInk}
          />
          <p className={L.sectionLeadOnInk}>
            Keep control at the mailbox and at the domain — without bolting on
            another vendor for every layer.
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
              Learn the path, then open the console
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
