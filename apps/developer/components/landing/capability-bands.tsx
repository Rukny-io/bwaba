import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DevReveal } from '@/components/landing/dev-reveal';
import type { LandingCopy } from '@/lib/landing-copy';
import { agLayout, productTints } from '@/lib/ag-theme';

export function CapabilityBands({ copy }: { copy: LandingCopy }) {
  return (
    <section className={`${agLayout.sectionMuted} py-20 sm:py-24 md:py-28`}>
      <div className={agLayout.container}>
        <DevReveal>
          <p className={agLayout.eyebrow}>{copy.productsEyebrow}</p>
          <h2 className={`${agLayout.sectionTitle} mt-4`}>
            {copy.productsTitle}
            <span className="text-[#9CA3AF]">{copy.productsTitleMuted}</span>
          </h2>
        </DevReveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {copy.bands.map((band, index) => (
            <DevReveal key={band.title} delay={index * 0.06}>
              <article
                className={`flex h-full flex-col rounded-[2rem] p-7 sm:p-8 ${productTints[band.tint]}`}
              >
                <h3 className="text-[1.15rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                  {band.title}
                </h3>
                <p className="mt-2 flex-1 text-[14px] leading-[1.8] text-[#6B6F76]">
                  {band.desc}
                </p>
                <Link
                  href={band.href}
                  className="mt-6 inline-flex items-center gap-1 text-[14px] font-medium text-[#1D1D1D] transition-opacity hover:opacity-70"
                >
                  {band.cta}
                  <ArrowLeft
                    className="size-3.5 opacity-50 rtl:rotate-180"
                    aria-hidden
                  />
                </Link>
              </article>
            </DevReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
