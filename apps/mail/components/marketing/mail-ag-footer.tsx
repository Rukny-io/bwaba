"use client";

import Link from "next/link";
import Image from "next/image";
import {
  resolveAccountsUrl,
  resolveDeveloperUrl,
} from "@rukny/auth/client/env-urls";
import { agLayout } from "@/lib/mail-antigravity-theme";

const PAGE_LINKS = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "Getting started", href: "/getting-started" },
  { label: "Documentation", href: "/documents" },
] as const;

export function MailAgFooter({
  signedIn,
  primaryHref,
  primaryLabel,
}: {
  signedIn: boolean;
  primaryHref: string;
  primaryLabel: string;
}) {
  const accounts = resolveAccountsUrl();
  const developer = resolveDeveloperUrl();

  return (
    <footer id="contact" className="footer border-t border-[#E8E8E8] bg-white">
      <div className={`${agLayout.container} py-16 sm:py-20 md:py-24`}>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-20">
          <div className="min-w-0">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image src="/rukny-logo.svg" alt="" width={24} height={24} />
              <span className="text-[1.35rem] font-medium tracking-[-0.03em] text-[#1D1D1D] sm:text-[1.5rem]">
                Rukny Mail
              </span>
            </Link>
            <p className="mt-5 max-w-md text-pretty text-[15px] leading-[1.7] text-[#6B6F76] sm:text-base">
              Business email on a domain you own. Mailboxes, DNS, and delivery
              in one workspace.
            </p>
            <Link href={primaryHref} className={`${agLayout.btnPrimary} mt-8`}>
              {primaryLabel}
            </Link>
          </div>

          <div className="flex flex-col justify-between gap-10">
            <div>
              <p className="text-[12px] font-medium tracking-wide text-[#9CA3AF]">
                Pages
              </p>
              <ul className="mt-4 space-y-2.5">
                {PAGE_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-[#1D1D1D] transition-colors hover:text-[#6B6F76]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href={`${developer}/documentation/email-api`}
                    rel="noopener noreferrer"
                    className="text-[15px] text-[#1D1D1D] transition-colors hover:text-[#6B6F76]"
                  >
                    Email API
                  </a>
                </li>
                <li>
                  <Link
                    href={signedIn ? "/apps" : "/login"}
                    className="text-[15px] text-[#1D1D1D] transition-colors hover:text-[#6B6F76]"
                  >
                    {signedIn ? "Console" : "Sign in"}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[15px] leading-relaxed text-[#1D1D1D]">
                <a
                  href="mailto:support@rukny.io"
                  className="underline decoration-[#E8E8E8] underline-offset-4 transition-colors hover:decoration-[#1D1D1D]"
                >
                  support@rukny.io
                </a>
              </p>
              <p className="mt-2 text-[14px] text-[#9CA3AF]">
                Questions about setup or billing? We read every message.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-[#F0F0F0] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-[#9CA3AF]">
            © {new Date().getFullYear()} Rukny
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
            <a
              href={`${accounts}/privacy`}
              rel="noopener noreferrer"
              className="text-[#9CA3AF] transition-colors hover:text-[#1D1D1D]"
            >
              Privacy
            </a>
            <a
              href={`${accounts}/terms`}
              rel="noopener noreferrer"
              className="text-[#9CA3AF] transition-colors hover:text-[#1D1D1D]"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
