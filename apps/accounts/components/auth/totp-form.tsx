"use client"

import React from "react"
import { AuthCardBackLink } from "@/components/auth/auth-card"
import { AuthVerificationForm } from "@/components/auth/auth-verification-form"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface TotpFormProps {
  mode: "authenticator" | "backup-code" | "whatsapp"
  onSubmit: (code: string) => Promise<void>
  onBack: () => void
  className?: string
  isSendingWhatsapp?: boolean
  onResendWhatsapp?: () => void
  showHeader?: boolean
  showBack?: boolean
}

export function TotpForm({
  mode,
  onSubmit,
  onBack,
  className,
  isSendingWhatsapp,
  onResendWhatsapp,
  showHeader = true,
  showBack = true,
}: TotpFormProps) {
  const t = useTranslations("Auth")

  const getTitle = () => {
    if (mode === "whatsapp") return t("enter_whatsapp_code")
    return mode === "authenticator" ? t("enter_auth_code") : t("enter_backup_code")
  }

  const getDescription = () => {
    if (mode === "whatsapp") return t("desc_whatsapp")
    return mode === "authenticator" ? t("desc_auth") : t("desc_backup")
  }

  return (
    <div className={cn("w-full", className)}>
      {showBack ? (
        <AuthCardBackLink onClick={onBack} label={t("back")} />
      ) : null}

      {showHeader ? (
        <div className="mb-6 text-center sm:mb-8">
          <h2 className="mb-2 text-2xl font-semibold text-foreground">
            {getTitle()}
          </h2>
          <p className="text-sm text-muted-foreground">{getDescription()}</p>
        </div>
      ) : null}

      <AuthVerificationForm
        mode={mode}
        onSubmit={onSubmit}
        isSendingWhatsapp={isSendingWhatsapp}
        onResendWhatsapp={onResendWhatsapp}
      />
    </div>
  )
}
