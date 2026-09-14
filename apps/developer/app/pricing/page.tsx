import type { Metadata } from 'next';
import {
  LandingAnnouncement,
  LandingFooter,
  LandingHeader,
} from '@/components/landing/landing-shell';
import { PricingSection } from '@/components/landing/pricing-section';

export const metadata: Metadata = {
  title: 'Pricing | Rukny Developers',
  description:
    'Free and Pro developer plans, WhatsApp usage pricing, and Email API Starter at 15,000 IQD per month.',
};

export default function PricingPage() {
  return (
    <div
      className="min-h-screen bg-[var(--background)] text-[var(--foreground)]"
      dir="ltr"
      lang="en"
    >
      <LandingAnnouncement locale="en" />
      <LandingHeader locale="en" />
      <main>
        <PricingSection />
      </main>
      <LandingFooter locale="en" />
    </div>
  );
}
