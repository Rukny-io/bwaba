import type { Metadata } from "next";
import { MailResendPricingPage } from "@/components/marketing/mail-resend-pricing-page";

export const metadata: Metadata = {
  title: "Pricing — Rukny Mail",
  description:
    "Hosted business email pricing in IQD — Free, Starter, Professional, and Custom plans. Start free after DNS verification.",
};

export default function PricingPage() {
  return <MailResendPricingPage />;
}
