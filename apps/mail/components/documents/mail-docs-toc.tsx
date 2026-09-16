"use client";

import { useEffect, useState } from "react";
import { cn } from "@heroui/react";

export type MailDocTocItem = {
  id: string;
  label: string;
};

export function MailDocsOnThisPage({ items }: { items: MailDocTocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id);

  useEffect(() => {
    setActiveId(items[0]?.id);
  }, [items]);

  useEffect(() => {
    if (!items.length) return;
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <aside className="hidden w-44 shrink-0 self-start xl:block">
      <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain [scrollbar-width:thin]">
        <p className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-[var(--muted-foreground)] uppercase">
          On this page
        </p>
        <nav className="flex flex-col border-s border-[var(--border)]" aria-label="On this page">
          {items.map((item) => {
            const active = activeId === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  "-ms-px border-s-2 py-1.5 ps-3 text-[13.5px] leading-5 transition-colors",
                  active
                    ? "border-[var(--foreground)] font-medium text-[var(--foreground)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                )}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
