"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { exchangeCode } from "@/lib/api"
import { getRedirectUrlByRole, getSafeRedirectUrl } from "@/lib/redirect"


function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    // منع التنفيذ المتكرر في Strict Mode
    if (hasRun.current) return
    hasRun.current = true

    const code = searchParams.get("code")
    if (!code) {
      router.replace("/login")
      return
    }

    const doExchange = async () => {
      try {
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

        // تنظيف
        sessionStorage.removeItem("auth_email")

        // إذا يحتاج إكمال الملف الشخصي
        if (result.needsProfileCompletion) {
          router.replace("/complete-profile")
          return
        }

        // تم تسجيل الدخول — الكوكيز تم تعيينها من الـ API
        const urlNext = searchParams.get("next")
        const sessionNext = sessionStorage.getItem("auth_next")
        const nextTarget = urlNext || sessionNext
        sessionStorage.removeItem("auth_next")

        window.location.href = getSafeRedirectUrl(nextTarget, result.user?.role)
      } catch (err: unknown) {
        const apiError = err as { data?: { message?: string } }
        setError(apiError.data?.message || "حدث خطأ أثناء تسجيل الدخول")
      }
    }

    doExchange()
  }, [router, searchParams])

  return (
    <AuthLayout>
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
              onClick={() => router.replace("/login")}
              className="text-sm text-primary hover:underline cursor-pointer"
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
    </AuthLayout>
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
