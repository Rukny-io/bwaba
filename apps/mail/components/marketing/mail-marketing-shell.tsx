"use client";

import { MailHomeHeader } from "@/components/marketing/mail-home-header";
import { MailMarketingFooter } from "@/components/marketing/mail-marketing-footer";
import { MailSmoothScroll } from "@/components/marketing/mail-smooth-scroll";
import { cn } from "@heroui/react";

export function MailMarketingShell({
  signedIn,
  children,
  plainBackground = false,
  smoothScroll = true,
}: {
  signedIn: boolean;
  children: React.ReactNode;
  plainBackground?: boolean;
  /** Lenis breaks sticky docs sidebars — turn off on /documents. */
  smoothScroll?: boolean;
}) {
  const body = (
    <div
      className={cn(
        "mail-marketing relative isolate min-h-dvh bg-[#fafafa] text-[#111111]",
        plainBackground && "bg-[#fafafa]",
      )}
    >
      <div className="relative z-0 min-h-dvh">
        <MailHomeHeader signedIn={signedIn} />
        {children}
        <MailMarketingFooter signedIn={signedIn} />
      </div>
    </div>
  );

  if (!smoothScroll) return body;
  return <MailSmoothScroll>{body}</MailSmoothScroll>;
}
