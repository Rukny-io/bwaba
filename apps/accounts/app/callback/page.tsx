"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { exchangeCode, issueOAuthCode, saveProfileOAuthHint } from "@/lib/api"
import { getSafeRedirectUrl } from "@/lib/redirect"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const code = searchParams.get("code")
    if (!code) {
      router.replace("/login")
      return
    }

    const doExchange = async () => {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")
      const defaultAppTarget = `${appUrl}/app/links`
      let resolvedTarget = defaultAppTarget

      try {
        const urlNext = searchParams.get("next")
        const sessionNext = localStorage.getItem("auth_next")
        const nextTarget = urlNext || sessionNext

        try {
          if (nextTarget) {
            resolvedTarget = nextTarget.startsWith("http")
              ? nextTarget
              : new URL(nextTarget, appUrl).toString()
          }
        } catch {
          resolvedTarget = defaultAppTarget
        }

        const accountsOrigin = window.location.origin
        const result = await exchangeCode(code)

        if (!result.success) {
          if (result.requiresLinking) {
            setError("يوجد حساب مسجل بهذا البريد. سجل الدخول بالطريقة المعتادة.")
            return
          }
          if (result.requires2FA && result.pendingSessionId) {
            router.replace(`/verify-2fa?sessionId=${result.pendingSessionId}`)
            return
          }
          setError(result.message || "حدث خطأ أثناء تسجيل الدخول")
          return
        }

        sessionStorage.removeItem("auth_email")

        if (result.needsProfileCompletion) {
          if (result.user?.email) {
            saveProfileOAuthHint(result.user.email)
          }
          // Allow browser to persist Set-Cookie from exchange before loading complete-profile
          await new Promise((resolve) => setTimeout(resolve, 50))
          window.location.replace("/complete-profile")
          return
        }

        localStorage.removeItem("auth_next")

        let targetOrigin = accountsOrigin
        try {
          targetOrigin = new URL(resolvedTarget).origin
        } catch {
          targetOrigin = new URL(appUrl).origin
        }

        if (targetOrigin !== accountsOrigin) {
          try {
            const { code: transferCode } = await issueOAuthCode()
            const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
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
            forward.searchParams.set("next", resolvedTarget)
            window.location.href = forward.toString()
            return
          } catch {
            // Fall through to same-origin redirect
          }
        }

        window.location.href = getSafeRedirectUrl(resolvedTarget, result.user?.role)
      } catch (err: unknown) {
        // If the exchange failed, it might be a network retry and the session already exists
        try {
          const authCheck = await fetch('/api/v1/auth/me', { credentials: 'include' });
          if (authCheck.ok) {
            const user = await authCheck.json();
            window.location.href = getSafeRedirectUrl(resolvedTarget, user?.role);
            return;
          }
        } catch (e) {
          // Fall through
        }

        const apiError = err as { data?: { message?: string } }
        setError(apiError.data?.message || "حدث خطأ أثناء تسجيل الدخول")
      }
    }

    doExchange()
  }, [router, searchParams])

  return (
    <AuthLayout>
      <CallbackStatus error={error} onLogin={() => router.replace("/login")} />
    </AuthLayout>
  )
}

function CallbackStatus({
  error,
  onLogin,
}: {
  error: string | null
  onLogin: () => void
}) {
  return (
    <div className="w-full text-center py-12">
      {error ? (
        <div className="space-y-4">
          <div className="size-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={onLogin}
            className="text-sm text-foreground hover:underline cursor-pointer"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="size-10 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">جارٍ تسجيل الدخول...</p>
        </div>
      )}
    </div>
  )
}

export default function CallbackPage() {
  return (
    <React.Suspense fallback={
      <AuthLayout>
        <div className="w-full text-center py-12">
          <div className="size-10 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground mt-4">جارٍ التحميل...</p>
        </div>
      </AuthLayout>
    }>
      <CallbackContent />
    </React.Suspense>
  )
}
