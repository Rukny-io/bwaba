"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthFooter } from "@/components/auth/auth-footer"
import { Button } from "@/components/ui/button"

const ERROR_MESSAGES: Record<string, { title: string; desc: string; icon: string }> = {
  used: {
    title: "تم استخدام هذا الرابط",
    desc: "هذا الرابط تم استخدامه مسبقاً. اطلب رابطاً جديداً.",
    icon: "🔗",
  },
  expired: {
    title: "انتهت صلاحية الرابط",
    desc: "هذا الرابط لم يعد صالحاً. اطلب رابطاً جديداً.",
    icon: "⏰",
  },
  invalid: {
    title: "رابط غير صالح",
    desc: "هذا الرابط غير صحيح أو تالف.",
    icon: "⚠️",
  },
  processing: {
    title: "جارٍ المعالجة",
    desc: "طلبك قيد المعالجة. سيتم إعادة المحاولة تلقائياً...",
    icon: "⏳",
  },
}

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 3000

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get("error") || "invalid"
  const message = searchParams.get("message")
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null)

  const info = ERROR_MESSAGES[error] || ERROR_MESSAGES.invalid

  // Auto-retry for "processing" error (lock contention)
  useEffect(() => {
    if (error !== "processing") return
    if (retryCount >= MAX_RETRIES) return

    setIsRetrying(true)
    retryTimerRef.current = setTimeout(() => {
      setRetryCount((c) => c + 1)
      // Reload the page to retry the magic link verification
      // The user should go back to their email and click the link again
      // But we can try refreshing in case the lock was released
      window.location.reload()
    }, RETRY_DELAY_MS)

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [error, retryCount])

  const showRetryExhausted = error === "processing" && retryCount >= MAX_RETRIES

  return (
    <AuthLayout>
      <div className="w-full text-center py-8 space-y-6">
        {error === "processing" && !showRetryExhausted ? (
          <>
            <div className="size-10 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <div>
              <h1 className="text-xl font-semibold text-foreground mb-2">{info.title}</h1>
              <p className="text-sm text-muted-foreground">
                {message || info.desc}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                محاولة {retryCount + 1} من {MAX_RETRIES}...
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-5xl">{showRetryExhausted ? "😔" : info.icon}</div>
            <div>
              <h1 className="text-xl font-semibold text-foreground mb-2">
                {showRetryExhausted ? "تعذرت المعالجة" : info.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {showRetryExhausted
                  ? "يرجى طلب رابط جديد والمحاولة مرة أخرى."
                  : (message || info.desc)}
              </p>
            </div>

            <Button
              onClick={() => router.replace("/login")}
              size="lg"
              className="w-full max-w-xs mx-auto h-12 rounded-full bg-primary text-primary-foreground text-base font-medium"
            >
              طلب رابط جديد
            </Button>
          </>
        )}
      </div>
      <AuthFooter />
    </AuthLayout>
  )
}

export default function AuthVerifyPage() {
  return (
    <React.Suspense fallback={
      <AuthLayout>
        <div className="w-full text-center py-12">
          <div className="size-10 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </AuthLayout>
    }>
      <VerifyContent />
    </React.Suspense>
  )
}
