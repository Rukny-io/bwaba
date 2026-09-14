import type { Metadata } from "next";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import { MailPricingEstimate } from "@/components/marketing/mail-pricing-estimate";
import { getCurrentMailUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Estimate your costs — Rukny Mail",
  description:
    "Estimate Rukny Mail monthly cost from seats and outbound volume. See what 1K or 50K emails cost in IQD.",
};

export default async function PricingEstimatePage() {
  const user = await getCurrentMailUser();
  return (
    <MailMarketingShell signedIn={Boolean(user)} plainBackground>
      <MailPricingEstimate signedIn={Boolean(user)} />
    </MailMarketingShell>
  );
}
