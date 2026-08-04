import { CtaSection } from '@/components/landing/cta-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { HeroSection } from '@/components/landing/hero-section';
import { IntegrationsSection } from '@/components/landing/integrations-section';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingNav } from '@/components/landing/landing-nav';
import { PricingSection } from '@/components/landing/pricing-section';

export default function HomePage() {
  return (
    <div
      dir="rtl"
      className="landing-page isolate flex min-h-screen flex-col bg-white text-[#132327]"
    >
      <LandingNav />

      <main className="flex flex-1 flex-col">
        <HeroSection />
        <FeaturesSection />
        <IntegrationsSection />
        <PricingSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
