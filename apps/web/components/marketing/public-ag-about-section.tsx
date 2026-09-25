'use client';

import { useTranslations } from 'next-intl';
import { siteUrls } from '@/lib/site-urls';
import { agLayout } from '@/lib/public-antigravity-theme';

export function PublicAgAboutSection() {
  const t = useTranslations('home.about');
  const googleItems = t.raw('googleDataItems') as string[];

  return (
    <section
      id="about"
      className={`${agLayout.sectionMuted} ${agLayout.section}`}
      aria-labelledby="public-about-heading"
    >
      <div className={agLayout.container}>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-start">
            <p className={agLayout.eyebrow}>{t('eyebrow')}</p>
            <h2 id="public-about-heading" className={`${agLayout.sectionTitle} mt-4`}>
              {t('title')}
              <span className="text-[#9CA3AF]">{t('titleMuted')}</span>
            </h2>
            <p className={`${agLayout.lead} mt-5`}>{t('lead')}</p>
            <p className="mt-5 text-[13px] text-[#9CA3AF]">
              <a
                href={siteUrls.privacy}
                className="underline underline-offset-3 hover:text-[#1D1D1D]"
              >
                {t('privacy')}
              </a>
              {' · '}
              <a
                href={siteUrls.terms}
                className="underline underline-offset-3 hover:text-[#1D1D1D]"
              >
                {t('terms')}
              </a>
            </p>
          </div>

          <div className={agLayout.surface}>
            <h3
              id="what-is-rukny"
              className="text-base font-medium text-[#1D1D1D] sm:text-lg"
            >
              {t('whatIsTitle')}
            </h3>
            <p className="mt-3 text-[14px] leading-[1.8] text-[#6B6F76]">{t('whatIsBody')}</p>

            <h3
              id="google-data-use"
              className="mt-8 text-base font-medium text-[#1D1D1D] sm:text-lg"
            >
              {t('googleDataTitle')}
            </h3>
            <ul className="mt-3 space-y-2 text-[14px] leading-[1.75] text-[#6B6F76]">
              {googleItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-5 text-[13px] text-[#9CA3AF]">
              <a
                href={siteUrls.privacy}
                className="underline underline-offset-3 hover:text-[#1D1D1D]"
              >
                {t('privacy')}
              </a>
              {' · '}
              <a
                href={siteUrls.terms}
                className="underline underline-offset-3 hover:text-[#1D1D1D]"
              >
                {t('terms')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
