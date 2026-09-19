import type { Metadata } from 'next';
import { DocumentationShell } from '@/components/documentation/docs-shell';
import { PricingSection } from '@/components/landing/pricing-section';

export const metadata: Metadata = {
  title: 'Pricing | Rukny Developers',
  description:
    'Free and Pro developer plans (Pro from 10,000 IQD/mo), WhatsApp usage pricing, and Email API Starter at 6,000 IQD per month.',
};

export default function PricingPage() {
  return (
    <DocumentationShell>
      <PricingSection />
    </DocumentationShell>
  );
}
