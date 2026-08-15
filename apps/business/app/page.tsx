import { ChannelsSection } from '@/components/landing/channels-section';
import { CtaSection } from '@/components/landing/cta-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { HeroSection } from '@/components/landing/hero-section';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingNav } from '@/components/landing/landing-nav';

export default function HomePage() {
  return (
    <div
      dir="rtl"
      className="landing-page isolate flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]"
    >
      <LandingNav />

      <main className="flex flex-1 flex-col">
        <HeroSection />
        <FeaturesSection />
        <ChannelsSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
