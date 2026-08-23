import type { Metadata } from "next";
import { MailFaqsPage } from "@/components/marketing/mail-faqs-page";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import { getCurrentMailUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "FAQs — Rukny Mail",
  description:
    "Short answers on domain, SES, webmail, and plans.",
};

export default async function FaqsPage() {
  const user = await getCurrentMailUser();
  return (
    <MailMarketingShell signedIn={Boolean(user)}>
      <MailFaqsPage signedIn={Boolean(user)} />
    </MailMarketingShell>
  );
}
