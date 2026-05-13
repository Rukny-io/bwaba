"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthFooter } from "@/components/auth/auth-footer"
import { MethodChooser, type VerificationMethod } from "@/components/auth/method-chooser"
import { resendMagicLink, startVerifyIdentity } from "@/lib/api"

function ChooseMethodContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [has2FA, setHas2FA] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    // الأولوية للقيم في الرابط (تأتي من QuickSign)
    const urlEmail = searchParams.get("email")
    const urlSessionId = searchParams.get("sessionId")
    
    const storedEmail = sessionStorage.getItem("auth_email")
    const finalEmail = urlEmail || storedEmail

    if (!finalEmail) {
      router.replace("/login")
      return
    }
    
    setEmail(finalEmail)
    if (urlEmail) {
      sessionStorage.setItem("auth_email", urlEmail)
    }

    if (urlSessionId) {
      setSessionId(urlSessionId)
    }

    // محاولة استعادة الحالة من الكاش لتسريع الواجهة
    const cachedData = sessionStorage.getItem(`auth_methods_${finalEmail}`)
    if (cachedData) {
      try {
        const { has2FA: cached2FA, isSubscribed: cachedSub } = JSON.parse(cachedData)
        setHas2FA(cached2FA)
        setIsSubscribed(cachedSub)
        // إذا كان لدينا كاش، لا نجعل المستخدم ينتظر الهيكل العظمي
        setIsLoading(false)
      } catch (e) {
        console.error("Error parsing cached auth methods", e)
      }
    }

    // جلب الطرق المتاحة فور تحميل الصفحة أو تحديث الكاش في الخلفية
    startVerifyIdentity(finalEmail)
      .then((result) => {
        const fresh2FA = result.availableMethods.authenticator
        const freshSub = result.availableMethods.whatsapp || false
        
        setHas2FA(fresh2FA)
        setIsSubscribed(freshSub)
        
        // تحديث الكاش
        sessionStorage.setItem(`auth_methods_${finalEmail}`, JSON.stringify({
          has2FA: fresh2FA,
          isSubscribed: freshSub,
          timestamp: Date.now()
        }))

        // لا نحدث الـ sessionId إذا كان قادماً من الرابط (لأنه الأحدث والأصح)
        if (result.pendingSessionId && !urlSessionId) {
          setSessionId(result.pendingSessionId)
        }
      })
      .catch(() => {
        // الفشل لا يمنع من المحاولة عبر الإيميل
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [router, searchParams])

  const handleSelect = async (method: VerificationMethod) => {
    if (!email) return

    try {
      if (method === "email") {
        await resendMagicLink(email)
        router.push("/check-email")
      } else {
        // في حالة 2FA و whatsapp، نستخدم الجلسة الحالية
        if (sessionId) {
          sessionStorage.setItem("auth_2fa_method", method)
          router.push(`/verify-2fa?sessionId=${sessionId}`)
        } else {
          // محاولة أخيرة لو لم تكن هناك جلسة
          const result = await startVerifyIdentity(email)
          if (result.pendingSessionId) {
            sessionStorage.setItem("auth_2fa_method", method)
            router.push(`/verify-2fa?sessionId=${result.pendingSessionId}`)
          } else {
            await resendMagicLink(email)
            router.push("/check-email")
          }
        }
      }
    } catch {
      router.push("/check-email")
    }
  }

  if (!email) return null

  return (
    <AuthLayout
      title="اختيار طريقة التحقق"
      description="يرجى اختيار الطريقة التي تفضلها لتسجيل الدخول"
    >
      <div className="space-y-6">
        <MethodChooser
          onSelect={handleSelect}
          has2FA={has2FA}
          isSubscribed={isSubscribed}
          isLoading={isLoading}
        />
      </div>

      <AuthFooter />
    </AuthLayout>
  )
}

export default function ChooseMethodPage() {
  return (
    <React.Suspense fallback={<div>جاري التحميل...</div>}>
      <ChooseMethodContent />
    </React.Suspense>
  )
}
