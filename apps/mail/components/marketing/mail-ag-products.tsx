"use client";

import Link from "next/link";
import {
  ArrowRight,
  Globe,
  Inbox,
  Monitor,
  Terminal,
} from "lucide-react";
import { MailReveal, MailRevealItem, MailStagger } from "@/components/marketing/mail-reveal";
import { agLayout } from "@/lib/mail-antigravity-theme";
import {
  resolveDeveloperUrl,
} from "@rukny/auth/client/env-urls";

type ProductItem = {
  id: string;
  icon: typeof Inbox;
  title: string;
  tag: string;
  description: string;
  href: string | (() => string);
  cta: string;
  external?: boolean;
};

const PRODUCTS: ProductItem[] = [
  {
    id: "mailboxes",
    icon: Inbox,
    title: "Mailboxes",
    tag: "Workspace",
    description:
      "Your command center for team inboxes, aliases, and forwards. Manage every mailbox on your domain from one console.",
    href: "/login",
    cta: "Explore product",
  },
  {
    id: "api",
    icon: Terminal,
    title: "Email API",
    tag: "Developers",
    description:
      "The lightweight, fast way to send transactional mail from your apps. REST endpoints, typed docs, and delivery logs.",
    href: () => `${resolveDeveloperUrl()}/documentation/email-api`,
    cta: "Explore product",
    external: true,
  },
  {
    id: "dns",
    icon: Globe,
    title: "DNS Setup",
    tag: "Authentication",
    description:
      "Copy-paste SPF, DKIM, and verification records we generate. Guided checklist so messages reach the inbox.",
    href: "/getting-started",
    cta: "Explore product",
  },
  {
    id: "webmail",
    icon: Monitor,
    title: "Webmail",
    tag: "Any device",
    description:
      "The fully-featured inbox experience. Compose, search, and manage mail from any browser — no install required.",
    href: "/login",
    cta: "Explore product",
  },
];

export function MailAgProducts() {
  return (
    <section
      id="products"
      className="border-t border-[#E8E8E8] bg-white"
      aria-labelledby="ag-products-heading"
    >
      <div className={`${agLayout.container} ${agLayout.section}`}>
        <MailReveal className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-medium text-[#6B6F76]">
            Everything you need to run mail at scale
          </p>
          <h2
            id="ag-products-heading"
            className={`${agLayout.sectionTitle} mt-3`}
          >
            Built for teams on the agent-first era
          </h2>
          <p className={`${agLayout.lead} mt-4`}>
            Rukny Mail is our business email platform, allowing anyone to send
            and receive on a domain they own.
          </p>
        </MailReveal>

        <MailStagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:gap-6">
          {PRODUCTS.map((product) => {
            const Icon = product.icon;
            const href =
              typeof product.href === "function" ? product.href() : product.href;

            return (
              <MailRevealItem key={product.id} className={agLayout.card}>
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F5F5F5] text-[#1D1D1D]">
                    <Icon className="size-5" strokeWidth={1.6} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-[#6B6F76]">
                      {product.tag}
                    </p>
                    <h3 className="mt-1 text-[1.25rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                      {product.title}
                    </h3>
                  </div>
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-[#6B6F76]">
                  {product.description}
                </p>
                {product.external ? (
                  <a
                    href={href}
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:text-[#6B6F76]"
                  >
                    {product.cta}
                    <ArrowRight className="size-4" aria-hidden />
                  </a>
                ) : (
                  <Link
                    href={href}
                    className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:text-[#6B6F76]"
                  >
                    {product.cta}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                )}
              </MailRevealItem>
            );
          })}
        </MailStagger>
      </div>
    </section>
  );
}
