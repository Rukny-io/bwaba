"use client"

import React, { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowUpRight, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react"
import { AuthFooter } from "@/components/auth/auth-footer"
import { AuthLoadingFallback } from "@/components/auth/auth-loading"
import { AuthSplitPage } from "@/components/auth/auth-split-page"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { resetPassword } from "@/lib/api"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const t = useTranslations("Auth")
  const token = searchParams.get("token") || ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const isValid =
    password.length >= 10 &&
    /[a-zA-Z]/.test(password) &&
    /\d/.test(password) &&
    password === confirm

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError(t("reset_invalid_token"))
      return
    }
    if (password !== confirm) {
      setError(t("password_mismatch"))
      return
    }
    if (!isValid) {
      setError(t("password_hint"))
      return
    }

    setError(null)
    setIsLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err: unknown) {
      const apiError = err as {
        status?: number
        data?: { message?: string }
        message?: string
      }
      if (apiError.status === 429) setError(t("rate_limit"))
      else
        setError(
          apiError.data?.message ||
            apiError.message ||
            t("reset_password_error"),
        )
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthSplitPage
        badge={t("reset_password_badge")}
        title={t("reset_invalid_title")}
        description={t("reset_invalid_desc")}
        showFooter={false}
      >
        <Link
          href="/forgot-password"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("request_new_reset")}
        </Link>
        <AuthFooter className="mt-8" />
      </AuthSplitPage>
    )
  }

  return (
    <AuthSplitPage
      badge={t("reset_password_badge")}
      title={t("reset_password_title")}
      description={t("reset_password_desc")}
      showFooter={false}
    >
      {done ? (
        <div className="space-y-4">
          <p
            className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900/90 dark:text-emerald-100/90"
            role="status"
          >
            {t("reset_password_success")}
          </p>
          <Link
            href="/login?mode=password"
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground"
          >
            {t("sign_in_password")}
            <ArrowUpRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              {t("new_password_label")}
            </label>
            <div className="auth-field flex h-12 items-center gap-2.5 overflow-hidden rounded-2xl border border-input/70 bg-background/80 px-3 backdrop-blur-sm transition-all focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/15 sm:h-11 sm:rounded-full">
              <KeyRound className="size-4 shrink-0 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("password_placeholder")}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                autoComplete="new-password"
                autoFocus
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-left text-sm outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={
                  showPassword ? t("hide_password") : t("show_password")
                }
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{t("password_hint")}</p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm"
              className="block text-sm font-medium text-foreground"
            >
              {t("confirm_password_label")}
            </label>
            <div className="auth-field flex h-12 items-center gap-2.5 overflow-hidden rounded-2xl border border-input/70 bg-background/80 px-3 backdrop-blur-sm transition-all focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/15 sm:h-11 sm:rounded-full">
              <KeyRound className="size-4 shrink-0 text-muted-foreground" />
              <input
                id="confirm"
                type={showPassword ? "text" : "password"}
                placeholder={t("password_placeholder")}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value)
                  setError(null)
                }}
                autoComplete="new-password"
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-left text-sm outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0"
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
            disabled={!isValid || isLoading}
            className={cn(
              "h-12 w-full rounded-full text-sm font-semibold transition-all sm:h-11",
              "bg-primary text-primary-foreground hover:opacity-95",
              "disabled:opacity-45",
            )}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("saving")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                {t("update_password")}
                <ArrowUpRight className="size-4 rtl:rotate-180" />
              </span>
            )}
          </Button>
        </form>
      )}

      <AuthFooter className="mt-8" />
    </AuthSplitPage>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
