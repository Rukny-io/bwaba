'use client';

import { PublicAgFooter } from '@/components/marketing/public-ag-footer';
import { PublicAgHeader } from '@/components/marketing/public-ag-header';
import { PublicSmoothScroll } from '@/components/marketing/public-smooth-scroll';
import { cn } from '@/lib/utils';

export function PublicMarketingShell({
  children,
  smoothScroll = true,
}: {
  children: React.ReactNode;
  smoothScroll?: boolean;
}) {
  const body = (
    <div
      dir="rtl"
      lang="ar"
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
