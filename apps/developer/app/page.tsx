import type { Metadata } from 'next';
import { DeveloperHomePage } from '@/components/marketing/developer-home-page';
import { PublicMarketingShell } from '@/components/marketing/public-marketing-shell';
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
    <PublicMarketingShell copy={copy} locale={locale}>
      <DeveloperHomePage copy={copy} />
    </PublicMarketingShell>
  );
}
