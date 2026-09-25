import type { Metadata } from 'next';
import { PublicMarketingShell } from '@/components/marketing/public-marketing-shell';
import { PricingView } from '@/components/pricing/pricing-view';

export const metadata: Metadata = {
  title: 'الأسعار — ركني',
  description:
    'باقات ركني لإنشاء النماذج والمتجر والروابط والتحليلات. ابدأ مجاناً وارتقِ متى احتجت — أسعار بالدينار العراقي.',
};

export default function PricingPage() {
  return (
    <PublicMarketingShell smoothScroll={false}>
      <main dir="rtl" lang="ar" className="overflow-x-clip bg-white pt-14 text-[#1D1D1D]">
        <PricingView />
      </main>
    </PublicMarketingShell>
  );
}
