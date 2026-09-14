import type { Metadata } from "next";
import { MailPricingMarketingPage } from "@/components/marketing/mail-pricing-marketing-page";

export const metadata: Metadata = {
  title: "Pricing — Rukny Mail",
  description:
    "Plans per workspace, billed monthly in IQD. Start with Starter after DNS, then request Standard or Premium in the console.",
};

export default function PricingPage() {
  return <MailPricingMarketingPage />;
}
