'use client';

import { PublicAgAboutSection } from '@/components/marketing/public-ag-about-section';
import { PublicAgHero } from '@/components/marketing/public-ag-hero';
import { PublicAgIntroSection } from '@/components/marketing/public-ag-intro-section';
import { PublicAgLogoCloud } from '@/components/marketing/public-ag-logo-cloud';
import { PublicAgPricingBand } from '@/components/marketing/public-ag-pricing-band';
import { PublicAgProductsSection } from '@/components/marketing/public-ag-products-section';
import { PublicMarketingShell } from '@/components/marketing/public-marketing-shell';

export function PublicHomePage() {
  return (
    <PublicMarketingShell>
      <main dir="rtl" lang="ar" className="bg-transparent text-[#1D1D1D]">
        <PublicAgHero />
        <PublicAgIntroSection />
        <PublicAgLogoCloud />
        <PublicAgProductsSection />
        <PublicAgPricingBand />
        <PublicAgAboutSection />
      </main>
    </PublicMarketingShell>
  );
}
