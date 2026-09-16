"use client";

import { MailFrameLink } from "@/components/marketing/mail-frame-cta";
import { ChevronDown } from "lucide-react";
import { MAIL_FAQS } from "@/lib/mail-faqs";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

export function MailFaqsPage({ signedIn }: { signedIn: boolean }) {
  return (
    <main className="overflow-x-clip">
      <section className="border-b border-[#e8e8e8]">
        <div className={L.container}>
          <div className="max-w-screen-sm space-y-6 py-12 md:py-16">
            <p className={`mail-hero-enter ${L.heroBadge}`}>FAQs</p>
            <h1 className={`mail-hero-enter-delayed ${L.heroTitle}`}>
              Short answers
            </h1>
            <p className={`mail-hero-enter-delayed ${L.heroLead}`}>
              Quick answers about domains, mailboxes, and delivery.
            </p>
          </div>
        </div>
      </section>

      <section className={`${L.container} py-12 sm:py-16`}>
        <div className="overflow-hidden border border-[#e8e8e8] bg-white">
          {MAIL_FAQS.map((item) => (
            <details
              key={item.id}
              className="group border-b border-[#e8e8e8] last:border-b-0"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-5 py-5 text-left marker:content-none sm:px-6 sm:py-6 [&::-webkit-details-marker]:hidden">
                <span className="text-[1.05rem] font-semibold tracking-tight text-[#111111] sm:text-xl">
                  {item.question}
                </span>
                <ChevronDown
                  className="size-5 shrink-0 text-[#999999] transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="max-w-2xl px-5 pb-6 text-[15px] leading-[1.8] text-[#666666] sm:px-6">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-[#e8e8e8] pb-12 sm:pb-16 md:pb-[72px]">
        <div className={L.container}>
          <div className="border border-[#e8e8e8] bg-white px-6 py-12 text-center sm:px-12">
            <p className="max-w-sm mx-auto text-[15px] text-[#666666]">
              The rest lives in the product.
            </p>
            <div className="mt-6 flex justify-center">
              <MailFrameLink href={signedIn ? "/apps" : "/login"}>
                {signedIn ? "Open console" : "Start Building"}
              </MailFrameLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
