import type { Metadata } from "next";
import { resolveDeveloperUrl } from "@rukny/auth/client/env-urls";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import { MailEmailApiPricingEstimate } from "@/components/marketing/mail-email-api-pricing-estimate";
import { getCurrentMailUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Estimate your costs — Rukny Mail",
  description:
    "Estimate Rukny Mail monthly cost in IQD — transactional volume, marketing contacts, and automations on one unified plan.",
};

export default async function PricingEstimatePage() {
  const user = await getCurrentMailUser();
  const signedIn = Boolean(user);
  const developer = resolveDeveloperUrl();
  const startHref = signedIn ? `${developer}/apps` : `${developer}/login?next=/apps`;
  return (
    <MailMarketingShell signedIn={signedIn} plainBackground variant="antigravity">
      <MailEmailApiPricingEstimate startHref={startHref} />
    </MailMarketingShell>
  );
}
