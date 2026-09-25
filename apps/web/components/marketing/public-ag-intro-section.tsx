'use client';

import { useTranslations } from 'next-intl';
import { PublicTypedText } from '@/components/marketing/public-typed-text';
import { agLayout } from '@/lib/public-antigravity-theme';

export function PublicAgIntroSection() {
  const t = useTranslations('home.intro');

  return (
    <section
      className={`${agLayout.sectionMuted} py-20 sm:py-24 md:py-28`}
      aria-labelledby="public-intro-heading"
    >
      <div className={agLayout.container}>
        <div className={`${agLayout.textStack} max-w-3xl`}>
          <p className={agLayout.eyebrow}>{t('eyebrow')}</p>

          <PublicTypedText
            as="h2"
            id="public-intro-heading"
            text={t('headline')}
            speed={18}
            className={agLayout.introTitle}
          />

          <p className={agLayout.introLead}>{t('lead')}</p>
        </div>
      </div>
    </section>
  );
}
