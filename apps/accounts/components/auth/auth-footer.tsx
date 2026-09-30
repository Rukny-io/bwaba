"use client"

import React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { authLinkClass } from "@/components/auth/auth-ui"
import { cn } from "@/lib/utils"

interface AuthFooterProps {
  className?: string
}

export function AuthFooter({ className }: AuthFooterProps) {
  const t = useTranslations("Auth")

  return (
    <footer
      className={cn(
        "flex items-center justify-center gap-1 text-[13px] text-[#9CA3AF]",
        className,
      )}
    >
      <Link href="/terms" className={authLinkClass}>
        {t("terms_of_service")}
      </Link>
      <span className="mx-2 opacity-40" aria-hidden>
        |
      </span>
      <Link href="/privacy" className={authLinkClass}>
        {t("privacy_policy")}
      </Link>
    </footer>
  )
}
