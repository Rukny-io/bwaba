"use client";

import Link from "next/link";
import Image from "next/image";
import {
  resolveAccountsUrl,
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
      <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#888888]">
        {title}
      </h3>
      <ul className="space-y-2">
        {links.map((link) => {
          const className =
            "text-[13px] text-[#666666] transition-colors hover:text-[#111111]";
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
          if (link.href.startsWith("mailto:")) {
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
  const accounts = resolveAccountsUrl();

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: "Product",
      links: [
        { label: "Getting started", href: "/getting-started" },
        { label: "Pricing", href: "/pricing" },
        { label: "Documents", href: "/documents" },
        { label: "FAQs", href: "/faqs" },
      ],
    },
    {
      title: "Rukny",
      links: [
        { label: "Forms", href: forms, external: true },
        {
          label: "Email API",
          href: `${developer}/documentation/email-api`,
          external: true,
        },
        {
          label: signedIn ? "Open console" : "Sign in",
          href: signedIn ? "/apps" : "/login",
        },
      ],
    },
    {
      title: "Legal",
      links: [
        {
          label: "Privacy",
          href: `${accounts}/privacy`,
          external: true,
        },
        {
          label: "Terms",
          href: `${accounts}/terms`,
          external: true,
        },
        { label: "support@rukny.io", href: "mailto:support@rukny.io" },
      ],
    },
  ];

  return (
    <footer className="border-t border-[#e8e8e8] bg-[#fafafa]">
      <div className={L.container}>
        <div className="flex flex-col gap-10 py-10 sm:py-12 lg:flex-row lg:justify-between lg:gap-14">
          <div className="max-w-[16rem] shrink-0">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/rukny-logo.svg" alt="" width={22} height={22} />
              <span className="text-[15px] font-bold tracking-tight text-[#111111]">
                Rukny Mail
              </span>
            </Link>
            <p className="mt-3 text-[13px] leading-relaxed text-[#666666]">
              Business email on a domain you own.
            </p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 sm:gap-x-10">
            {columns.map((column) => (
              <FooterColumn
                key={column.title}
                title={column.title}
                links={column.links}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[#e8e8e8] py-4 text-[11px] text-[#888888] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Rukny</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <a
              href={`${accounts}/privacy`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#111111]"
            >
              Privacy
            </a>
            <a
              href={`${accounts}/terms`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#111111]"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
