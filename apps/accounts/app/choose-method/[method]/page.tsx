"use client"

import React, { Suspense, useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { AuthLoadingFallback } from "@/components/auth/auth-loading"
import { AuthSplitPage } from "@/components/auth/auth-split-page"
import { AuthVerificationForm } from "@/components/auth/auth-verification-form"
import { ChooseMethodBackLink } from "@/components/auth/choose-method-back-link"
import { EmailVerificationAction } from "@/components/auth/email-verification-action"
import {
  getVerificationMethodMeta,
  type VerificationMethod,
} from "@/components/auth/method-chooser"
import { useChooseMethodSession } from "@/hooks/use-choose-method-session"
import {
  parseVerificationMethod,
} from "@/lib/auth/choose-method"
import { resendMagicLink, sendWhatsappOtp, verify2FALogin } from "@/lib/api"
import { getRedirectUrlByRole } from "@/lib/redirect"

function ChooseMethodVerifyContent() {
  const params = useParams<{ method: string }>()
  const t = useTranslations("Auth")
  const method = parseVerificationMethod(params.method)
  const {
    email,
    isLoading,
    sessionId,
    ensureSessionId,
    isMethodAvailable,
    router,
  } = useChooseMethodSession()

  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false)
  const [whatsappError, setWhatsappError] = useState<string | null>(null)

  useEffect(() => {
    if (!method) {
      router.replace("/choose-method")
      return
    }

    if (!isLoading && !isMethodAvailable(method)) {
      router.replace("/choose-method")
    }
  }, [method, isLoading, isMethodAvailable, router])

  const handleSendWhatsappOtp = useCallback(
    async (sid: string) => {
      setIsSendingWhatsapp(true)
      setWhatsappError(null)
      try {
        await sendWhatsappOtp(sid)
      } catch {
        setWhatsappError(t("whatsapp_send_error"))
      } finally {
        setIsSendingWhatsapp(false)
      }
    },
    [t],
  )

  useEffect(() => {
    if (method !== "whatsapp" || isLoading || !email) return

    let cancelled = false

    async function sendOtp() {
      try {
        const sid = sessionId || (await ensureSessionId())
        if (!sid || cancelled) return
        await handleSendWhatsappOtp(sid)
      } catch {
        if (!cancelled) {
          setWhatsappError(t("whatsapp_send_error"))
        }
      }
    }

    sendOtp()

    return () => {
      cancelled = true
    }
  }, [method, isLoading, email, sessionId, ensureSessionId, handleSendWhatsappOtp, t])

  const handleVerifyCode = async (code: string) => {
    const sid = sessionId || (await ensureSessionId())
    if (!sid) {
      await resendMagicLink(email)
      router.push("/check-email")
      return
    }

    const result = await verify2FALogin(sid, code, true)

    if (!result.success) {
      if (result.expired) {
        sessionStorage.removeItem("auth_email")
        router.replace("/login?session=expired")
        return
      }
      throw new Error(result.error || t("invalid_code"))
    }

    sessionStorage.removeItem("auth_email")
    sessionStorage.removeItem("auth_pending_2fa_session")
    window.location.href = getRedirectUrlByRole(result.user?.role)
  }

  const handleEmailSubmit = async () => {
    await resendMagicLink(email)
    router.push("/check-email")
  }

  if (!email || !method) return null

  const methodMeta = getVerificationMethodMeta(method, t)

  return (
    <AuthSplitPage
      badge={t("choose_method_title")}
      title={methodMeta.title}
      description={methodMeta.description}
    >
      <div className="space-y-5">
        <ChooseMethodBackLink />

        {whatsappError ? (
          <p
            className="rounded-xl bg-destructive/8 px-3 py-2 text-xs text-destructive"
            role="alert"
          >
            {whatsappError}
          </p>
        ) : null}

        {method === "email" ? (
          <EmailVerificationAction email={email} onSubmit={handleEmailSubmit} />
        ) : (
          <AuthVerificationForm
            mode={method as Extract<
              VerificationMethod,
              "authenticator" | "backup-code" | "whatsapp"
            >}
            onSubmit={handleVerifyCode}
            isSendingWhatsapp={isSendingWhatsapp}
            onResendWhatsapp={
              method === "whatsapp" && sessionId
                ? () => handleSendWhatsappOtp(sessionId)
                : undefined
            }
          />
        )}
      </div>
    </AuthSplitPage>
  )
}

export default function ChooseMethodVerifyPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <ChooseMethodVerifyContent />
    </Suspense>
  )
}
