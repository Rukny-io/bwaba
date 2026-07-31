"use client"

import React, { useState, useEffect } from "react"
import { Loader2, Mail, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { status } from "@/lib/status-colors"
import { useTranslations } from "next-intl"

interface CheckEmailCardProps {
  email: string
  onResend: () => Promise<void>
  onTryOtherMethod: () => void
  className?: string
}

export function CheckEmailCard({
  email,
  onResend,
  onTryOtherMethod,
  className,
}: CheckEmailCardProps) {
  const RESEND_DELAY = 60
  const [countdown, setCountdown] = useState(RESEND_DELAY)
  const [canResend, setCanResend] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const t = useTranslations("Auth")

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleResend = async () => {
    if (!canResend || isResending) return
    setIsResending(true)
    try {
      await onResend()
      setResendSuccess(true)
      setCanResend(false)
      setCountdown(RESEND_DELAY)
      setTimeout(() => setResendSuccess(false), 3000)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className={cn("w-full space-y-5", className)}>
      <div className="auth-field flex h-12 items-center gap-2.5 overflow-hidden rounded-2xl border border-input/70 bg-background/80 px-3 backdrop-blur-sm sm:h-11 sm:rounded-full">
        <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" dir="ltr">
          {email}
        </p>
      </div>

      {resendSuccess ? (
        <p className={cn("text-center text-sm font-medium", status.successHint)} role="status">
          {t("resend_success")}
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleResend}
        disabled={!canResend || isResending}
        className={cn(
          "h-12 w-full rounded-full text-sm font-semibold sm:h-11",
          "border-border/60 bg-background/80 backdrop-blur-sm",
          "disabled:opacity-45",
        )}
      >
        {isResending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("sending")}
          </span>
        ) : canResend ? (
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="size-4" aria-hidden />
            {t("resend_link")}
          </span>
        ) : (
          t("resend_in", { seconds: countdown })
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onTryOtherMethod}
          className="cursor-pointer text-sm text-muted-foreground underline underline-offset-3 transition-colors hover:text-foreground"
        >
          {t("try_other_method")}
        </button>
      </div>
    </div>
  )
}
