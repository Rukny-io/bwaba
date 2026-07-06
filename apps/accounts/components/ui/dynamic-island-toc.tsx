"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type HeadingData = {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
};

function slugifyHeading(text: string, index: number): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug || /^-+$/.test(slug)) {
    return `toc-heading-${index}`;
  }

  return slug;
}

function ensureUniqueHeadingId(el: HTMLElement, index: number, usedIds: Set<string>): string {
  if (el.id && !usedIds.has(el.id)) {
    usedIds.add(el.id);
    return el.id;
  }

  const source = el.getAttribute("data-toc-title") || el.textContent || "";
  let base = slugifyHeading(source, index);
  let id = base;
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${base}-${suffix++}`;
  }

  el.id = id;
  usedIds.add(id);
  return id;
}

const islandTransition: Transition = {
  type: "tween",
  ease: [0.22, 1, 0.36, 1],
  duration: 0.5,
};

function CircleProgress({ percentage }: { percentage: number }) {
  const size = 24;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--muted)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--foreground)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        strokeLinecap="round"
      />
    </svg>
  );
}

type DynamicIslandTOCProps = {
  children?: ReactNode;
  selector?: string;
};

export function DynamicIslandTOC({
  children,
  selector = "article h1, article h2, article h3, article h4, .prose h1, .prose h2, .prose h3, .prose h4, [data-toc]",
}: DynamicIslandTOCProps) {
  const [headings, setHeadings] = useState<HeadingData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isRtl, setIsRtl] = useState(false);

  useEffect(() => {
    setIsRtl(document.documentElement.dir.toLowerCase().startsWith("rtl"));
  }, []);

  useEffect(() => {
    const getHeadings = () => {
      const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];

      const usedIds = new Set<string>();

      const validHeadings = elements
        .filter((el) => !el.hasAttribute("data-toc-ignore"))
        .map((el, index) => {
          const id = ensureUniqueHeadingId(el, index, usedIds);

          const depthAttr = el.getAttribute("data-toc-depth");
          let level = 2;

          if (depthAttr) {
            level = Number.parseInt(depthAttr, 10);
          } else {
            const tagName = el.tagName.toUpperCase();
            if (tagName.startsWith("H") && tagName.length === 2) {
              level = Number.parseInt(tagName[1], 10);
            }
          }

          const text = el.getAttribute("data-toc-title") || el.textContent || "Section";

          return { id, text, level, element: el };
        });

      validHeadings.sort((a, b) =>
        a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );

      setHeadings(validHeadings);
    };

    const timer = setTimeout(getHeadings, 100);
    return () => clearTimeout(timer);
  }, [selector]);

  useEffect(() => {
    const handleScroll = () => {
      let currentActiveId: string | null = null;
      for (const heading of headings) {
        const top = heading.element.getBoundingClientRect().top;
        if (top <= 120) {
          currentActiveId = heading.id;
        } else {
          break;
        }
      }

      if (!currentActiveId && headings.length > 0) {
        currentActiveId = headings[0].id;
      }

      setActiveId(currentActiveId);

      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  const activeHeading = headings.find((h) => h.id === activeId);

  const minLevel = useMemo(() => {
    if (headings.length === 0) return 1;
    return Math.min(...headings.map((h) => h.level));
  }, [headings]);

  return (
    <>
      {children}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={islandTransition}
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[4px]"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-[30px] left-1/2 z-[9999] flex -translate-x-1/2 flex-col items-center"
      >
        <motion.div
          onClick={() => {
            if (!isExpanded) setIsExpanded(true);
          }}
          initial={false}
          animate={{
            width: isExpanded ? 340 : 280,
            height: isExpanded ? 400 : 52,
          }}
          transition={islandTransition}
          style={{ cursor: isExpanded ? "default" : "pointer" }}
          className={cn(
            "relative overflow-hidden border border-foreground/10 bg-background text-foreground shadow-2xl",
            isExpanded ? "rounded-4xl" : "rounded-2xl",
          )}
        >
          <motion.div
            initial={false}
            animate={{
              opacity: isExpanded ? 0 : 1,
              scale: isExpanded ? 0.95 : 1,
              filter: isExpanded ? "blur(4px)" : "blur(0px)",
            }}
            transition={{ ...islandTransition, delay: isExpanded ? 0 : 0.1 }}
            className={cn("absolute inset-0 flex items-center gap-4 px-4 sm:px-5", isExpanded && "pointer-events-none")}
          >
            <div className="h-2 w-2 shrink-0 rounded-full bg-foreground" />

            <div className={cn("relative flex h-full flex-1 items-center overflow-hidden", isRtl ? "text-right" : "text-left")}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={activeId || "empty"}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-foreground"
                >
                  {activeHeading?.text || (isRtl ? "المحتويات" : "Contents")}
                </motion.span>
              </AnimatePresence>
            </div>

            <CircleProgress percentage={progress} />
          </motion.div>

          <motion.div
            initial={false}
            animate={{
              opacity: isExpanded ? 1 : 0,
              scale: isExpanded ? 1 : 1.05,
            }}
            transition={{ ...islandTransition, delay: isExpanded ? 0.1 : 0 }}
            className={cn("absolute inset-0 flex flex-col", !isExpanded && "pointer-events-none")}
          >
            <div className="flex shrink-0 items-center justify-between px-6 pb-3 pt-5">
              <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
                {isRtl ? "جدول المحتويات" : "TABLE OF CONTENTS"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              data-lenis-prevent="true"
            >
              <div className="flex flex-col gap-0.5">
                {headings.map((h) => {
                  const isActive = activeId === h.id;
                  const isHovered = hoveredId === h.id;
                  const indentLevel = Math.max(0, h.level - minLevel);
                  const sidePadding = indentLevel * 14 + 12;

                  return (
                    <button
                      key={h.id}
                      onMouseEnter={() => setHoveredId(h.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        const yOffset = -80;
                        const y = h.element.getBoundingClientRect().top + window.scrollY + yOffset;
                        window.scrollTo({ top: y, behavior: "smooth" });
                        setIsExpanded(false);
                      }}
                      style={
                        isRtl
                          ? { paddingRight: `${sidePadding}px`, paddingLeft: "12px" }
                          : { paddingLeft: `${sidePadding}px`, paddingRight: "12px" }
                      }
                      className={cn(
                        "group flex w-full shrink-0 cursor-pointer items-center rounded-2xl border-none py-2 text-sm transition-all duration-300 ease-out",
                        isRtl ? "text-right" : "text-left",
                        isActive && "bg-foreground/10 font-medium text-foreground",
                        !isActive && isHovered && "bg-foreground/5 text-foreground/85",
                        !isActive && !isHovered && "bg-transparent text-foreground/45",
                      )}
                    >
                      <span
                        className={cn(
                          "flex-1 overflow-hidden text-ellipsis whitespace-nowrap transition-transform duration-300",
                          isRtl ? "group-hover:-translate-x-1" : "group-hover:translate-x-1",
                        )}
                      >
                        {h.text}
                      </span>

                      <motion.div
                        initial={false}
                        animate={{ scale: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={cn("h-1.5 w-1.5 shrink-0 rounded-full bg-foreground", isRtl ? "mr-3" : "ml-3")}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
}
