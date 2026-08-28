"use client";

import { useEffect, useState } from "react";
import { cn } from "@heroui/react";

export interface MailTutorialTocItem {
  id: string;
  title: string;
  number: number;
}

export function MailTutorialDesktopToc({
  items,
  className,
}: {
  items: MailTutorialTocItem[];
  className?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) return;

    const handleScroll = () => {
      let current: string | null = null;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 140) {
          current = item.id;
        } else {
          break;
        }
      }
      setActiveId(current ?? items[0]?.id ?? null);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [items]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Table of contents"
      className={cn(
        "sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain pe-2 [scrollbar-width:thin]",
        className,
      )}
    >
      <p className="mb-4 text-[11px] font-semibold tracking-[0.08em] text-[#132327]/40">
        ON THIS PAGE
      </p>
      <ol className="space-y-1">
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => scrollTo(item.id)}
                className={cn(
                  "w-full rounded-lg px-2.5 py-1.5 text-start text-[13px] leading-snug transition-colors",
                  active
                    ? "bg-[#062c30]/[0.08] font-medium text-[#062c30]"
                    : "text-[#132327]/55 hover:bg-[#F6F7F8] hover:text-[#132327]",
                )}
              >
                <span className="tabular-nums">{item.number}.</span> {item.title}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
