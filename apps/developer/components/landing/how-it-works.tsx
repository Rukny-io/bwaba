import {
  DevReveal,
  DevStagger,
  DevStaggerItem,
} from '@/components/landing/dev-reveal';
import type { LandingCopy } from '@/lib/landing-copy';
import { agLayout } from '@/lib/ag-theme';

export function HowItWorks({ copy }: { copy: LandingCopy }) {
  return (
    <section className="bg-white py-20 sm:py-24 md:py-28">
      <div className={agLayout.container}>
        <DevReveal>
          <p className={agLayout.eyebrow}>{copy.howEyebrow}</p>
          <h2 className={`${agLayout.sectionTitle} mt-4`}>
            {copy.howTitle}
            <span className="text-[#9CA3AF]">{copy.howTitleMuted}</span>
          </h2>
        </DevReveal>

        <DevStagger
          className="mt-12 grid gap-4 sm:grid-cols-3 sm:gap-4"
          stagger={0.08}
        >
          {copy.howSteps.map((step, index) => (
            <DevStaggerItem key={step.n} index={index} as="div">
              <div className="rounded-[2rem] bg-[#FAFAFA] p-7 sm:p-8">
                <p className="select-none text-[clamp(2rem,4vw,2.75rem)] font-medium leading-none tracking-[-0.05em] text-[#EBEBEB]">
                  {step.n}
                </p>
                <h3 className="mt-5 text-[1.05rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[1.8] text-[#6B6F76]">
                  {step.desc}
                </p>
              </div>
            </DevStaggerItem>
          ))}
        </DevStagger>
      </div>
    </section>
  );
}
