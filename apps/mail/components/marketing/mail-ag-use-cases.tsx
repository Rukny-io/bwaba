"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { MailReveal } from "@/components/marketing/mail-reveal";
import { agLayout } from "@/lib/mail-antigravity-theme";

const USE_CASES = [
  {
    id: "business",
    label: "Small business",
    title: "Small business",
    description:
      "Build production-ready mail with confidence — domain authentication, branded addresses, and webmail included.",
    href: "/getting-started",
    gradient: "from-[#4285F4]/20 to-transparent",
  },
  {
    id: "teams",
    label: "Teams",
    title: "Growing teams",
    description:
      "Rukny Mail empowers the next era of team builders with mailboxes, aliases, and Agentic Mail drafts.",
    href: "/pricing",
    gradient: "from-[#EA4335]/20 to-transparent",
  },
  {
    id: "developers",
    label: "Developers",
    title: "Developers",
    description:
      "Streamline delivery with the Email API — automate transactional mail, webhooks, and logs.",
    href: "#developers",
    gradient: "from-[#34A853]/20 to-transparent",
  },
] as const;

export function MailAgUseCases() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  return (
    <section
      id="use-cases"
      data-landing-use-case-section=""
      className="landing-use-case-section overflow-hidden border-t border-[#E8E8E8] bg-[#FAFAFA] py-16 sm:py-20"
      aria-labelledby="ag-use-cases-heading"
    >
      <div className={`${agLayout.container} mb-10`}>
        <MailReveal>
          <h2
            id="ag-use-cases-heading"
            className={agLayout.sectionTitle}
          >
            Built for teams
            <span className="text-[#6B6F76]"> for the agent-first era</span>
          </h2>
        </MailReveal>
      </div>

      <div
        ref={scrollRef}
        className="landing-use-case-list flex gap-4 overflow-x-auto px-5 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {USE_CASES.map((item, i) => (
          <motion.article
            key={item.id}
            className="group w-[min(85vw,320px)] shrink-0 sm:w-[360px]"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
          >
            <div
              className={`relative aspect-[3/4] overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white bg-gradient-to-b ${item.gradient}`}
            >
              <div className="flex h-full flex-col justify-between p-6">
                <div>
                  <p className="text-[12px] font-medium text-[#6B6F76]">
                    {item.label}
                  </p>
                  <h3 className="mt-2 text-[1.25rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
                    {item.title}
                  </h3>
                </div>
                <button
                  type="button"
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E8E8E8] bg-white px-4 py-2 text-[13px] font-medium text-[#1D1D1D] transition-transform group-hover:scale-[1.02]"
                  aria-label={`Watch ${item.title} case`}
                >
                  <Play className="size-3.5 fill-current" aria-hidden />
                  Watch case
                </button>
              </div>
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-[#6B6F76]">
              {item.description}
            </p>
            <Link
              href={item.href}
              className="mt-2 inline-block text-[14px] font-medium text-[#1D1D1D] hover:underline"
            >
              View case
            </Link>
          </motion.article>
        ))}
      </div>

      <div className={`${agLayout.container} mt-6 flex gap-2`}>
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="inline-flex size-10 items-center justify-center rounded-full border border-[#E8E8E8] bg-white"
          aria-label="Previous"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          className="inline-flex size-10 items-center justify-center rounded-full border border-[#E8E8E8] bg-white"
          aria-label="Next"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </section>
  );
}
