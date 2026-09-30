"use client"

import React, { useState, useEffect } from "react"
import { Loader2, Mail, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import {
  authAlertSuccessClass,
  authBtnSecondaryClass,
  authLinkClass,
} from "@/components/auth/auth-ui"

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
      <div className="space-y-2">
        <p className="text-center text-[12px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">
          {t("check_email_sent_to")}
        </p>

        <div
          className="flex w-full min-h-[3.5rem] items-center gap-3 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] px-4 py-3.5"
          dir="ltr"
        >
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#6B6F76] ring-1 ring-[#E8E8E8]"
            aria-hidden
          >
            <Mail className="size-4" />
          </span>

          <span
            className="min-w-0 flex-1 truncate text-left text-[15px] font-medium leading-snug text-[#1D1D1D]"
            title={email}
          >
            {email}
          </span>
        </div>
      </div>

      {resendSuccess ? (
        <p className={cn(authAlertSuccessClass, "text-center")} role="status">
          {t("resend_success")}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleResend}
        disabled={!canResend || isResending}
        className={authBtnSecondaryClass}
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
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onTryOtherMethod}
          className={cn(authLinkClass, "underline underline-offset-3")}
        >
          {t("try_other_method")}
        </button>
      </div>
    </div>
  )
}
