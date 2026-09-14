import {
  LandingAnnouncement,
  LandingFooter,
  LandingHeader,
} from '@/components/landing/landing-shell';
import { LandingHero } from '@/components/landing/hero';
import { QuickstartSnippet } from '@/components/landing/quickstart-snippet';
import { ProductConsoleMock } from '@/components/landing/product-console-mock';
import { HowItWorks } from '@/components/landing/how-it-works';
import { CapabilityBands } from '@/components/landing/capability-bands';
import { FinalCta } from '@/components/landing/final-cta';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <LandingAnnouncement />
      <LandingHeader />
      <main>
        <LandingHero />
        <QuickstartSnippet />
        <ProductConsoleMock />
        <HowItWorks />
        <CapabilityBands />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
