"use client";

import { MailAgHome } from "@/components/marketing/mail-ag-home";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";

export function MailHomePage({
  signedIn,
  emailsSent = 0,
}: {
  signedIn: boolean;
  emailsSent?: number;
}) {
  return (
    <MailMarketingShell signedIn={signedIn} variant="antigravity">
      <MailAgHome signedIn={signedIn} emailsSent={emailsSent} />
    </MailMarketingShell>
  );
}
