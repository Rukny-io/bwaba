"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Fingerprint,
  Globe2,
  Lock,
  Route,
  ShieldCheck,
} from "lucide-react";
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
    icon: Globe2,
    title: "Your domain",
    body: "you@yourbrand.com — never a shared @rukny.io address.",
  },
  {
    icon: ShieldCheck,
    title: "Auth records",
    body: "SPF, Easy DKIM, DMARC, and custom MAIL FROM from the console.",
  },
  {
    icon: Route,
    title: "Routing",
    body: "Mailboxes, aliases, forwarders, and catch-all in one place.",
  },
] as const;

const SECURITY = [
  {
    icon: Lock,
    title: "Mailbox passwords",
    body: "Each mailbox has its own credential — revoke without touching the workspace.",
  },
  {
    icon: Fingerprint,
    title: "Optional TOTP",
    body: "Enroll 2FA with a QR code before you require it for a mailbox.",
  },
  {
    icon: ShieldCheck,
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
    href: "/tutorials",
    title: "Tutorials",
    body: "Step-by-step setup guides.",
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
    <section id="architecture" className={L.section} aria-labelledby="architecture-heading">
      <div className={L.container}>
        <div className="mail-mkt-dns-grid border border-[#d7ebea]">
          <div className="border-b border-[#d7ebea] bg-white/80 px-5 py-10 backdrop-blur-[2px] sm:px-8 sm:py-14">
            <MailReveal>
              <p className={L.eyebrow}>Architecture</p>
              <MailClipReveal>
                <h2 id="architecture-heading" className={L.sectionTitle}>
                  Domain first. Auth built in. Routing next.
                </h2>
              </MailClipReveal>
              <p className={L.sectionLead}>
                Rukny Mail is layered around a domain you already own — not a
                free inbox you outgrow.
              </p>
            </MailReveal>
          </div>
          <MailStagger className="grid md:grid-cols-3" stagger={0.1}>
            {DNS_LAYERS.map((layer, index) => {
              const Icon = layer.icon;
              return (
                <MailRevealItem
                  key={layer.title}
                  className="relative border-t border-[#d7ebea] bg-white/90 p-6 sm:p-8 md:border-t-0 md:border-s md:first:border-s-0"
                >
                  <span className="font-mono text-[11px] tracking-[0.2em] text-[#1aabb2]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-5 flex size-11 items-center justify-center border border-[#d7ebea] bg-[#eef5f4] text-[#062c30]">
                    <Icon className="size-5" strokeWidth={1.6} aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-[#041f22]">
                    {layer.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4a5c5a]">
                    {layer.body}
                  </p>
                </MailRevealItem>
              );
            })}
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
          className="mt-12 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3"
          stagger={0.09}
        >
          {SECURITY.map((item) => {
            const Icon = item.icon;
            return (
              <MailRevealItem
                key={item.title}
                className="bg-[#062c30]/55 p-6 backdrop-blur-sm sm:p-8"
              >
                <span className="flex size-10 items-center justify-center border border-white/15 bg-white/5 text-[#1aabb2]">
                  <Icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
                </span>
                <h3 className="mt-5 text-[15px] font-semibold text-white sm:text-base">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#a8c5c3]">
                  {item.body}
                </p>
              </MailRevealItem>
            );
          })}
        </MailStagger>
      </div>
    </section>
  );
}

export function MailResourcesSection() {
  return (
    <section id="resources" className={L.sectionMist} aria-labelledby="resources-heading">
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
              href="/tutorials"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#062c30] transition-colors hover:text-[#041f22]"
            >
              Browse tutorials
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </MailReveal>
        </div>

        <MailStagger
          className={`mt-10 ${L.gridFrame} sm:grid-cols-2 lg:grid-cols-4`}
          stagger={0.07}
        >
          {RESOURCES.map((item) => (
            <MailRevealItem key={item.href} className="contents">
              <MailMagnetic strength={8} className="block h-full">
                <Link
                  href={item.href}
                  className={`group flex h-full flex-col ${L.cellPaper} transition-colors duration-300 hover:bg-[#eef5f4]`}
                >
                  <BookOpen
                    className="size-4 text-[#02797E] transition-transform duration-300 group-hover:translate-x-0.5"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                  <h3 className="mt-4 text-[15px] font-semibold text-[#041f22]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[#4a5c5a]">
                    {item.body}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#02797E]">
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
