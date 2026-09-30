"use client"

import React from "react"
import { AuthCardBackLink } from "@/components/auth/auth-card"
import { AuthVerificationForm } from "@/components/auth/auth-verification-form"
import { authLeadClass, authTitleClass } from "@/components/auth/auth-ui"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface TotpFormProps {
  mode: "authenticator" | "backup-code"
  onSubmit: (code: string) => Promise<void>
  onBack: () => void
  className?: string
  showHeader?: boolean
  showBack?: boolean
}

export function TotpForm({
  mode,
  onSubmit,
  onBack,
  className,
  showHeader = true,
  showBack = true,
}: TotpFormProps) {
  const t = useTranslations("Auth")

  const title =
    mode === "authenticator" ? t("enter_auth_code") : t("enter_backup_code")

  const description =
    mode === "authenticator" ? t("desc_auth") : t("desc_backup")

  return (
    <div className={cn("w-full", className)}>
      {showBack ? (
        <div className="mb-5 flex justify-center">
          <AuthCardBackLink onClick={onBack} label={t("back")} />
        </div>
      ) : null}

      {showHeader ? (
        <div className="mb-6 text-center sm:mb-8">
          <h2 className={cn(authTitleClass, "mb-2")}>{title}</h2>
          <p className={authLeadClass}>{description}</p>
        </div>
      ) : null}

      <AuthVerificationForm mode={mode} onSubmit={onSubmit} />
    </div>
  )
}
