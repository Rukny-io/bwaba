import type { Metadata } from "next";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import { MailPricingEstimate } from "@/components/marketing/mail-pricing-estimate";
import { getCurrentMailUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Estimate your costs — Rukny Mail",
  description:
    "Estimate Rukny Mail monthly cost in IQD: plan seats plus prepaid outbound packs at 800 IQD per 1,000 emails.",
};

export default async function PricingEstimatePage() {
  const user = await getCurrentMailUser();
  return (
    <MailMarketingShell signedIn={Boolean(user)} plainBackground variant="antigravity">
      <MailPricingEstimate signedIn={Boolean(user)} />
    </MailMarketingShell>
  );
}
