import type { Metadata } from 'next';
import { LandingFooter, LandingHeader } from '@/components/landing/landing-shell';
import { PricingSection } from '@/components/landing/pricing-section';

export const metadata: Metadata = {
  title: 'الأسعار | Rukny Developers',
  description:
    'خطط Free و Pro لبوابة مطوّري Rukny — تطبيقات، مفاتيح API، ورسائل WhatsApp بفوترة حسب الاستخدام.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <LandingHeader />
      <main>
        <PricingSection />
      </main>
      <LandingFooter />
    </div>
  );
}
