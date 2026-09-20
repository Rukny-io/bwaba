"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export type LegalNavGroup = {
  label: string
  items: { id: string; label: string }[]
}

interface LegalSidebarProps {
  productTitle: string
  groups: LegalNavGroup[]
  isEn: boolean
}

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - 72
  window.scrollTo({ top: y, behavior: "smooth" })
}

export function LegalSidebar({ productTitle, groups, isEn }: LegalSidebarProps) {
  const [activeId, setActiveId] = useState(groups[0]?.items[0]?.id ?? null)

  const flatItems = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups],
  )

  useEffect(() => {
    if (!flatItems.length) return
    const handleScroll = () => {
      let current: string | null = null
      for (const item of flatItems) {
        const el = document.getElementById(item.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= 96) current = item.id
        else break
      }
      setActiveId(current ?? flatItems[0]?.id ?? null)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [flatItems])

  const navGroups = (
    <nav
      className="flex flex-col gap-5"
      aria-label={isEn ? `${productTitle} sections` : `أقسام ${productTitle}`}
    >
      {groups.map((group) => (
        <div key={group.label} className="min-w-0">
          <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted-foreground)]">
            {group.label}
          </p>
          <div className="flex flex-col border-s border-[var(--border)] ps-px">
            {group.items.map((item) => {
              const active = activeId === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToId(item.id)}
                  className={cn(
                    "-ms-px border-s-2 py-1 ps-3 pe-2 text-start text-[13px] leading-5 transition-colors",
                    active
                      ? "border-[var(--foreground)] font-medium text-[var(--foreground)]"
                      : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]",
                  )}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain pe-2 sm:top-[3.75rem] sm:max-h-[calc(100dvh-3.75rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <p className="mb-4 px-3 text-[13px] font-semibold text-[var(--foreground)]">
          {productTitle}
        </p>
        {navGroups}
        <div className="mt-6 border-t border-[var(--border)] pt-3">
          <Link
            href="/login"
            className="block px-3 text-[12.5px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            {isEn ? "Back to sign in" : "العودة لتسجيل الدخول"}
          </Link>
        </div>
      </div>
    </aside>
  )
}
