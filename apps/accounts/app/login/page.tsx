"use client"

import React, { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
} from "lucide-react"
import { AuthFooter } from "@/components/auth/auth-footer"
import { AuthLoadingFallback } from "@/components/auth/auth-loading"
import { AuthOAuthButtons, type OAuthProviderId } from "@/components/auth/auth-oauth"
import { AuthSplitPage } from "@/components/auth/auth-split-page"
import { getEnabledLoginOAuthProviders } from "@/lib/auth/oauth-providers"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  loginWithPassword,
  registerWithPassword,
  requestMagicLink,
  saveProfileOAuthHint,
  redirectToAppCallback,
} from "@/lib/api"
import {
  clearOAuthHash,
  readOAuthCallbackParams,
} from "@/lib/oauth-callback"
import { getRedirectUrlByRole, getSafeRedirectUrl } from "@/lib/redirect"

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

type AuthMode = "sso" | "password"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("Auth")
  const nextParam = searchParams.get("next")
  const sessionFlag = searchParams.get("session")
  const oauthError = searchParams.get("error")
  const oauthMessage = searchParams.get("message")
  const modeParam = searchParams.get("mode")
  const [mode, setMode] = useState<AuthMode>(
    modeParam === "password" ? "password" : "sso",
  )
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedEmail = email.trim()
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
  const hasOAuthProviders = getEnabledLoginOAuthProviders().length > 0
  const canSubmitPassword =
    isValidEmail &&
    password.length >= (isRegister ? 10 : 1) &&
    !isLoading

  const sessionMessage =
    sessionFlag === "expired" || sessionFlag === "invalid"
      ? t("session_expired")
      : null

  const oauthErrorMessage =
    oauthError === "github"
      ? oauthMessage || t("oauth_github_error")
      : oauthError
        ? oauthMessage || t("oauth_external_error")
        : null

  useEffect(() => {
    const { code, next: hashNext } = readOAuthCallbackParams(searchParams)
    if (!code) return

    clearOAuthHash()
    const callback = new URL("/callback", window.location.origin)
    callback.searchParams.set("code", code)
    if (hashNext) callback.searchParams.set("next", hashNext)
    else if (nextParam) callback.searchParams.set("next", nextParam)
    router.replace(callback.pathname + callback.search)
  }, [router, searchParams, nextParam])

  useEffect(() => {
    setMode(modeParam === "password" ? "password" : "sso")
  }, [modeParam])

  const switchMode = (nextMode: AuthMode) => {
    setError(null)
    setMode(nextMode)
    const url = new URL(window.location.href)
    if (nextMode === "password") url.searchParams.set("mode", "password")
    else url.searchParams.delete("mode")
    router.replace(url.pathname + url.search, { scroll: false })
  }

  const handleAuthError = (err: unknown) => {
    console.error("Login Error:", err)
    const apiError = err as {
      status?: number
      data?: { message?: string; lockoutMinutes?: number }
      message?: string
    }
    if (apiError.status === 403) {
      setError(
        t("account_locked", {
          minutes: String(apiError.data?.lockoutMinutes || 15),
        }),
      )
    } else if (apiError.status === 429) {
      setError(t("rate_limit"))
    } else if (apiError.status === 409) {
      setError(t("password_email_exists"))
    } else if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
      setError(t("network_error"))
    } else {
      setError(
        apiError.data?.message ||
          apiError.message ||
          (mode === "password" ? t("password_login_error") : t("send_error")),
      )
    }
  }

  const finishPasswordSession = async (result: {
    needsProfileCompletion?: boolean
    needsEmailVerification?: boolean
    user?: { email?: string; role?: string }
  }) => {
    sessionStorage.removeItem("auth_email")

    if (result.needsEmailVerification) {
      if (result.user?.email) {
        sessionStorage.setItem("auth_email", result.user.email)
      }
      sessionStorage.setItem("email_verify_sent_at", String(Date.now()))
      window.location.replace("/verify-email")
      return
    }

    if (result.needsProfileCompletion) {
      if (result.user?.email) {
        saveProfileOAuthHint(result.user.email)
      }
      window.location.replace("/complete-profile")
      return
    }

    const accountsOrigin = window.location.origin
    const sessionNext = localStorage.getItem("auth_next")
    const nextTarget = nextParam || sessionNext
    localStorage.removeItem("auth_next")

    let resolvedTarget = getSafeRedirectUrl(nextTarget, result.user?.role)

    let targetOrigin = accountsOrigin
    try {
      targetOrigin = new URL(resolvedTarget).origin
    } catch {
      resolvedTarget = getRedirectUrlByRole(result.user?.role)
      targetOrigin = new URL(resolvedTarget).origin
    }

    if (targetOrigin !== accountsOrigin) {
      const path = new URL(resolvedTarget).pathname + new URL(resolvedTarget).search
      await redirectToAppCallback(targetOrigin, path)
      return
    }

    window.location.replace(resolvedTarget)
  }

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail) return

    setError(null)
    setIsLoading(true)

    try {
      await requestMagicLink(trimmedEmail)
      sessionStorage.setItem("auth_email", trimmedEmail)
      if (nextParam) localStorage.setItem("auth_next", nextParam)
      router.push("/check-email")
    } catch (err: unknown) {
      handleAuthError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmitPassword) return

    setError(null)
    setIsLoading(true)

    try {
      if (nextParam) localStorage.setItem("auth_next", nextParam)
      const result = isRegister
        ? await registerWithPassword(trimmedEmail, password)
        : await loginWithPassword(trimmedEmail, password)

      if (!result.success) {
        if (result.requires2FA && result.pendingSessionId) {
          const emailFor2FA = result.email || trimmedEmail
          const params = new URLSearchParams({
            sessionId: result.pendingSessionId,
          })
          if (emailFor2FA) {
            params.set("email", emailFor2FA)
            sessionStorage.setItem("auth_email", emailFor2FA)
            // Password login already proved 2FA is required — don't wait on
            // start-verify-identity (or a stale cache) to show Authenticator.
            sessionStorage.setItem(
              `auth_methods_${emailFor2FA}`,
              JSON.stringify({
                has2FA: true,
                isSubscribed: false,
                timestamp: Date.now(),
              }),
            )
          }
          router.replace(`/choose-method?${params.toString()}`)
          return
        }
        setError(result.message || t("password_login_error"))
        return
      }

      await finishPasswordSession(result)
    } catch (err: unknown) {
      handleAuthError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuth = (provider: OAuthProviderId) => {
    if (!getEnabledLoginOAuthProviders().includes(provider)) {
      return
    }
    const origin = window.location.origin
    const params = new URLSearchParams({
      redirect_origin: origin,
    })
    if (nextParam) params.set("next", nextParam)
    window.location.href = `${API_BASE}/auth/${provider}?${params.toString()}`
  }

  return (
    <AuthSplitPage
      badge={t("login_badge")}
      title={t("welcome_back")}
      description={
        mode === "password" ? t("password_subtitle") : t("login_subtitle")
      }
      showFooter={false}
    >
      {sessionMessage ? (
        <p
          className="mb-4 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-900/90 dark:bg-amber-500/15 dark:text-amber-100/90"
          role="status"
        >
          {sessionMessage}
        </p>
      ) : null}

      {oauthErrorMessage ? (
        <p
          className="mb-4 rounded-xl bg-destructive/8 px-3 py-2 text-xs text-destructive"
          role="alert"
        >
          {oauthErrorMessage}
        </p>
      ) : null}

      {hasOAuthProviders ? (
        <AuthOAuthButtons
          layout="grid"
          showSeparator={false}
          onProvider={handleOAuth}
        />
      ) : null}

      {hasOAuthProviders ? (
        <div className="my-6 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="shrink-0 text-xs text-muted-foreground">
            {t("or_continue_with")}
          </span>
          <Separator className="flex-1" />
        </div>
      ) : null}

      {mode === "sso" ? (
        <form
          onSubmit={handleMagicLinkSubmit}
          className="w-full space-y-4"
          noValidate
        >
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
                aria-invalid={!!error}
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
            id="send-magic-link-btn"
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
                {t("send_magic_link")}
                <ArrowUpRight className="size-4 rtl:rotate-180" />
              </span>
            )}
          </Button>

          <button
            type="button"
            onClick={() => switchMode("password")}
            className="flex w-full items-center justify-center gap-2 pt-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <KeyRound className="size-3.5" aria-hidden />
            {t("continue_with_password")}
          </button>
        </form>
      ) : (
        <form
          onSubmit={handlePasswordSubmit}
          className="w-full space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <label
              htmlFor="email-password"
              className="block text-sm font-medium text-foreground"
            >
              {t("email_label")}
            </label>
            <div className="auth-field flex h-12 items-center gap-2.5 overflow-hidden rounded-2xl border border-input/70 bg-background/80 px-3 backdrop-blur-sm transition-all focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/15 sm:h-11 sm:rounded-full">
              <Mail className="size-4 shrink-0 text-muted-foreground" />
              <input
                id="email-password"
                type="email"
                placeholder={t("email_placeholder")}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                autoComplete="email"
                autoFocus
                aria-invalid={!!error}
                className="auth-email-input h-full min-w-0 flex-1 border-0 bg-transparent text-left text-sm outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                {t("password_label")}
              </label>
              {!isRegister ? (
                <Link
                  href={`/forgot-password${trimmedEmail ? `?email=${encodeURIComponent(trimmedEmail)}` : ""}`}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("forgot_password")}
                </Link>
              ) : null}
            </div>
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
                autoComplete={isRegister ? "new-password" : "current-password"}
                aria-invalid={!!error}
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
            {isRegister ? (
              <p className="text-xs text-muted-foreground">
                {t("password_hint")}
              </p>
            ) : null}
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
            disabled={!canSubmitPassword}
            className={cn(
              "h-12 w-full rounded-full text-sm font-semibold transition-all sm:h-11",
              "bg-primary text-primary-foreground hover:opacity-95",
              "disabled:opacity-45",
            )}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {isRegister ? t("creating_account") : t("signing_in")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                {isRegister ? t("create_account") : t("sign_in_password")}
                <ArrowUpRight className="size-4 rtl:rotate-180" />
              </span>
            )}
          </Button>

          <div className="flex flex-col items-center gap-2 pt-1 text-sm">
            <button
              type="button"
              onClick={() => {
                setIsRegister((v) => !v)
                setError(null)
              }}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {isRegister
                ? t("have_account_sign_in")
                : t("no_account_register")}
            </button>
            <button
              type="button"
              onClick={() => switchMode("sso")}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("continue_with_sso")}
            </button>
          </div>
        </form>
      )}

      <AuthFooter className="mt-8" />
    </AuthSplitPage>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}
