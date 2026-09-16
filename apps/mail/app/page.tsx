import type { Metadata } from "next";
import { MailHomePage } from "@/components/marketing/mail-home-page";
import { getCurrentMailUser } from "@/lib/current-user";
import { getMailPublicStats } from "@/lib/mail-public-stats";

export const metadata: Metadata = {
  title: "Rukny Mail — Business email on your domain",
  description:
    "Mailboxes on your domain, DNS authentication, and webmail. Team console, aliases, and Amazon SES delivery.",
};

export default async function HomePage() {
  const [user, stats] = await Promise.all([
    getCurrentMailUser(),
    getMailPublicStats(),
  ]);
  return (
    <MailHomePage signedIn={Boolean(user)} emailsSent={stats.emailsSent} />
  );
}
