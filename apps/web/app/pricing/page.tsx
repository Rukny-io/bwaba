import type { Metadata } from 'next';
import { PublicMarketingShell } from '@/components/marketing/public-marketing-shell';
import { PricingView } from '@/components/pricing/pricing-view';
import { getMessages } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = getMessages(locale);

  return {
    title: messages.meta.pricingTitle,
    description: messages.meta.pricingDescription,
  };
}

export default function PricingPage() {
  return (
    <PublicMarketingShell smoothScroll={false}>
      <main className="overflow-x-clip bg-white pt-14 text-[#1D1D1D]">
        <PricingView />
      </main>
    </PublicMarketingShell>
  );
}
