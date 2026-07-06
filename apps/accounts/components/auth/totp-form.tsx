"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface TotpFormProps {
  mode: "authenticator" | "backup-code" | "whatsapp"
  onSubmit: (code: string) => Promise<void>
  onBack: () => void
  className?: string
  isSendingWhatsapp?: boolean
  onResendWhatsapp?: () => void
}

export function TotpForm({ mode, onSubmit, onBack, className, isSendingWhatsapp, onResendWhatsapp }: TotpFormProps) {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations("Auth")

  const isAuthenticator = mode === "authenticator"
  const isWhatsapp = mode === "whatsapp"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setError(null)
    setIsLoading(true)
    try {
      await onSubmit(code.trim())
    } catch (err) {
      setError(
        isWhatsapp
          ? t("whatsapp_invalid")
          : isAuthenticator
          ? t("authenticator_invalid")
          : t("backup_code_invalid")
      )
    } finally {
      setIsLoading(false)
    }
  }

  const getTitle = () => {
    if (isWhatsapp) return t("enter_whatsapp_code")
    return isAuthenticator ? t("enter_auth_code") : t("enter_backup_code")
  }

  const getDescription = () => {
    if (isWhatsapp) return t("desc_whatsapp")
    return isAuthenticator
      ? t("desc_auth")
      : t("desc_backup")
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-4 rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        {t("back")}
      </button>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          {getTitle()}
        </h1>
        <p className="text-sm text-muted-foreground">
          {getDescription()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type={isAuthenticator || isWhatsapp ? "text" : "text"}
          inputMode={isAuthenticator || isWhatsapp ? "numeric" : "text"}
          pattern={isAuthenticator || isWhatsapp ? "[0-9]{6}" : undefined}
          maxLength={isAuthenticator || isWhatsapp ? 6 : 20}
          placeholder={isAuthenticator || isWhatsapp ? "000000" : "xxxxxxxx-xxxx"}
          value={code}
          onChange={(e) => {
            const val = isAuthenticator || isWhatsapp
              ? e.target.value.replace(/\D/g, "").slice(0, 6)
              : e.target.value
            setCode(val)
            setError(null)
          }}
          className={cn(
            "text-center tracking-[0.3em] text-lg font-medium",
            error && "border-destructive focus-visible:ring-destructive/20"
          )}
          autoComplete="one-time-code"
          aria-label={getTitle()}
          aria-invalid={!!error}
          autoFocus
        />

        {error && (
          <p className="text-xs text-destructive text-center" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={!code.trim() || isLoading || (isAuthenticator || isWhatsapp ? code.length !== 6 : code.length < 8)}
          className="w-full h-12 rounded-full bg-primary text-primary-foreground text-base font-medium"
        >
          {isLoading ? t("verifying") : t("continue")}
        </Button>
      </form>

      {isWhatsapp && onResendWhatsapp && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onResendWhatsapp}
            disabled={isSendingWhatsapp}
            className="text-sm text-foreground hover:underline font-medium disabled:opacity-50 cursor-pointer"
          >
            {isSendingWhatsapp ? t("whatsapp_resending") : t("whatsapp_didnt_receive")}
          </button>
        </div>
      )}
    </div>
  )
}
