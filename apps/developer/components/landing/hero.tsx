import Link from 'next/link';
import type { LandingCopy } from '@/lib/landing-copy';
import { agLayout } from '@/lib/ag-theme';

export function LandingHero({ copy }: { copy: LandingCopy }) {
  return (
    <section
      className="relative bg-transparent text-[#1D1D1D]"
      aria-labelledby="landing-hero-title"
    >
      <div className="mx-auto flex max-w-[820px] flex-col items-center px-5 pb-24 pt-14 text-center sm:px-8 sm:pb-32 sm:pt-16">
        <p className={`${agLayout.eyebrow} home-hero-enter`}>{copy.heroEyebrow}</p>

        <h1
          id="landing-hero-title"
          className={`${agLayout.heroTitle} home-hero-enter mt-5`}
        >
          <span className="block text-pretty">{copy.headline}</span>
          <span className="mt-1.5 block text-pretty text-[#9CA3AF] sm:mt-2">
            {copy.headlineMuted}
          </span>
        </h1>

        <p className="home-hero-enter-delayed mt-7 max-w-[34rem] text-pretty text-[17px] leading-[1.75] text-[#6B6F76] sm:mt-8">
          {copy.support}
        </p>

        <div className="home-hero-enter-delayed mt-10 flex w-full max-w-md flex-col gap-2.5 sm:mt-12 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
          <Link
            href="/login?next=/apps"
            className={`${agLayout.btnPrimary} w-full sm:w-auto`}
          >
            {copy.startFree}
          </Link>
          <Link
            href="/pricing"
            className={`${agLayout.btnSecondary} w-full sm:w-auto`}
          >
            {copy.pricing}
          </Link>
          <Link
            href="/documentation"
            className={`${agLayout.btnGhost} w-full sm:w-auto`}
          >
            {copy.docs}
          </Link>
        </div>
      </div>
    </section>
  );
}
