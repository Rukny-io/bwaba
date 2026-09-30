"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { authScopeClass } from "@/components/auth/auth-ui"
import { agLayout } from "@/lib/accounts-antigravity-theme"
import { switchLocale } from "@/lib/switch-locale"
import { cn } from "@/lib/utils"

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
  const router = useRouter()
  const t = useTranslations("Auth")

  const toggleLocale = () => {
    const current = document.documentElement.lang || "ar"
    switchLocale(current, router)
  }

  return (
    <div
      className={cn(
        authScopeClass,
        "relative flex min-h-dvh flex-col overflow-hidden bg-white text-[#1D1D1D]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(66,133,244,0.07), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(52,168,83,0.05), transparent 50%), radial-gradient(ellipse 50% 35% at 0% 20%, rgba(234,67,53,0.04), transparent 45%)",
        }}
      />

      <header className="relative z-10">
        <div
          className={cn(
            agLayout.container,
            "flex h-16 items-center justify-between",
          )}
        >
          {showLogo ? (
            <Link
              href="/login"
              className="flex items-center gap-2.5 text-[1.1rem] font-medium tracking-[-0.03em] text-[#1D1D1D] transition-opacity hover:opacity-80"
            >
              <Image
                src="/rukny-logo.svg"
                alt=""
                width={28}
                height={28}
                className="size-7"
                priority
              />
              {t("auth_brand")}
            </Link>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={toggleLocale}
            className={agLayout.btnGhost}
            aria-label={t("language")}
          >
            {t("language")}
          </button>
        </div>
      </header>

      <main
        className="relative z-10 flex flex-1 items-center justify-center px-5 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] sm:py-16"
      >
        <div
          className={cn(
            "flex w-full max-w-[420px] flex-col items-center",
            className,
          )}
        >
          {children}
        </div>
      </main>

      <footer className="relative z-10 pb-8 text-center">
        <p className="text-[13px] text-[#9CA3AF]">{t("auth_shell_tagline")}</p>
      </footer>
    </div>
  )
}
