import type { Metadata } from 'next';
import { LandingFooter, LandingHeader } from '@/components/landing/landing-shell';
import { LandingHero } from '@/components/landing/hero';
import { QuickstartSnippet } from '@/components/landing/quickstart-snippet';
import { HowItWorks } from '@/components/landing/how-it-works';
import { CapabilityBands } from '@/components/landing/capability-bands';
import { LANDING_COPY } from '@/lib/landing-copy';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const copy = LANDING_COPY[locale];
  return {
    title:
      locale === 'ar'
        ? 'رُكني للمطوّرين — WhatsApp وEmail وForms'
        : 'Rukny Developers — WhatsApp, Email & Forms',
    description: copy.support,
  };
}

export default async function LandingPage() {
  const locale = await getCurrentLocale();
  const copy = LANDING_COPY[locale];

  return (
    <div className="public-marketing relative isolate min-h-dvh bg-white text-[#1D1D1D]">
      <div className="public-mkt-atmosphere" aria-hidden>
        <span className="public-mkt-orb public-mkt-orb--hero" />
        <span className="public-mkt-orb public-mkt-orb--warm" />
        <span className="public-mkt-orb public-mkt-orb--cool" />
      </div>
      <div className="relative z-10 min-h-dvh">
        <LandingHeader copy={copy} locale={locale} />
        <div className="pt-14">
          <main className="bg-transparent text-[#1D1D1D]">
            <LandingHero copy={copy} />
            <QuickstartSnippet copy={copy} />
            <HowItWorks copy={copy} />
            <CapabilityBands copy={copy} />
          </main>
          <LandingFooter copy={copy} year={new Date().getFullYear()} />
        </div>
      </div>
    </div>
  );
}
