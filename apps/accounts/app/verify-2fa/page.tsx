"use client"

import React, { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { KeyRound, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { AuthLoadingFallback } from "@/components/auth/auth-loading"
import { AuthVerifyPage } from "@/components/auth/auth-verify-page"
import { TotpForm } from "@/components/auth/totp-form"
import { verify2FALogin } from "@/lib/api"
import { consumeStoredNext } from "@/lib/redirect"

function Verify2FAContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [method, setMethod] = useState<"authenticator" | "backup-code">(
    "authenticator",
  )
  const [sessionId, setSessionId] = useState("")
  const t = useTranslations("Auth")

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

  const title =
    method === "authenticator"
      ? t("enter_auth_code")
      : t("enter_backup_code")

  const description =
    method === "authenticator" ? t("desc_auth") : t("desc_backup")

  const icon =
    method === "backup-code" ? (
      <KeyRound className="size-6" strokeWidth={1.75} aria-hidden />
    ) : (
      <ShieldCheck className="size-6" strokeWidth={1.75} aria-hidden />
    )

  if (!sessionId) return null

  return (
    <AuthVerifyPage
      badge={t("login_badge")}
      title={title}
      description={description}
      icon={icon}
    >
      <TotpForm
        mode={method}
        onSubmit={handleSubmit}
        onBack={() => router.back()}
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
