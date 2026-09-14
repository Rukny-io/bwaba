"use client";

import Link from "next/link";
import Image from "next/image";
import {
  resolveDeveloperUrl,
  resolveFormsUrl,
} from "@rukny/auth/client/env-urls";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <h3 className="mb-5 text-sm font-semibold text-[#041f22]">{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => {
          const className =
            "text-sm text-[#4a5c5a] transition-colors hover:text-[#041f22]";
          const isMail = link.href.startsWith("mailto:");

          if (link.external) {
            return (
              <li key={`${title}-${link.label}`}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {link.label}
                </a>
              </li>
            );
          }

          if (isMail) {
            return (
              <li key={`${title}-${link.label}`}>
                <a href={link.href} className={className}>
                  {link.label}
                </a>
              </li>
            );
          }

          return (
            <li key={`${title}-${link.label}`}>
              <Link href={link.href} className={className}>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function MailMarketingFooter({ signedIn }: { signedIn: boolean }) {
  const developer = resolveDeveloperUrl();
  const forms = resolveFormsUrl();

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: "Products",
      links: [
        { label: "Mailboxes", href: "/" },
        { label: "Forms", href: forms, external: true },
        {
          label: "Email API",
          href: `${developer}/documentation/email-api`,
          external: true,
        },
        { label: "Marketing emails", href: "/pricing/estimate" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Getting started", href: "/getting-started" },
        { label: "Tutorials", href: "/tutorials" },
        { label: "FAQs", href: "/faqs" },
        { label: "Features", href: "/#features" },
      ],
    },
    {
      title: "Pricing",
      links: [
        { label: "Plans", href: "/pricing" },
        { label: "Cost calculator", href: "/pricing/estimate" },
        {
          label: signedIn ? "Open console" : "Sign in",
          href: signedIn ? "/apps" : "/login",
        },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "support@rukny.io", href: "mailto:support@rukny.io" },
      ],
    },
  ];

  return (
    <footer className="border-t border-[#d7ebea] bg-[#eef5f4]">
      <div className={L.container}>
        <div className="relative border-x border-[#d7ebea] px-4 pt-16 sm:px-8 sm:pt-24">
          <div className="flex flex-col gap-12 pb-14 sm:pb-16 lg:flex-row lg:justify-between lg:gap-16">
            <div className="max-w-xs shrink-0">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <Image src="/rukny-logo.svg" alt="" width={28} height={28} />
                <span className="text-lg font-bold tracking-tight text-[#041f22]">
                  Rukny
                </span>
              </Link>
              <p className="mt-5 text-sm leading-relaxed text-[#4a5c5a]">
                Business email on a domain you own — mailboxes, routing, and
                webmail in one console.
              </p>
            </div>

            <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 sm:gap-x-6">
              {columns.map((column) => (
                <FooterColumn
                  key={column.title}
                  title={column.title}
                  links={column.links}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#d7ebea] py-5 text-xs text-[#7a908e] sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Rukny. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link
                href="/privacy"
                className="transition-colors hover:text-[#041f22]"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-[#041f22]"
              >
                Terms
              </Link>
              <span>Rukny Mail</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
