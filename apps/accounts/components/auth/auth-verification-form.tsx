"use client"

import React, { useState } from "react"
import { Key, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { OtpCodeInput } from "@/components/manage/otp-code-input"
import {
  authAlertErrorClass,
  authBtnPrimaryClass,
  authFieldShellClass,
  authInputClass,
} from "@/components/auth/auth-ui"
import { cn } from "@/lib/utils"
import type { VerificationMethod } from "@/components/auth/method-chooser"

interface AuthVerificationFormProps {
  mode: Extract<VerificationMethod, "authenticator" | "backup-code">
  onSubmit: (code: string) => Promise<void>
  className?: string
}

export function AuthVerificationForm({
  mode,
  onSubmit,
  className,
}: AuthVerificationFormProps) {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations("Auth")

  const isOtpMode = mode === "authenticator"
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
        mode === "authenticator"
          ? t("authenticator_invalid")
          : t("backup_code_invalid"),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const title =
    mode === "authenticator"
      ? t("enter_auth_code")
      : t("enter_backup_code")

  return (
    <form onSubmit={handleSubmit} className={cn("w-full space-y-5", className)}>
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
        <div className={authFieldShellClass}>
          <Key className="size-4 shrink-0 text-[#9CA3AF]" aria-hidden />
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
            className={cn(authInputClass, "auth-email-input tracking-wide")}
            dir="ltr"
          />
        </div>
      )}

      {error ? (
        <p className={cn(authAlertErrorClass, "text-center")} role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className={authBtnPrimaryClass}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("verifying")}
          </span>
        ) : (
          t("continue")
        )}
      </button>
    </form>
  )
}
