"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import {
  MailReveal,
  MailRevealItem,
  MailStagger,
} from "@/components/marketing/mail-reveal";
import { agLayout } from "@/lib/mail-antigravity-theme";
import { resolveDeveloperUrl } from "@rukny/auth/client/env-urls";

const EASE = [0.22, 1, 0.36, 1] as const;

type Feature = {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string | (() => string);
  external?: boolean;
  preview: ReactNode;
};

function PreviewFrame({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="overflow-hidden rounded-xl border border-[#E8E8E8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.65, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function MailboxesPreview() {
  const reduceMotion = useReducedMotion();
  const rows = [
    { email: "team@example.com", tag: "Primary", active: true },
    { email: "hello@example.com", tag: "Alias", active: false },
    { email: "support@example.com", tag: "Forward", active: false },
  ] as const;

  return (
    <PreviewFrame>
      <div className="flex items-center justify-between border-b border-[#F0F0F0] px-4 py-3 sm:px-5">
        <p className="text-[12px] font-medium text-[#1D1D1D] sm:text-[13px]">
          example.com
        </p>
        <motion.span
          className="text-[11px] text-[#9CA3AF]"
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={reduceMotion ? undefined : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.2, ease: EASE }}
        >
          3 addresses
        </motion.span>
      </div>
      <MailStagger as="ul" className="divide-y divide-[#F0F0F0] p-2 sm:p-2.5" stagger={0.1}>
        {rows.map((row) => (
          <MailRevealItem
            key={row.email}
            as="li"
            y={12}
            className={
              row.active
                ? "flex items-center justify-between gap-3 rounded-lg bg-[#FAFAFA] px-3 py-2.5 transition-colors duration-300"
                : "flex items-center justify-between gap-3 px-3 py-2.5 transition-colors duration-300 hover:bg-[#FAFAFA]/60"
            }
          >
            <p className="truncate text-[13px] text-[#1D1D1D] sm:text-[14px]">
              {row.email}
            </p>
            <motion.span
              className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-[#6B6F76] ring-1 ring-[#F0F0F0] sm:text-[11px]"
              whileHover={reduceMotion ? undefined : { scale: 1.04 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              {row.tag}
            </motion.span>
          </MailRevealItem>
        ))}
      </MailStagger>
    </PreviewFrame>
  );
}

function ApiPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E8E8E8] bg-[#1D1D1D] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2" aria-hidden>
          <span className="size-2 rounded-full bg-white/20" />
          <span className="size-2 rounded-full bg-white/20" />
          <span className="size-2 rounded-full bg-white/20" />
        </div>
        <span className="text-[11px] text-white/50">send-mail.sh</span>
      </div>

      <div className="px-4 py-5 sm:px-5">
        <p className="font-mono text-[12px] text-white sm:text-[13px]">
          POST /v1/mail/send
        </p>
        <pre
          className="mt-4 overflow-x-auto font-mono text-[11px] leading-[1.75] text-white/80 sm:text-[12px]"
          tabIndex={-1}
        >
          {`{
  "to": "customer@example.com",
  "subject": "Order confirmation"
}`}
        </pre>
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3 sm:px-5">
        <span className="font-mono text-[11px] text-white sm:text-[12px]">200</span>
        <span className="text-white/30" aria-hidden>·</span>
        <span className="font-mono text-[11px] text-white/70 sm:text-[12px]">delivered</span>
      </div>
    </div>
  );
}

function DnsPreview() {
  const reduceMotion = useReducedMotion();
  const steps = [
    { label: "Domain ownership", status: "Verified" as const },
    { label: "Outbound mail", status: "Verified" as const },
    { label: "Inbound routing", status: "In progress" as const },
  ];

  const verifiedCount = steps.filter((step) => step.status === "Verified").length;
  const progress = verifiedCount / steps.length;

  return (
    <PreviewFrame>
      <div className="border-b border-[#F0F0F0] px-4 py-3 sm:px-5">
        <p className="text-[12px] font-medium text-[#1D1D1D] sm:text-[13px]">
          example.com
        </p>
        <p className="mt-0.5 text-[11px] text-[#9CA3AF]">Domain setup</p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#F0F0F0]">
          <motion.div
            className="h-full rounded-full bg-[#1D1D1D]"
            initial={reduceMotion ? false : { width: 0 }}
            whileInView={reduceMotion ? undefined : { width: `${progress * 100}%` }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          />
        </div>
      </div>
      <MailStagger as="ul" className="divide-y divide-[#F0F0F0]" stagger={0.12}>
        {steps.map((step) => (
          <MailRevealItem
            key={step.label}
            as="li"
            y={10}
            className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
          >
            <p className="text-[12px] text-[#1D1D1D] sm:text-[13px]">{step.label}</p>
            {step.status === "Verified" ? (
              <motion.span
                className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[#1D1D1D] sm:text-[12px]"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                Verified
              </motion.span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-[#9CA3AF] sm:text-[12px]">
                {!reduceMotion ? (
                  <motion.span
                    className="size-1.5 rounded-full bg-[#9CA3AF]"
                    animate={{ opacity: [0.35, 1, 0.35] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    aria-hidden
                  />
                ) : null}
                In progress
              </span>
            )}
          </MailRevealItem>
        ))}
      </MailStagger>
    </PreviewFrame>
  );
}

function WebmailPreview() {
  const messages = [
    { subject: "Weekly activity summary", time: "11:42" },
    { subject: "Billing notice", time: "09:15" },
    { subject: "Deployment completed", time: "Yesterday" },
  ];

  return (
    <PreviewFrame>
      <div className="flex items-center justify-between border-b border-[#F0F0F0] px-4 py-3 sm:px-5">
        <p className="text-[12px] font-medium text-[#1D1D1D]">Inbox</p>
        <p className="text-[11px] text-[#9CA3AF]">team@example.com</p>
      </div>
      <MailStagger as="ul" className="divide-y divide-[#F0F0F0]" stagger={0.1}>
        {messages.map((msg) => (
          <MailRevealItem
            key={msg.subject}
            as="li"
            y={10}
            className="px-4 py-3 transition-colors duration-300 hover:bg-[#FAFAFA] sm:px-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate text-[12px] text-[#1D1D1D] sm:text-[13px]">
                {msg.subject}
              </p>
              <span className="shrink-0 text-[10px] tabular-nums text-[#9CA3AF] sm:text-[11px]">
                {msg.time}
              </span>
            </div>
          </MailRevealItem>
        ))}
      </MailStagger>
    </PreviewFrame>
  );
}

const FEATURES: Feature[] = [
  {
    id: "mailboxes",
    title: "Mailboxes",
    description:
      "Add addresses on your domain, set up aliases, and forward mail to the right inbox. Your team shares one console.",
    cta: "Open console",
    href: "/login",
    preview: <MailboxesPreview />,
  },
  {
    id: "api",
    title: "Email API",
    description:
      "Send receipts, resets, and notifications over HTTPS. Request logs and delivery events are kept for 30 days.",
    cta: "API reference",
    href: () => `${resolveDeveloperUrl()}/documentation/email-api`,
    external: true,
    preview: <ApiPreview />,
  },
  {
    id: "dns",
    title: "DNS",
    description:
      "Connect your domain with guided setup. We check each step and tell you when mail is ready to send and receive.",
    cta: "Setup guide",
    href: "/getting-started",
    preview: <DnsPreview />,
  },
  {
    id: "webmail",
    title: "Webmail",
    description:
      "Read and reply in the browser. Search, attachments, and folders — no Outlook install required.",
    cta: "Sign in",
    href: "/login",
    preview: <WebmailPreview />,
  },
];

function FeatureCta({
  href,
  external,
  label,
}: {
  href: string;
  external?: boolean;
  label: string;
}) {
  const className =
    "group mt-7 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:text-[#0A0A0A]";

  const arrow = (
    <ArrowRight
      className="size-4 transition-transform group-hover:translate-x-0.5"
      aria-hidden
    />
  );

  if (external) {
    return (
      <a href={href} rel="noopener noreferrer" className={className}>
        {label}
        {arrow}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
      {arrow}
    </Link>
  );
}

function FeatureItem({
  feature,
  index,
  total,
}: {
  feature: Feature;
  index: number;
  total: number;
}) {
  const href =
    typeof feature.href === "function" ? feature.href() : feature.href;

  return (
    <article
      data-feature-item=""
      className="feature-item sticky top-20 border-t border-[#F0F0F0] bg-white py-16 first:border-t-0 sm:top-24 sm:py-20"
      style={{ zIndex: index + 1 }}
    >
      <div
        className="flex min-h-[min(68vh,640px)] items-center"
        style={{ marginBottom: index === total - 1 ? 0 : "12vh" }}
      >
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 xl:gap-20">
          <MailReveal className="flex min-w-0 flex-col" y={14}>
            <p className="text-[12px] font-medium tabular-nums tracking-wide text-[#9CA3AF]">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </p>

            <h3 className="mt-5 text-balance text-[clamp(1.625rem,3.2vw,2.25rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[#1D1D1D]">
              {feature.title}
            </h3>

            <p className="mt-4 max-w-[36ch] text-pretty text-[15px] leading-[1.65] text-[#6B6F76] sm:max-w-md sm:text-base sm:leading-[1.7]">
              {feature.description}
            </p>

            <FeatureCta
              href={href}
              external={feature.external}
              label={feature.cta}
            />
          </MailReveal>

          <MailReveal delay={0.08} y={18}>
            <div className="lg:max-w-[520px] lg:justify-self-end lg:w-full">
              {feature.preview}
            </div>
          </MailReveal>
        </div>
      </div>
    </article>
  );
}

export function MailAgFeatureExplorer() {
  return (
    <section
      id="products"
      data-feature-explorer-section=""
      className="border-t border-[#E8E8E8] bg-white"
      aria-labelledby="feature-explorer-heading"
    >
      <div className={`${agLayout.container} pt-20 pb-4 sm:pt-24 sm:pb-6`}>
        <MailReveal y={12}>
          <h2
            id="feature-explorer-heading"
            className="max-w-xl text-balance text-[clamp(1.75rem,3.5vw,2rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[#1D1D1D]"
          >
            Built for the work you already do
          </h2>
          <p className="mt-4 max-w-lg text-pretty text-[15px] leading-[1.65] text-[#6B6F76] sm:text-base">
            Mailboxes, sending, DNS, and webmail in one place — on the domain you
            already own.
          </p>
        </MailReveal>
      </div>

      <div className={`${agLayout.container} feature-list`}>
        {FEATURES.map((feature, index) => (
          <FeatureItem
            key={feature.id}
            feature={feature}
            index={index}
            total={FEATURES.length}
          />
        ))}
      </div>

      <div className="h-8 sm:h-12" aria-hidden />
    </section>
  );
}
