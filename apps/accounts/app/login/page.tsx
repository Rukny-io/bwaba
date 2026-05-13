"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthFooter } from "@/components/auth/auth-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { requestMagicLink } from "@/lib/api"

// ── أيقونات OAuth ────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="size-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg className="size-5 flex-shrink-0" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

// ── صفحة تسجيل الدخول ──────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get("next")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedEmail = email.trim()
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail) return

    setError(null)
    setIsLoading(true)

    try {
      await requestMagicLink(trimmedEmail)
      sessionStorage.setItem("auth_email", trimmedEmail)
      if (nextParam) sessionStorage.setItem("auth_next", nextParam)
      router.push("/check-email")
    } catch (err: unknown) {
      console.error("Login Error:", err)
      const apiError = err as { status?: number; data?: { message?: string; lockoutMinutes?: number }; message?: string }
      if (apiError.status === 403) {
        setError(
          `الحساب مقفل مؤقتاً. حاول مجدداً بعد ${apiError.data?.lockoutMinutes || 15} دقيقة.`
        )
      } else if (apiError.status === 429) {
        setError("تجاوزت الحد المسموح من المحاولات. حاول لاحقاً.")
      } else {
        if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
          setError("تعذر الاتصال بالخادم. يرجى التحقق من اتصالك أو أن السيرفر يعمل.")
        } else {
          setError(
            apiError.data?.message || apiError.message || "حدث خطأ أثناء الإرسال. يرجى المحاولة مجدداً."
          )
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuth = (provider: "google" | "linkedin") => {
    const origin = window.location.origin
    const statePayload = JSON.stringify({ o: origin, n: nextParam || "" })
    const stateB64 = btoa(statePayload)
    window.location.href = `${API_BASE}/auth/${provider}?state=${encodeURIComponent(stateB64)}`
  }

  return (
    <AuthLayout>
      <div className="w-full text-center mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          مرحباً بعودتك
        </h1>
        <p className="text-sm text-muted-foreground">
          سجّل دخولك إلى حسابك
        </p>
      </div>

      {/* نموذج البريد الإلكتروني */}
      <form onSubmit={handleSubmit} className="w-full space-y-3" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-foreground text-right">
            البريد الإلكتروني
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            autoComplete="email"
            autoFocus
            aria-invalid={!!error}
            className="text-left placeholder:text-right"
            dir="ltr"
          />
        </div>

        {error && (
          <p className="text-xs text-destructive text-right" role="alert">
            {error}
          </p>
        )}

        <Button
          id="send-magic-link-btn"
          type="submit"
          size="lg"
          disabled={!isValidEmail || isLoading}
          className={cn(
            "w-full h-12 rounded-full text-base font-medium transition-all",
            "bg-primary text-primary-foreground",
            "disabled:opacity-40"
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          {isLoading ? "جارٍ الإرسال..." : "إرسال رابط تسجيل الدخول"}
        </Button>
      </form>

      {/* Divider */}
      <div className="w-full flex items-center gap-3 my-5">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground flex-shrink-0">أو</span>
        <Separator className="flex-1" />
      </div>

      {/* OAuth Buttons */}
      <div className="w-full space-y-3">
        <Button
          id="google-login-btn"
          type="button"
          variant="outline"
          size="lg"
          onClick={() => handleOAuth("google")}
          className="w-full h-12 rounded-full text-sm font-medium border-border gap-3"
        >
          <GoogleIcon />
          المتابعة عبر Google
        </Button>

        <Button
          id="linkedin-login-btn"
          type="button"
          variant="outline"
          size="lg"
          onClick={() => handleOAuth("linkedin")}
          className="w-full h-12 rounded-full text-sm font-medium border-border gap-3"
        >
          <LinkedInIcon />
          المتابعة عبر LinkedIn
        </Button>
      </div>

      <AuthFooter />
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <AuthLayout>
        <div className="w-full text-center py-12">
          <div className="size-10 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground mt-4">جارٍ التحميل...</p>
        </div>
      </AuthLayout>
    }>
      <LoginPageContent />
    </React.Suspense>
  )
}
