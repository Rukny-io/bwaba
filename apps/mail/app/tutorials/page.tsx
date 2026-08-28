import type { Metadata } from "next";
import { MailTutorialsHubPage } from "@/components/marketing/mail-tutorials-hub-page";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import { getCurrentMailUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Tutorials — Rukny Mail",
  description:
    "Step-by-step guides for domain setup, mailboxes, routing, and delivery on Rukny Mail.",
};

export default async function TutorialsHubPage() {
  const user = await getCurrentMailUser();
  return (
    <MailMarketingShell signedIn={Boolean(user)} plainBackground>
      <MailTutorialsHubPage />
    </MailMarketingShell>
  );
}
