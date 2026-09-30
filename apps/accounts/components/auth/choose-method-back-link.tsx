"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { useTranslations } from "next-intl"
import { authLinkClass } from "@/components/auth/auth-ui"
import { cn } from "@/lib/utils"

export function ChooseMethodBackLink({ className }: { className?: string }) {
  const t = useTranslations("Auth")

  return (
    <Link
      href="/choose-method"
      className={cn(
        authLinkClass,
        "inline-flex items-center gap-1.5 font-medium",
        className,
      )}
    >
      <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
      {t("try_other_method")}
    </Link>
  )
}
