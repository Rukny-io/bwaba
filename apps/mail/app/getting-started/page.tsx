import type { Metadata } from "next";
import { MailGettingStartedPage } from "@/components/marketing/mail-getting-started-page";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import { getCurrentMailUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Getting Started — Rukny Mail",
  description:
    "Sign in, connect your domain, and send as you@yourdomain with Rukny Mail.",
};

export default async function GettingStartedPage() {
  const user = await getCurrentMailUser();
  return (
    <MailMarketingShell signedIn={Boolean(user)}>
      <MailGettingStartedPage signedIn={Boolean(user)} />
    </MailMarketingShell>
  );
}
