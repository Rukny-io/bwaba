import Footer from '@/components/layout/footer';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { MarketingHero } from '@/components/marketing/marketing-hero';
import { AntigravityProductsSection } from '@/components/marketing/antigravity-products-section';
import { AboutRuknySection } from '@/components/marketing/about-rukny-section';
import { CinematicCtaSection } from '@/components/marketing/cinematic-cta-section';
import { TrustLogosStrip } from '@/components/marketing/trust-logos-strip';

export function MarketingHome() {
  return (
    <div className="marketing-cinematic relative min-h-screen">
      <MarketingHeader />
      <main className="relative z-10">
        <MarketingHero />
        <AntigravityProductsSection />
        <TrustLogosStrip />
        <AboutRuknySection />
        <CinematicCtaSection />
      </main>
      <Footer />
    </div>
  );
}
