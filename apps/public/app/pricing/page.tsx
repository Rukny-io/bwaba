import type { Metadata } from 'next';
import { ConsultationCtaSection } from '@/components/home/consultation-cta-section';
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
      <main className="min-h-screen overflow-x-clip pt-20 text-[#132327]" dir="rtl">
        <PricingView />
        <ConsultationCtaSection />
      </main>
      <Footer />
    </>
  );
}
