"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { MAIL_FAQS } from "@/lib/mail-faqs";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

export function MailFaqsPage({ signedIn }: { signedIn: boolean }) {
  return (
    <main className="overflow-x-clip pt-14">
      <section className={L.heroPad}>
        <div className="mx-auto flex max-w-6xl flex-col items-center">
          <p className={`mail-hero-enter ${L.heroBadge}`}>FAQs</p>
          <h1 className={`mail-hero-enter-delayed mt-5 ${L.heroTitle}`}>
            Short answers
            <span className="mt-2 block text-[#02797E]">No manual</span>
          </h1>
        </div>
      </section>

      <section className={`${L.container} pb-8`}>
        <div className="overflow-hidden rounded-2xl border border-[#E8ECF0] bg-white sm:rounded-3xl">
          {MAIL_FAQS.map((item) => (
            <details
              key={item.id}
              className="group border-b border-[#E8ECF0] last:border-b-0"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-5 py-5 text-left marker:content-none sm:px-6 sm:py-6 [&::-webkit-details-marker]:hidden">
                <span className="text-[1.05rem] font-semibold tracking-tight text-[#132327] sm:text-xl">
                  {item.question}
                </span>
                <ChevronDown
                  className="size-5 shrink-0 text-[#132327]/40 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="max-w-2xl px-5 pb-6 text-[15px] leading-[1.8] text-[#132327]/55 sm:px-6">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="pb-12 sm:pb-16 md:pb-[72px]">
        <div className={L.container}>
          <div className="flex flex-col items-center gap-5 rounded-[34px] border border-[#E8ECF0] bg-white/80 px-6 py-12 text-center sm:px-12">
            <p className="max-w-sm text-[15px] text-[#132327]/55">
              The rest lives in the product.
            </p>
            <Link
              href={signedIn ? "/apps" : "/login"}
              className={L.btnPrimary}
            >
              {signedIn ? "Open console" : "Get started"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
