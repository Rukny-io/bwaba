"use client";

import Link from "next/link";
import Image from "next/image";
import {
  resolveAccountsUrl,
  resolveDeveloperUrl,
  resolveFormsUrl,
} from "@rukny/auth/client/env-urls";
import { optLayout } from "@/lib/mail-optimus-theme";

export function MailOptimusFooter({ signedIn }: { signedIn: boolean }) {
  const developer = resolveDeveloperUrl();
  const forms = resolveFormsUrl();
  const accounts = resolveAccountsUrl();

  const columns = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "How it works", href: "#process" },
        { label: "Pricing", href: "/pricing" },
        { label: "Getting started", href: "/getting-started" },
      ],
    },
    {
      title: "Developers",
      links: [
        { label: "Documentation", href: "/documents" },
        { label: "Email API", href: `${developer}/documentation/email-api`, external: true },
        { label: "Developers", href: "/developers" },
        { label: "Status", href: `${developer}`, external: true },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Forms", href: forms, external: true },
        { label: "FAQs", href: "/faqs" },
        {
          label: signedIn ? "Open console" : "Sign in",
          href: signedIn ? "/apps" : "/login",
        },
        { label: "support@rukny.io", href: "mailto:support@rukny.io" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: `${accounts}/privacy`, external: true },
        { label: "Terms", href: `${accounts}/terms`, external: true },
        { label: "Security", href: "#security" },
      ],
    },
  ] as const;

  return (
    <footer className="border-t border-[#E5E5E5] bg-white">
      <div className={`${optLayout.container} py-14 sm:py-16`}>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr] lg:gap-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/rukny-logo.svg" alt="" width={22} height={22} />
              <span className="text-[15px] font-semibold tracking-[-0.03em]">
                Rukny Mail
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-[#737373]">
              The platform for teams who ship. Business email on a domain you
              own.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#737373]">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[14px] text-[#525252] transition-colors hover:text-[#0A0A0A]"
                        >
                          {link.label}
                        </a>
                      ) : link.href.startsWith("mailto:") ? (
                        <a
                          href={link.href}
                          className="text-[14px] text-[#525252] transition-colors hover:text-[#0A0A0A]"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-[14px] text-[#525252] transition-colors hover:text-[#0A0A0A]"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#E5E5E5] pt-6 text-[12px] text-[#737373] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Rukny. All rights reserved.</p>
          <p>All systems operational</p>
        </div>
      </div>
    </footer>
  );
}
