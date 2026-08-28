import { MailHomeHeader } from "@/components/marketing/mail-home-header";
import { MailMarketingFooter } from "@/components/marketing/mail-marketing-footer";
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
    <div
      className={cn(
        "mail-marketing relative isolate min-h-dvh text-[#132327]",
        plainBackground && "bg-white",
      )}
    >
      {plainBackground ? null : <div className="mail-marketing-radial" aria-hidden />}
      <div className="relative z-0 min-h-dvh">
        <MailHomeHeader signedIn={signedIn} />
        {children}
        <MailMarketingFooter signedIn={signedIn} />
      </div>
    </div>
  );
}
