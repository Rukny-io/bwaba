"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
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
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeId, setActiveId] = useState(groups[0]?.items[0]?.id ?? null)

  const flatItems = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups],
  )

  const currentLabel = useMemo(() => {
    const match = flatItems.find((item) => item.id === activeId)
    return match?.label ?? productTitle
  }, [activeId, flatItems, productTitle])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

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

  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [mobileOpen])

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
                  onClick={() => {
                    scrollToId(item.id)
                    setMobileOpen(false)
                  }}
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
    <>
      <div className="sticky top-14 z-30 -mx-5 mb-6 border-b border-[var(--border)] bg-[var(--background)]/90 px-5 backdrop-blur-md sm:top-[3.75rem] sm:-mx-6 sm:px-6 lg:hidden">
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="legal-mobile-nav"
          onClick={() => setMobileOpen((value) => !value)}
          className="flex h-12 w-full items-center justify-between gap-3"
        >
          <span className="min-w-0 text-start">
            <span className="block truncate text-[11px] text-[var(--muted-foreground)]">
              {productTitle}
            </span>
            <span className="block truncate text-[14px] font-semibold text-[var(--foreground)]">
              {currentLabel}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-[var(--muted-foreground)] transition-transform duration-200",
              mobileOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        {mobileOpen ? (
          <div
            id="legal-mobile-nav"
            className="max-h-[min(65vh,24rem)] overflow-y-auto overscroll-contain border-t border-[var(--border)] pb-4 pt-3"
          >
            <p className="mb-4 px-3 text-[13px] font-semibold text-[var(--foreground)]">
              {productTitle}
            </p>
            {navGroups}
            <div className="mt-6 border-t border-[var(--border)] pt-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 text-[12.5px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                {isEn ? "Back to sign in" : "العودة لتسجيل الدخول"}
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {mobileOpen ? (
        <button
          type="button"
          aria-label={isEn ? "Close menu" : "إغلاق القائمة"}
          className="fixed inset-0 z-20 bg-[color-mix(in_srgb,var(--foreground)_12%,transparent)] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

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
    </>
  )
}
