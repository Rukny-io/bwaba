'use client';

import { useLocale } from 'next-intl';
import { PublicAgFooter } from '@/components/marketing/public-ag-footer';
import { PublicAgHeader } from '@/components/marketing/public-ag-header';
import { PublicSmoothScroll } from '@/components/marketing/public-smooth-scroll';
import { getDirection, type AppLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function PublicMarketingShell({
  children,
  smoothScroll = true,
}: {
  children: React.ReactNode;
  smoothScroll?: boolean;
}) {
  const locale = useLocale() as AppLocale;
  const direction = getDirection(locale);

  const body = (
    <div
      dir={direction}
      lang={locale}
      className={cn(
        'public-marketing relative isolate min-h-dvh bg-white text-[#1D1D1D]',
      )}
    >
      <div className="public-mkt-atmosphere" aria-hidden>
        <span className="public-mkt-orb public-mkt-orb--hero" />
        <span className="public-mkt-orb public-mkt-orb--warm" />
        <span className="public-mkt-orb public-mkt-orb--cool" />
      </div>
      <div className="relative z-10 min-h-dvh">
        <PublicAgHeader />
        <div className="pt-14">{children}</div>
        <PublicAgFooter />
      </div>
    </div>
  );

  if (!smoothScroll) return body;
  return <PublicSmoothScroll>{body}</PublicSmoothScroll>;
}
