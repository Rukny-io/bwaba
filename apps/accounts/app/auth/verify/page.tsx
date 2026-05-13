"use client"

import React from "react"
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
    desc: "طلبك قيد المعالجة. يرجى الانتظار ثم المحاولة مجدداً.",
    icon: "⏳",
  },
}

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get("error") || "invalid"
  const message = searchParams.get("message")

  const info = ERROR_MESSAGES[error] || ERROR_MESSAGES.invalid

  return (
    <AuthLayout>
      <div className="w-full text-center py-8 space-y-6">
        <div className="text-5xl">{info.icon}</div>
        <div>
          <h1 className="text-xl font-semibold text-foreground mb-2">{info.title}</h1>
          <p className="text-sm text-muted-foreground">
            {message || info.desc}
          </p>
        </div>

        <Button
          onClick={() => router.replace("/login")}
          size="lg"
          className="w-full max-w-xs mx-auto h-12 rounded-full bg-primary text-primary-foreground text-base font-medium"
        >
          طلب رابط جديد
        </Button>
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
