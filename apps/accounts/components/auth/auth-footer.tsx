"use client"

import React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface AuthFooterProps {
  className?: string
}

export function AuthFooter({ className }: AuthFooterProps) {
  const t = useTranslations("Auth")

  return (
    <footer
      className={cn(
        "flex items-center justify-center gap-1 text-xs text-muted-foreground",
        className,
      )}
    >
      <Link
        href="/terms"
        className="underline underline-offset-3 transition-colors hover:text-foreground"
      >
        {t("terms_of_service")}
      </Link>
      <span className="mx-2 opacity-40" aria-hidden>
        |
      </span>
      <Link
        href="/privacy"
        className="underline underline-offset-3 transition-colors hover:text-foreground"
      >
        {t("privacy_policy")}
      </Link>
    </footer>
  )
}
