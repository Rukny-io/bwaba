"use client"

import React, { Suspense, useEffect } from "react"
import { useParams } from "next/navigation"
import { KeyRound, Mail, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { AuthLoadingFallback } from "@/components/auth/auth-loading"
import { AuthVerificationForm } from "@/components/auth/auth-verification-form"
import { AuthVerifyPage } from "@/components/auth/auth-verify-page"
import { ChooseMethodBackLink } from "@/components/auth/choose-method-back-link"
import { EmailVerificationAction } from "@/components/auth/email-verification-action"
import {
  getVerificationMethodMeta,
  type VerificationMethod,
} from "@/components/auth/method-chooser"
import { useChooseMethodSession } from "@/hooks/use-choose-method-session"
import { parseVerificationMethod } from "@/lib/auth/choose-method"
import { resendMagicLink, verify2FALogin } from "@/lib/api"
import { consumeStoredNext } from "@/lib/redirect"

function MethodIcon({ method }: { method: VerificationMethod }) {
  const className = "size-6"
  switch (method) {
    case "backup-code":
      return <KeyRound className={className} strokeWidth={1.75} aria-hidden />
    case "email":
      return <Mail className={className} strokeWidth={1.75} aria-hidden />
    default:
      return <ShieldCheck className={className} strokeWidth={1.75} aria-hidden />
  }
}

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

  useEffect(() => {
    if (!method) {
      router.replace("/choose-method")
      return
    }

    if (!isLoading && !isMethodAvailable(method)) {
      router.replace("/choose-method")
    }
  }, [method, isLoading, isMethodAvailable, router])

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
    window.location.href = consumeStoredNext(result.user?.role)
  }

  const handleEmailSubmit = async () => {
    await resendMagicLink(email)
    router.push("/check-email")
  }

  if (!email || !method) return null

  const methodMeta = getVerificationMethodMeta(method, t)

  return (
    <AuthVerifyPage
      badge={t("choose_method_title")}
      title={methodMeta.title}
      description={methodMeta.description}
      icon={<MethodIcon method={method} />}
    >
      <div className="space-y-6">
        <div className="flex justify-center">
          <ChooseMethodBackLink />
        </div>

        {method === "email" ? (
          <EmailVerificationAction email={email} onSubmit={handleEmailSubmit} />
        ) : (
          <AuthVerificationForm
            mode={method}
            onSubmit={handleVerifyCode}
          />
        )}
      </div>
    </AuthVerifyPage>
  )
}

export default function ChooseMethodVerifyPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <ChooseMethodVerifyContent />
    </Suspense>
  )
}
