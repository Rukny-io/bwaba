"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { AuthSplitPage } from "@/components/auth/auth-split-page"
import { AuthStatus } from "@/components/auth/auth-status"
import { exchangeCodeOnce, issueOAuthCode, saveProfileOAuthHint } from "@/lib/api"
import { getSafeRedirectUrl, getRedirectUrlByRole } from "@/lib/redirect"
import { resolveApiBaseUrl, resolveAppUrl } from "@/lib/env-urls"
import {
  clearOAuthParamsFromUrl,
  clearStashedOAuthParams,
  readOAuthCallbackParams,
  readStashedOAuthParams,
  resolveCrossAppForwardNext,
  stashOAuthParams,
} from "@/lib/oauth-callback"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("Auth")
  const [error, setError] = useState<string | null>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const fromUrl = readOAuthCallbackParams(searchParams)
    if (fromUrl.code) {
      stashOAuthParams({ code: fromUrl.code, next: fromUrl.next })
      clearOAuthParamsFromUrl()
    }

    const stashed = readStashedOAuthParams()
    const code = fromUrl.code || stashed.code
    const hashNext = fromUrl.next || stashed.next

    if (!code) {
      hasRun.current = false
      router.replace("/login")
      return
    }

    const doExchange = async () => {
      const accountsOrigin = window.location.origin
      const appUrl = resolveAppUrl().replace(/\/$/, "")
      const defaultAppTarget = `${appUrl}/app/links`
      let resolvedTarget = defaultAppTarget

      try {
        const urlNext = searchParams.get("next") || hashNext
        const sessionNext = localStorage.getItem("auth_next")
        const nextTarget = urlNext || sessionNext

        const result = await exchangeCodeOnce(code)
        clearStashedOAuthParams()

        if (!result.success) {
          if (result.requiresLinking) {
            setError(t("callback_linking_required"))
            return
          }
          if (result.requires2FA && result.pendingSessionId) {
            router.replace(`/verify-2fa?sessionId=${result.pendingSessionId}`)
            return
          }
          setError(result.message || t("callback_login_error"))
          return
        }

        sessionStorage.removeItem("auth_email")

        if (result.needsProfileCompletion) {
          if (result.user?.email) {
            saveProfileOAuthHint(result.user.email)
          }
          await new Promise((resolve) => setTimeout(resolve, 50))
          window.location.replace("/complete-profile")
          return
        }

        localStorage.removeItem("auth_next")

        if (!nextTarget) {
          resolvedTarget = getRedirectUrlByRole(result.user?.role)
        } else {
          try {
            resolvedTarget = nextTarget.startsWith("http")
              ? nextTarget
              : new URL(nextTarget, accountsOrigin).toString()
          } catch {
            resolvedTarget = getRedirectUrlByRole(result.user?.role)
          }
        }

        let targetOrigin = accountsOrigin
        try {
          targetOrigin = new URL(resolvedTarget).origin
        } catch {
          targetOrigin = new URL(appUrl).origin
        }

        if (targetOrigin !== accountsOrigin) {
          try {
            const { code: transferCode } = await issueOAuthCode()
            const apiBase = resolveApiBaseUrl().replace(/\/$/, "")
            let apiOrigin: string | null = null
            try {
              apiOrigin = apiBase ? new URL(apiBase).origin : null
            } catch {
              apiOrigin = null
            }
            const callbackPath =
              apiOrigin && targetOrigin === apiOrigin
                ? "/api/v1/oauth/callback"
                : "/callback"
            const forward = new URL(callbackPath, targetOrigin)
            forward.searchParams.set("code", transferCode)
            forward.searchParams.set(
              "next",
              resolveCrossAppForwardNext(resolvedTarget, targetOrigin),
            )
            window.location.href = forward.toString()
            return
          } catch {
            // Fall through to same-origin redirect
          }
        }

        window.location.href = getSafeRedirectUrl(resolvedTarget, result.user?.role)
      } catch (err: unknown) {
        try {
          const authCheck = await fetch('/api/v1/auth/me', { credentials: 'include' });
          if (authCheck.ok) {
            const user = await authCheck.json();
            window.location.href = getSafeRedirectUrl(resolvedTarget, user?.role);
            return;
          }
        } catch {
          // Fall through
        }

        const apiError = err as { data?: { message?: string } }
        setError(apiError.data?.message || t("callback_login_error"))
      }
    }

    doExchange()
  }, [router, searchParams, t])

  return (
    <AuthSplitPage
      badge={t("login_badge")}
      title={error ? t("callback_login_error") : t("callback_signing_in")}
      description={error ? undefined : t("login_subtitle")}
      showFooter={false}
    >
      <AuthStatus
        variant={error ? "error" : "loading"}
        message={error || t("callback_signing_in")}
        actionLabel={error ? t("back_to_login") : undefined}
        onAction={error ? () => {
          clearStashedOAuthParams()
          router.replace("/login")
        } : undefined}
      />
    </AuthSplitPage>
  )
}

function CallbackFallback() {
  const t = useTranslations("Auth")

  return (
    <AuthSplitPage
      badge={t("login_badge")}
      title={t("callback_signing_in")}
      showFooter={false}
    >
      <AuthStatus variant="loading" message={t("loading")} />
    </AuthSplitPage>
  )
}

export default function CallbackPage() {
  return (
    <React.Suspense fallback={<CallbackFallback />}>
      <CallbackContent />
    </React.Suspense>
  )
}
