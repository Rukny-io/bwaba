import type { ReactNode } from 'react';
import { LandingFooter, LandingHeader } from '@/components/landing/landing-shell';
import type { LandingCopy } from '@/lib/landing-copy';
import type { Locale } from '@/lib/locale';

export function PublicMarketingShell({
  children,
  copy,
  locale,
  year = new Date().getFullYear(),
}: {
  children: ReactNode;
  copy: LandingCopy;
  locale: Locale;
  year?: number;
}) {
  return (
    <div className="public-marketing relative isolate min-h-dvh bg-white text-[#1D1D1D]">
      <div className="public-mkt-atmosphere" aria-hidden>
        <span className="public-mkt-orb public-mkt-orb--hero" />
        <span className="public-mkt-orb public-mkt-orb--warm" />
        <span className="public-mkt-orb public-mkt-orb--cool" />
      </div>
      <div className="relative z-10 min-h-dvh">
        <LandingHeader copy={copy} locale={locale} />
        <div className="pt-14">{children}</div>
        <LandingFooter copy={copy} year={year} />
      </div>
    </div>
  );
}
