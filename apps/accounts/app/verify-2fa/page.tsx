"use client"

import React, { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { KeyRound, MessageCircle, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { AuthLoadingFallback } from "@/components/auth/auth-loading"
import { AuthVerifyPage } from "@/components/auth/auth-verify-page"
import { TotpForm } from "@/components/auth/totp-form"
import { verify2FALogin, sendWhatsappOtp } from "@/lib/api"
import { consumeStoredNext } from "@/lib/redirect"

function Verify2FAContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [method, setMethod] = useState<
    "authenticator" | "backup-code" | "whatsapp"
  >("authenticator")
  const [sessionId, setSessionId] = useState("")
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false)
  const [whatsappError, setWhatsappError] = useState<string | null>(null)
  const t = useTranslations("Auth")

  const handleSendWhatsappOtp = async (sid: string) => {
    setIsSendingWhatsapp(true)
    setWhatsappError(null)
    try {
      await sendWhatsappOtp(sid)
    } catch {
      setWhatsappError(t("whatsapp_send_error"))
    } finally {
      setIsSendingWhatsapp(false)
    }
  }

  useEffect(() => {
    const sid = searchParams.get("sessionId")
    if (!sid) {
      router.replace("/login")
      return
    }
    setSessionId(sid)

    const storedMethod = sessionStorage.getItem("auth_2fa_method")
    if (storedMethod === "backup-code") {
      setMethod("backup-code")
    } else if (storedMethod === "whatsapp") {
      setMethod("whatsapp")
      handleSendWhatsappOtp(sid)
    }
  }, [router, searchParams])

  const handleSubmit = async (code: string) => {
    const result = await verify2FALogin(sessionId, code, true)

    if (!result.success) {
      if (result.expired) {
        sessionStorage.removeItem("auth_email")
        sessionStorage.removeItem("auth_2fa_method")
        router.replace("/login?session=expired")
        return
      }
      throw new Error(result.error || t("invalid_code"))
    }

    sessionStorage.removeItem("auth_email")
    sessionStorage.removeItem("auth_2fa_method")

    window.location.href = consumeStoredNext(result.user?.role)
  }

  const getTitle = () => {
    if (method === "whatsapp") return t("enter_whatsapp_code")
    return method === "authenticator"
      ? t("enter_auth_code")
      : t("enter_backup_code")
  }

  const getDescription = () => {
    if (method === "whatsapp") return t("desc_whatsapp")
    return method === "authenticator" ? t("desc_auth") : t("desc_backup")
  }

  const icon =
    method === "whatsapp" ? (
      <MessageCircle className="size-6" strokeWidth={1.75} aria-hidden />
    ) : method === "backup-code" ? (
      <KeyRound className="size-6" strokeWidth={1.75} aria-hidden />
    ) : (
      <ShieldCheck className="size-6" strokeWidth={1.75} aria-hidden />
    )

  if (!sessionId) return null

  return (
    <AuthVerifyPage
      badge={t("login_badge")}
      title={getTitle()}
      description={getDescription()}
      icon={icon}
    >
      {whatsappError ? (
        <p
          className="mb-5 rounded-xl bg-destructive/8 px-3 py-2.5 text-center text-xs text-destructive"
          role="alert"
        >
          {whatsappError}
        </p>
      ) : null}
      <TotpForm
        mode={method}
        onSubmit={handleSubmit}
        onBack={() => router.back()}
        isSendingWhatsapp={isSendingWhatsapp}
        onResendWhatsapp={() => handleSendWhatsappOtp(sessionId)}
        showHeader={false}
      />
    </AuthVerifyPage>
  )
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <Verify2FAContent />
    </Suspense>
  )
}
