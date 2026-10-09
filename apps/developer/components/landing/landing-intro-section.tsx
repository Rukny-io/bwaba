import type { LandingCopy } from '@/lib/landing-copy';
import { agLayout } from '@/lib/ag-theme';

export function LandingIntroSection({ copy }: { copy: LandingCopy }) {
  return (
    <section
      className={`${agLayout.sectionMuted} py-20 sm:py-24 md:py-28`}
      aria-labelledby="landing-intro-heading"
    >
      <div className={agLayout.container}>
        <div className={`${agLayout.textStack} max-w-3xl`}>
          <p className={agLayout.eyebrow}>{copy.introEyebrow}</p>
          <h2 id="landing-intro-heading" className={agLayout.introTitle}>
            {copy.introHeadline}
          </h2>
          <p className={agLayout.introLead}>{copy.introLead}</p>
        </div>
      </div>
    </section>
  );
}
