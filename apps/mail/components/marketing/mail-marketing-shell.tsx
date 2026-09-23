"use client";

import { MailAgFooter } from "@/components/marketing/mail-ag-footer";
import { MailAgHeader } from "@/components/marketing/mail-ag-header";
import { MailHomeHeader } from "@/components/marketing/mail-home-header";
import { MailMarketingFooter } from "@/components/marketing/mail-marketing-footer";
import { MailOptimusFooter } from "@/components/marketing/mail-optimus-footer";
import { MailOptimusHeader } from "@/components/marketing/mail-optimus-header";
import { MailSmoothScroll } from "@/components/marketing/mail-smooth-scroll";
import { agFontRootClass } from "@/lib/mail-antigravity-font";
import "@/lib/mail-antigravity-font.css";
import { cn } from "@heroui/react";

export function MailMarketingShell({
  signedIn,
  children,
  plainBackground = false,
  smoothScroll = true,
  variant = "default",
}: {
  signedIn: boolean;
  children: React.ReactNode;
  plainBackground?: boolean;
  /** Lenis breaks sticky docs sidebars — turn off on /documents. */
  smoothScroll?: boolean;
  variant?: "default" | "optimus" | "antigravity";
}) {
  const primaryHref = signedIn ? "/apps" : "/login";
  const primaryLabel = signedIn ? "Open console" : "Get started";

  const body = (
    <div
      className={cn(
        "mail-marketing relative isolate min-h-dvh text-[#0A0A0A]",
        variant === "optimus"
          ? "bg-[#FAFAFA]"
          : variant === "antigravity"
            ? `${agFontRootClass} bg-white text-[#1D1D1D]`
            : "bg-[#fafafa] text-[#111111]",
        plainBackground &&
          (variant === "optimus"
            ? "bg-[#FAFAFA]"
            : variant === "antigravity"
              ? "bg-white"
              : "bg-[#fafafa]"),
      )}
    >
      <div className="relative z-0 min-h-dvh">
        {variant === "optimus" ? (
          <MailOptimusHeader signedIn={signedIn} />
        ) : variant === "antigravity" ? (
          <MailAgHeader signedIn={signedIn} />
        ) : (
          <MailHomeHeader signedIn={signedIn} />
        )}
        {children}
        {variant === "optimus" ? (
          <MailOptimusFooter signedIn={signedIn} />
        ) : variant === "antigravity" ? (
          <MailAgFooter
            signedIn={signedIn}
            primaryHref={primaryHref}
            primaryLabel={primaryLabel}
          />
        ) : (
          <MailMarketingFooter signedIn={signedIn} />
        )}
      </div>
    </div>
  );

  if (!smoothScroll) return body;
  return <MailSmoothScroll>{body}</MailSmoothScroll>;
}
