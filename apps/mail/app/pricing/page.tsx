import type { Metadata } from "next";
import { MailPricingMarketingPage } from "@/components/marketing/mail-pricing-marketing-page";

export const metadata: Metadata = {
  title: "Pricing — Rukny Mail",
  description:
    "Plans per workspace, billed monthly in IQD. Starter activates after DNS and checkout; Standard and Premium are requested in Billing.",
};

export default function PricingPage() {
  return <MailPricingMarketingPage />;
}
