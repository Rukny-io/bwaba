import type { Metadata } from "next";
import { MailResendPricingPage } from "@/components/marketing/mail-resend-pricing-page";

export const metadata: Metadata = {
  title: "Pricing — Rukny Mail Email API",
  description:
    "Email API pricing in IQD — transactional tiers, marketing contacts, automations, and add-ons. Start with 3,000 free emails per month.",
};

export default function PricingPage() {
  return <MailResendPricingPage />;
}
