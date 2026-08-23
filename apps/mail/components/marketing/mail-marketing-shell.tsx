import { MailHomeHeader } from "@/components/marketing/mail-home-header";
import { MailMarketingFooter } from "@/components/marketing/mail-marketing-footer";

export function MailMarketingShell({
  signedIn,
  children,
}: {
  signedIn: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mail-marketing relative isolate min-h-dvh text-[#132327]">
      <div className="mail-marketing-radial" aria-hidden />
      <div className="relative z-0 min-h-dvh">
        <MailHomeHeader signedIn={signedIn} />
        {children}
        <MailMarketingFooter signedIn={signedIn} />
      </div>
    </div>
  );
}
