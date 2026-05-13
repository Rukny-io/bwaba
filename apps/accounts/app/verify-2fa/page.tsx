"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthFooter } from "@/components/auth/auth-footer"
import { TotpForm } from "@/components/auth/totp-form"
import { verify2FALogin, sendWhatsappOtp } from "@/lib/api"
import { getRedirectUrlByRole } from "@/lib/redirect"


function Verify2FAContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [method, setMethod] = useState<"authenticator" | "backup-code" | "whatsapp">("authenticator")
  const [sessionId, setSessionId] = useState("")
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false)

  const handleSendWhatsappOtp = async (sid: string) => {
    setIsSendingWhatsapp(true)
    try {
      await sendWhatsappOtp(sid)
    } catch (e) {
      // تجاهل الأخطاء الصامتة للواجهة
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
      // نرسل الرمز فوراً عند دخول الصفحة إذا كانت الطريقة واتساب
      handleSendWhatsappOtp(sid)
    }
  }, [router, searchParams])

  const handleSubmit = async (code: string) => {
    const result = await verify2FALogin(sessionId, code, true)

    if (!result.success) {
      if (result.expired) {
        sessionStorage.removeItem("auth_email")
        sessionStorage.removeItem("auth_2fa_method")
        router.replace("/login")
        return
      }
      throw new Error(result.error || "رمز غير صحيح")
    }

    // تنظيف
    sessionStorage.removeItem("auth_email")
    sessionStorage.removeItem("auth_2fa_method")

    // التوجيه للتطبيق بناءً على الصلاحية
    window.location.href = getRedirectUrlByRole(result.user?.role)
  }

  if (!sessionId) return null

  return (
    <AuthLayout>
      <TotpForm
        mode={method}
        onSubmit={handleSubmit}
        onBack={() => router.back()}
        isSendingWhatsapp={isSendingWhatsapp}
        onResendWhatsapp={() => handleSendWhatsappOtp(sessionId)}
      />
      <AuthFooter />
    </AuthLayout>
  )
}

export default function Verify2FAPage() {
  return (
    <React.Suspense fallback={
      <AuthLayout>
        <div className="w-full text-center py-12">
          <div className="size-10 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </AuthLayout>
    }>
      <Verify2FAContent />
    </React.Suspense>
  )
}
