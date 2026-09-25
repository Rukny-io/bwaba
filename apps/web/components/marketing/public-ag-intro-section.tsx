'use client';

import { PublicTypedText } from '@/components/marketing/public-typed-text';
import { agLayout } from '@/lib/public-antigravity-theme';

const INTRO_HEADLINE = 'ركني — بيع، اجمع، وتابع من مكان واحد.';
const INTRO_LEAD =
  'متجر إلكتروني، نماذج ذكية، ملف شخصي، وتحليلات — بدون القفز بين أدوات مختلفة.';

export function PublicAgIntroSection() {
  return (
    <section
      dir="rtl"
      lang="ar"
      className={`${agLayout.sectionMuted} py-20 sm:py-24 md:py-28`}
      aria-labelledby="public-intro-heading"
    >
      <div className={agLayout.container}>
        <div className={`${agLayout.textStack} max-w-3xl`}>
          <p className={agLayout.eyebrow}>لماذا ركني</p>

          <PublicTypedText
            as="h2"
            id="public-intro-heading"
            text={INTRO_HEADLINE}
            speed={18}
            className={agLayout.introTitle}
          />

          <p className={agLayout.introLead}>{INTRO_LEAD}</p>
        </div>
      </div>
    </section>
  );
}
