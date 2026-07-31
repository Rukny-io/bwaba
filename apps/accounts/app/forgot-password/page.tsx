"use client"

import React, { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowUpRight, Loader2, Mail } from "lucide-react"
import { AuthFooter } from "@/components/auth/auth-footer"
import { AuthLoadingFallback } from "@/components/auth/auth-loading"
import { AuthSplitPage } from "@/components/auth/auth-split-page"
import { Button } from "@/components/ui/button"
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
          <p
            className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900/90 dark:text-emerald-100/90"
            role="status"
          >
            {t("forgot_password_sent")}
          </p>
          <Link
            href="/login?mode=password"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("back_to_login")}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              {t("email_label")}
            </label>
            <div className="auth-field flex h-12 items-center gap-2.5 overflow-hidden rounded-2xl border border-input/70 bg-background/80 px-3 backdrop-blur-sm transition-all focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/15 sm:h-11 sm:rounded-full">
              <Mail className="size-4 shrink-0 text-muted-foreground" />
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
                className="auth-email-input h-full min-w-0 flex-1 border-0 bg-transparent text-left text-sm outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                dir="ltr"
              />
            </div>
          </div>

          {error ? (
            <p
              className="rounded-xl bg-destructive/8 px-3 py-2 text-xs text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            disabled={!isValidEmail || isLoading}
            className={cn(
              "h-12 w-full rounded-full text-sm font-semibold transition-all sm:h-11",
              "bg-primary text-primary-foreground hover:opacity-95",
              "disabled:opacity-45",
            )}
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
          </Button>

          <Link
            href="/login?mode=password"
            className="block text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
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
