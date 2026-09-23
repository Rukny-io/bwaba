"use client";

import { MailProvidersMarquee } from "@/components/marketing/mail-providers-marquee";
import { MailReveal } from "@/components/marketing/mail-reveal";
import { cfLayout } from "@/lib/mail-cloudflare-theme";

export function MailHomeSocialBand() {
  return (
    <section className="border-y border-[#E4E4E7] bg-white" aria-labelledby="social-heading">
      <div className={`${cfLayout.container} py-12 md:py-14`}>
        <MailReveal>
          <p
            id="social-heading"
            className="text-center text-[15px] font-medium text-[#6B6F76]"
          >
            Rukny Mail powers teams who care about their brand
          </p>
          <p className="mt-1 text-center text-[13px] text-[#9CA3AF]">
            Trusted by the teams you trust.
          </p>
        </MailReveal>
      </div>

      <MailProvidersMarquee />

      <div className={`${cfLayout.container} py-14 md:py-16`}>
        <figure className="mx-auto max-w-3xl">
          <MailReveal>
            <blockquote className="rounded-3xl bg-[#F6F6F4] px-6 py-8 text-center sm:px-10 sm:py-10">
              <p className="text-[1.35rem] font-medium leading-snug tracking-[-0.02em] text-[#1D1D1D] sm:text-[1.65rem]">
                &ldquo;The real challenge isn&apos;t adding more tools — it&apos;s
                finding one simple way to look professional and scale.&rdquo;
              </p>
            </blockquote>
            <figcaption className="mt-5 text-center">
              <p className="text-[14px] font-semibold text-[#1D1D1D]">
                Small business owner
              </p>
              <p className="mt-1 text-[13px] text-[#6B6F76]">
                Switched from shared inboxes to Rukny Mail
              </p>
            </figcaption>
          </MailReveal>
        </figure>
      </div>
    </section>
  );
}
