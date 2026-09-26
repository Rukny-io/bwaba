'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { agLayout } from '@/lib/public-antigravity-theme';
import { siteUrls } from '@/lib/site-urls';

export function PublicAgHero() {
  const t = useTranslations('home.hero');

  return (
    <section
      className="relative bg-transparent text-[#1D1D1D]"
      aria-labelledby="public-hero-title"
    >
      <div className="mx-auto flex max-w-[820px] flex-col items-center px-5 pb-24 pt-14 text-center sm:px-8 sm:pb-32 sm:pt-16">
        <h1
          id="public-hero-title"
          className={`${agLayout.heroTitle} home-hero-enter`}
        >
          <span className="block">{t('title')}</span>
          <span className="mt-2 block text-[#9CA3AF]">{t('titleMuted')}</span>
        </h1>

        <p className="home-hero-enter-delayed mt-8 max-w-xl text-[17px] leading-[1.75] text-[#6B6F76]">
          {t('lead')}
        </p>

        <div className="home-hero-enter-delayed mt-10 flex w-full max-w-md flex-col gap-2.5 sm:mt-12 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
          <Link href={siteUrls.accounts} className={`${agLayout.btnPrimary} w-full sm:w-auto`}>
            {t('startFree')}
          </Link>
          <Link href="#pricing" className={`${agLayout.btnSecondary} w-full sm:w-auto`}>
            {t('viewPricing')}
          </Link>
          <Link href="#products" className={`${agLayout.btnGhost} w-full sm:w-auto`}>
            {t('exploreProducts')}
          </Link>
        </div>
      </div>
    </section>
  );
}
