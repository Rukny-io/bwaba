import type { ReactNode } from "react";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import { getCurrentMailUser } from "@/lib/current-user";

export default async function DocumentsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentMailUser();
  return (
    <MailMarketingShell
      signedIn={Boolean(user)}
      plainBackground
      smoothScroll={false}
    >
      {children}
    </MailMarketingShell>
  );
}
