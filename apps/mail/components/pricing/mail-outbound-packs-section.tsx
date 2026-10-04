"use client";

import Link from "next/link";
import { agLayout } from "@/lib/mail-antigravity-theme";
import {
  formatMailIqD,
  MAIL_OUTBOUND_PACK_EMAILS,
  MAIL_OUTBOUND_PACK_PRICE_IQD,
} from "@/lib/mail-plans";

const PACK_PLANS = [
  {
    id: "starter",
    name: "Starter packs",
    price: MAIL_OUTBOUND_PACK_PRICE_IQD.starter ?? 800,
  },
  {
    id: "professional",
    name: "Professional packs",
    price: MAIL_OUTBOUND_PACK_PRICE_IQD.professional ?? 800,
  },
] as const;

export function MailOutboundPacksSection() {
  return (
    <section
      id="outbound-packs"
      className="mt-14 sm:mt-16"
      aria-labelledby="mail-outbound-packs-heading"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className={agLayout.eyebrow}>Add-ons</p>
        <h2
          id="mail-outbound-packs-heading"
          className={`${agLayout.sectionTitle} mt-3 text-[clamp(1.35rem,4vw,2rem)]`}
        >
          Outbound email packs
          <span className="text-[#9CA3AF]"> when you need more</span>
        </h2>
        <p className={`${agLayout.lead} mx-auto mt-4 max-w-2xl`}>
          Starter and Professional include monthly sends. Add 1,000-email packs anytime
          without changing your mailbox plan.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-5xl">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PACK_PLANS.map((plan) => (
            <article
              key={plan.id}
              className="flex h-full flex-col rounded-[1.5rem] bg-[#FAFAFA] p-5 sm:p-6"
            >
              <p className="text-[15px] font-medium text-[#1D1D1D]">{plan.name}</p>
              <p className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-[#1D1D1D] sm:text-[2rem]">
                {formatMailIqD(plan.price)}
                <span className="text-[14px] font-medium text-[#9CA3AF]"> / pack</span>
              </p>
              <p className="mt-2 text-[14px] text-[#6B6F76]">
                {MAIL_OUTBOUND_PACK_EMAILS.toLocaleString("en-IQ")} emails per pack
              </p>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-[13px] leading-relaxed text-[#9CA3AF]">
          Free plan does not include outbound packs. Upgrade to Starter or Professional
          from your mail console billing settings.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/apps" className={agLayout.btnPrimary}>
            Open mail console
          </Link>
          <Link href="/pricing/estimate" className={agLayout.btnGhost}>
            Cost estimate
          </Link>
        </div>
      </div>
    </section>
  );
}
