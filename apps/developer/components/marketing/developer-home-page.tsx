import { CapabilityBands } from '@/components/landing/capability-bands';
import { LandingHero } from '@/components/landing/hero';
import { LandingIntroSection } from '@/components/landing/landing-intro-section';
import { LandingPricingBand } from '@/components/landing/landing-pricing-band';
import { HowItWorks } from '@/components/landing/how-it-works';
import { QuickstartSnippet } from '@/components/landing/quickstart-snippet';
import type { LandingCopy } from '@/lib/landing-copy';

export function DeveloperHomePage({ copy }: { copy: LandingCopy }) {
  return (
    <main className="bg-transparent text-[#1D1D1D]">
      <LandingHero copy={copy} />
      <LandingIntroSection copy={copy} />
      <CapabilityBands copy={copy} />
      <HowItWorks copy={copy} />
      <QuickstartSnippet copy={copy} />
      <LandingPricingBand copy={copy} />
    </main>
  );
}
