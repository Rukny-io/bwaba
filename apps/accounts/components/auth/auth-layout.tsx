"use client"
import React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useLocale } from "next-intl"

interface AuthLayoutProps {
  children: React.ReactNode
  className?: string
  showLogo?: boolean
}

export function AuthLayout({
  children,
  className,
  showLogo = true,
}: AuthLayoutProps) {
  const locale = useLocale()
  
  const toggleLocale = () => {
    const nextLocale = locale === "ar" ? "en" : "ar"
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-4 md:px-6 pt-4">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-3.5 flex items-center justify-between">
        {showLogo ? (
          <div className="flex items-center gap-3">
            <div className="size-10  flex items-center justify-center">
              <Image
                src="/rukny-logo.svg"
                alt="Rukny Logo"
                width={24}
                height={24}
                className="size-6"
                priority
              />
            </div>
            <span className="text-base md:text-lg font-semibold text-foreground tracking-tight">
              accounts
            </span>
          </div>
        ) : <div />}

        <button 
          onClick={toggleLocale}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-border/70 bg-background/80 hover:bg-accent text-foreground text-sm font-medium transition-colors cursor-pointer"
          aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
        >
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span className="mb-0.5">{locale === 'ar' ? 'English' : 'العربية'}</span>
        </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div
          className={cn(
            "w-full max-w-[420px] flex flex-col items-center",
            className
          )}
        >
          {children}
        </div>
      </main>
    </div>
  )
}

