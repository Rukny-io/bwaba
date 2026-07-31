"use client"

import React, { useState } from "react"
import { Key, Loader2, Mail } from "lucide-react"
import { useTranslations } from "next-intl"
import { OtpCodeInput } from "@/components/manage/otp-code-input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { VerificationMethod } from "@/components/auth/method-chooser"

interface AuthVerificationFormProps {
  mode: Extract<VerificationMethod, "authenticator" | "backup-code" | "whatsapp">
  onSubmit: (code: string) => Promise<void>
  className?: string
  isSendingWhatsapp?: boolean
  onResendWhatsapp?: () => void
}

export function AuthVerificationForm({
  mode,
  onSubmit,
  className,
  isSendingWhatsapp,
  onResendWhatsapp,
}: AuthVerificationFormProps) {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations("Auth")

  const isOtpMode = mode === "authenticator" || mode === "whatsapp"
  const isValid = isOtpMode ? code.length === 6 : code.trim().length >= 8

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setError(null)
    setIsLoading(true)
    try {
      await onSubmit(code.trim())
    } catch {
      setError(
        mode === "whatsapp"
          ? t("whatsapp_invalid")
          : mode === "authenticator"
            ? t("authenticator_invalid")
            : t("backup_code_invalid"),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const title =
    mode === "whatsapp"
      ? t("enter_whatsapp_code")
      : mode === "authenticator"
        ? t("enter_auth_code")
        : t("enter_backup_code")

  return (
    <form onSubmit={handleSubmit} className={cn("w-full space-y-4", className)}>
      {isOtpMode ? (
        <OtpCodeInput
          value={code}
          onChange={(value) => {
            setCode(value)
            setError(null)
          }}
          disabled={isLoading}
          aria-label={title}
          aria-invalid={!!error}
        />
      ) : (
        <div className="auth-field flex h-12 items-center gap-2.5 overflow-hidden rounded-2xl border border-input/70 bg-background/80 px-3 backdrop-blur-sm transition-all focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/15 sm:h-11 sm:rounded-full">
          <Key className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              setError(null)
            }}
            placeholder="xxxxxxxx-xxxx"
            autoComplete="one-time-code"
            aria-label={title}
            aria-invalid={!!error}
            autoFocus
            className="auth-email-input h-full min-w-0 flex-1 border-0 bg-transparent text-left text-sm tracking-wide outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0"
            dir="ltr"
          />
        </div>
      )}

      {error ? (
        <p className="rounded-xl bg-destructive/8 px-3 py-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={!isValid || isLoading}
        className="h-12 w-full rounded-full text-sm font-semibold sm:h-11"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("verifying")}
          </span>
        ) : (
          t("continue")
        )}
      </Button>

      {mode === "whatsapp" && onResendWhatsapp ? (
        <div className="text-center">
          <button
            type="button"
            onClick={onResendWhatsapp}
            disabled={isSendingWhatsapp}
            className="cursor-pointer text-sm font-medium text-foreground underline underline-offset-3 transition-colors hover:text-primary disabled:opacity-50"
          >
            {isSendingWhatsapp ? t("whatsapp_resending") : t("whatsapp_didnt_receive")}
          </button>
        </div>
      ) : null}
    </form>
  )
}
