import type { Metadata } from 'next';
import { PublicMarketingShell } from '@/components/marketing/public-marketing-shell';
import { PricingSection } from '@/components/landing/pricing-section';
import { LANDING_COPY } from '@/lib/landing-copy';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const copy = LANDING_COPY[locale];
  return {
    title:
      locale === 'ar'
        ? 'الأسعار | رُكني للمطوّرين'
        : 'Pricing | Rukny Developers',
    description: copy.pricingPageLead,
  };
}

export default async function PricingPage() {
  const locale = await getCurrentLocale();
  const copy = LANDING_COPY[locale];

  return (
    <PublicMarketingShell copy={copy} locale={locale}>
      <main className="overflow-x-clip bg-white text-[#1D1D1D]">
        <PricingSection header={copy} />
      </main>
    </PublicMarketingShell>
  );
}
