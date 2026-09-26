import type { Metadata } from 'next';
import { DocumentationShell } from '@/components/documentation/docs-shell';
import { PricingSection } from '@/components/landing/pricing-section';

export const metadata: Metadata = {
  title: 'Pricing | Rukny Developers',
  description:
    'Free and Pro developer plans (Pro from 10,000 IQD/mo), WhatsApp usage pricing, and Email API tiers from 3,000 free emails/month — priced to compete with Resend.',
};

export default function PricingPage() {
  return (
    <DocumentationShell>
      <PricingSection />
    </DocumentationShell>
  );
}
