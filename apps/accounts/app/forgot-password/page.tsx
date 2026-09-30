"use client"

import React, { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowUpRight, Loader2, Mail } from "lucide-react"
import { AuthFooter } from "@/components/auth/auth-footer"
import { AuthLoadingFallback } from "@/components/auth/auth-loading"
import { AuthSplitPage } from "@/components/auth/auth-split-page"
import {
  authAlertErrorClass,
  authAlertSuccessClass,
  authBtnPrimaryClass,
  authFieldShellClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
} from "@/components/auth/auth-ui"
import { cn } from "@/lib/utils"
import { forgotPassword } from "@/lib/api"

function ForgotPasswordContent() {
  const searchParams = useSearchParams()
  const t = useTranslations("Auth")
  const [email, setEmail] = useState(searchParams.get("email") || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const trimmedEmail = email.trim()
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail) return
    setError(null)
    setIsLoading(true)
    try {
      await forgotPassword(trimmedEmail)
      setSent(true)
    } catch (err: unknown) {
      const apiError = err as {
        status?: number
        data?: { message?: string }
        message?: string
      }
      if (apiError.status === 429) setError(t("rate_limit"))
      else
        setError(
          apiError.data?.message || apiError.message || t("send_error"),
        )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthSplitPage
      badge={t("forgot_password_badge")}
      title={t("forgot_password_title")}
      description={t("forgot_password_desc")}
      showFooter={false}
    >
      {sent ? (
        <div className="space-y-4">
          <p className={authAlertSuccessClass} role="status">
            {t("forgot_password_sent")}
          </p>
          <Link
            href="/login?mode=password"
            className={cn(authLinkClass, "inline-flex items-center gap-1")}
          >
            {t("back_to_login")}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="email" className={authLabelClass}>
              {t("email_label")}
            </label>
            <div className={authFieldShellClass}>
              <Mail className="size-4 shrink-0 text-[#9CA3AF]" />
              <input
                id="email"
                type="email"
                placeholder={t("email_placeholder")}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                autoComplete="email"
                autoFocus
                className={cn(authInputClass, "auth-email-input")}
                dir="ltr"
              />
            </div>
          </div>

          {error ? (
            <p className={authAlertErrorClass} role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!isValidEmail || isLoading}
            className={authBtnPrimaryClass}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("sending")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                {t("send_reset_link")}
                <ArrowUpRight className="size-4 rtl:rotate-180" />
              </span>
            )}
          </button>

          <Link
            href="/login?mode=password"
            className={cn(authLinkClass, "block text-center")}
          >
            {t("back_to_login")}
          </Link>
        </form>
      )}

      <AuthFooter className="mt-8" />
    </AuthSplitPage>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <ForgotPasswordContent />
    </Suspense>
  )
}
