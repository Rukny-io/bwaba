"use client";

import Image from "next/image";
import Link from "next/link";
import { agLayout } from "@/lib/mail-antigravity-theme";

const HERO_TITLE =
  "Experience liftoff with business email on your domain";

export function MailAgHero({
  primaryHref,
  primaryLabel,
  signedIn = false,
}: {
  primaryHref: string;
  primaryLabel: string;
  signedIn?: boolean;
}) {
  return (
    <section
      data-welcome-section=""
      className="welcome-wrapper bg-white text-[#1D1D1D]"
      aria-labelledby="ag-hero-title"
    >
      <div
        data-welcome-content=""
        className="welcome-section mx-auto flex max-w-[720px] flex-col items-center px-5 pb-20 pt-[7.5rem] text-center sm:px-8 sm:pb-24 sm:pt-32"
      >
        <Link
          href="/"
          className="logo mb-10 inline-flex items-center gap-2.5 sm:mb-12"
        >
          <Image
            src="/rukny-logo.svg"
            alt=""
            width={28}
            height={28}
            priority
            className="size-7"
          />
          <span className="text-[1.35rem] font-medium tracking-[-0.03em] text-[#1D1D1D]">
            Rukny Mail
          </span>
        </Link>

        <h1
          id="ag-hero-title"
          className="text-balance text-[2rem] font-medium leading-[1.1] tracking-[0em] text-[#1D1D1D]"
        >
          {HERO_TITLE}
        </h1>

        <div
          data-cta=""
          className="welcome-cta mt-10 flex flex-wrap items-center justify-center gap-2.5 sm:mt-12 sm:gap-3"
        >
          <Link href={primaryHref} className={agLayout.btnPrimary}>
            {primaryLabel}
          </Link>

          <Link href="/pricing" className={agLayout.btnSecondary}>
            View pricing
          </Link>

          {signedIn ? (
            <Link href="/documents" className={agLayout.btnGhost}>
              Documentation
            </Link>
          ) : (
            <Link href="/getting-started" className={agLayout.btnGhost}>
              Getting started
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
