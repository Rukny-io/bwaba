"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export interface LegalTocItem {
  id: string
  title: string
  number: number
}

interface LegalDesktopTocProps {
  items: LegalTocItem[]
  isEn: boolean
  className?: string
}

export function LegalDesktopToc({ items, isEn, className }: LegalDesktopTocProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)

  useEffect(() => {
    if (items.length === 0) return

    const handleScroll = () => {
      let current: string | null = null
      for (const item of items) {
        const el = document.getElementById(item.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= 140) {
          current = item.id
        } else {
          break
        }
      }
      setActiveId(current ?? items[0]?.id ?? null)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [items])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - 96
    window.scrollTo({ top: y, behavior: "smooth" })
  }

  return (
    <nav
      aria-label={isEn ? "Table of contents" : "جدول المحتويات"}
      className={cn(
        "sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain pe-2 [scrollbar-width:thin]",
        className,
      )}
    >
      <p className="mb-4 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
        {isEn ? "TABLE OF CONTENTS" : "المحتويات"}
      </p>
      <ol className="space-y-1">
        {items.map((item) => {
          const active = activeId === item.id
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => scrollTo(item.id)}
                className={cn(
                  "w-full rounded-lg px-2.5 py-1.5 text-start text-[13px] leading-snug transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <span className="tabular-nums">{item.number}.</span> {item.title}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
