import type { Metadata } from 'next';
import Footer from '@/components/layout/footer';
import { PricingView } from '@/components/pricing/pricing-view';
import { MarketingHeader } from '@/components/shared/hero-section-1';

export const metadata: Metadata = {
  title: 'الأسعار — Rukny',
  description:
    'باقات ركني (Rukny) لإنشاء النماذج والمتجر والروابط والتحليلات. ابدأ مجاناً وارتقِ متى احتجت — أسعار بالدينار العراقي.',
};

export default function PricingPage() {
  return (
    <>
      <MarketingHeader />
      <main className="bg-white pt-16 text-[#132327] sm:pt-[4.5rem]" dir="rtl">
        <PricingView />
      </main>
      <Footer />
    </>
  );
}
