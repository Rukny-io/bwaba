"use client";

import { MailHomeHeader } from "@/components/marketing/mail-home-header";
import { MailMarketingFooter } from "@/components/marketing/mail-marketing-footer";
import { MailSmoothScroll } from "@/components/marketing/mail-smooth-scroll";
import { cn } from "@heroui/react";

export function MailMarketingShell({
  signedIn,
  children,
  plainBackground = false,
}: {
  signedIn: boolean;
  children: React.ReactNode;
  plainBackground?: boolean;
}) {
  return (
    <MailSmoothScroll>
      <div
        className={cn(
          "mail-marketing relative isolate min-h-dvh bg-[#f7faf9] text-[#041f22]",
          plainBackground && "bg-[#f7faf9]",
        )}
      >
        <div className="relative z-0 min-h-dvh">
          <MailHomeHeader signedIn={signedIn} />
          {children}
          <MailMarketingFooter signedIn={signedIn} />
        </div>
      </div>
    </MailSmoothScroll>
  );
}
