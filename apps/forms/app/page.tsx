'use client';

import { CtaSection } from '@/components/landing/cta-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { HeroSection } from '@/components/landing/hero-section';
import { IntegrationsSection } from '@/components/landing/integrations-section';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingNav } from '@/components/landing/landing-nav';
import { PricingSection } from '@/components/landing/pricing-section';

export default function HomePage() {
  return (
    <div className="landing-page isolate flex min-h-screen flex-col [--max-content-width:1280px]">
      <LandingNav />

      <main className="flex flex-1 flex-col overflow-clip">
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
