import type { Metadata } from "next";
import { MailDocumentsHubPage } from "@/components/documents/mail-documents-hub-page";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import { getCurrentMailUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Tutorials — Rukny Mail",
  description:
    "Step-by-step tutorials for domain setup, mailboxes, routing, and delivery on Rukny Mail.",
};

export default async function TutorialsPage() {
  const user = await getCurrentMailUser();
  return (
    <MailMarketingShell
      signedIn={Boolean(user)}
      plainBackground
      smoothScroll={false}
      variant="antigravity"
    >
      <MailDocumentsHubPage
        eyebrow="Tutorials"
        title="Tutorials & guides"
        description="Follow short, practical tutorials to connect your domain, create mailboxes, and send as yourself."
      />
    </MailMarketingShell>
  );
}
