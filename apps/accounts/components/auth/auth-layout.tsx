"use client"

import React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { AuthBackground } from "@/components/auth/auth-background"
import { ThemeToggle } from "@/components/theme-toggle"
import { switchLocale } from "@/lib/switch-locale"
import { cn } from "@/lib/utils"

interface AuthLayoutProps {
  children: React.ReactNode
  className?: string
  showLogo?: boolean
  /** `split` — two-column full-page layout (login); `centered` — narrow centered column */
  variant?: "centered" | "split"
}

export function AuthLayout({
  children,
  className,
  showLogo = true,
  variant = "centered",
}: AuthLayoutProps) {
  const router = useRouter()
  const t = useTranslations("Auth")

  const toggleLocale = () => {
    const current = document.documentElement.lang || "ar"
    switchLocale(current, router)
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <AuthBackground />

      <header className="relative z-10 px-4 pt-4 md:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-2 py-3.5 sm:px-4">
          {showLogo ? (
            <div className="flex items-center gap-2.5">
              <Image
                src="/rukny-logo.svg"
                alt="Rukny"
                width={28}
                height={28}
                className="size-7"
                priority
              />
              <span className="text-base font-medium tracking-tight text-foreground/90 md:text-lg">
                {t("auth_brand")}
              </span>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-1">
            <ThemeToggle
              labelLight={t("theme_light")}
              labelDark={t("theme_dark")}
            />
            <button
              type="button"
              onClick={toggleLocale}
              className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              aria-label={t("language")}
            >
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
            <span>{t("language")}</span>
          </button>
          </div>
        </div>
      </header>

      <main
        className={cn(
          "relative z-10 flex flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-10 lg:py-12",
          variant === "split"
            ? "items-stretch"
            : "items-center justify-center",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full flex-col",
            variant === "split"
              ? "max-w-6xl justify-center lg:min-h-[min(32rem,calc(100dvh-10rem))]"
              : "max-w-[440px] items-center",
            className,
          )}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
