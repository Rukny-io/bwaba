"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { MailReveal } from "@/components/marketing/mail-reveal";
import { agLayout } from "@/lib/mail-antigravity-theme";
import { useDragScroll } from "@/lib/use-drag-scroll";
import { cn } from "@/lib/utils";

const RESOURCES = [
  {
    title: "Getting started with your first domain",
    category: "Guide",
    href: "/getting-started",
  },
  {
    title: "Set up mailboxes and aliases",
    category: "Product",
    href: "/documents",
  },
  {
    title: "Send mail from your application",
    category: "Developers",
    href: "/developers",
  },
  {
    title: "Team access and console members",
    category: "Product",
    href: "/faqs",
  },
  {
    title: "Billing and plan limits",
    category: "Support",
    href: "/faqs",
  },
] as const;

const CATEGORY_STYLES: Record<string, string> = {
  Guide: "bg-[#F3F7FE] text-[#1D1D1D]",
  Product: "bg-[#FAFAFA] text-[#6B6F76]",
  Developers: "bg-[#F5F5F5] text-[#1D1D1D]",
  Support: "bg-[#FAFAFA] text-[#6B6F76]",
};

export function MailAgResourcesBand() {
  const { ref: scrollRef, isDragging } = useDragScroll<HTMLDivElement>({
    friction: 0.93,
  });

  const scroll = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 304, behavior: "smooth" });
  };

  return (
    <section
      className="border-t border-[#E8E8E8] bg-white"
      aria-labelledby="ag-resources-heading"
    >
      <div className={`${agLayout.container} ${agLayout.section}`}>
        <MailReveal className="flex items-end justify-between gap-4">
          <div>
            <h2
              id="ag-resources-heading"
              className="text-balance text-[clamp(1.5rem,3vw,1.75rem)] font-medium tracking-[-0.02em] text-[#1D1D1D]"
            >
              Guides and docs
            </h2>
            <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[#6B6F76]">
              Setup, sending, and team management — written for operators and
              developers.
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scroll(-1)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#1D1D1D] transition-colors hover:bg-[#FAFAFA]"
              aria-label="Scroll left"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#1D1D1D] transition-colors hover:bg-[#FAFAFA]"
              aria-label="Scroll right"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </MailReveal>

        <div className="relative mt-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent sm:w-12"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent sm:w-12"
          />

          <div
            ref={scrollRef}
            className={cn(
              "flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4",
              "touch-pan-y select-none",
              isDragging
                ? "cursor-grabbing snap-none scroll-auto"
                : "cursor-grab snap-x snap-mandatory scroll-smooth",
            )}
          >
            {RESOURCES.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                draggable={false}
                className="group flex w-[min(280px,78vw)] shrink-0 snap-start flex-col justify-between rounded-xl border border-[#E8E8E8] bg-white p-5 transition-[border-color,box-shadow] hover:border-[#D8D8D8] hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] sm:w-[288px] sm:min-h-[132px]"
              >
                <div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.Product}`}
                  >
                    {item.category}
                  </span>
                  <h3 className="mt-4 text-[15px] font-medium leading-snug tracking-[-0.01em] text-[#1D1D1D]">
                    {item.title}
                  </h3>
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-[#6B6F76] transition-colors group-hover:text-[#1D1D1D]">
                  Read
                  <ArrowRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            ))}
            <Link
              href="/documents"
              draggable={false}
              className="flex w-[min(200px,60vw)] shrink-0 snap-start items-center justify-center rounded-xl border border-dashed border-[#E8E8E8] bg-[#FAFAFA] px-5 text-[14px] font-medium text-[#6B6F76] transition-colors hover:border-[#D0D0D0] hover:text-[#1D1D1D] sm:w-[200px]"
            >
              View all docs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
