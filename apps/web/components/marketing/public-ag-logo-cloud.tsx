'use client';

import { useTranslations } from 'next-intl';
import { LogoCloud } from '@/components/ui/logo-cloud';
import { agLayout } from '@/lib/public-antigravity-theme';

const LOGO_KEYS = ['aws', 'microsoft', 'notion', 'udemy', 'meta'] as const;
const LOGO_SRC: Record<(typeof LOGO_KEYS)[number], string> = {
  aws: '/logos/aws.svg',
  microsoft: '/logos/microsoft.svg',
  notion: '/logos/notion-full.svg',
  udemy: '/logos/udemy.svg',
  meta: '/logos/tL_v571NdZ0.svg',
};

export function PublicAgLogoCloud() {
  const t = useTranslations('home.logoCloud');

  const logos = LOGO_KEYS.map((key) => ({
    src: LOGO_SRC[key],
    alt: t(`logos.${key}`),
  }));

  return (
    <section
      className={`${agLayout.sectionWhite} py-20 sm:py-24`}
      aria-labelledby="public-logos-heading"
    >
      <div className={`${agLayout.container} text-center`}>
        <p className={agLayout.eyebrow}>{t('eyebrow')}</p>
        <h2 id="public-logos-heading" className={`${agLayout.sectionTitle} mt-4`}>
          {t('title')}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#6B6F76]">
          {t('lead')}
        </p>
        <div className="relative mt-12 overflow-hidden opacity-75" dir="ltr">
          <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-20 bg-gradient-to-r from-white to-transparent sm:w-28" />
          <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-20 bg-gradient-to-l from-white to-transparent sm:w-28" />
          <LogoCloud logos={logos} />
        </div>
      </div>
    </section>
  );
}
