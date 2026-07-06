"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowUpRight, Mail, Sparkles } from "lucide-react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthFooter } from "@/components/auth/auth-footer"
import { Button } from "@/components/ui/button"
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

function FacebookIcon() {
  return (
    <svg className="size-5 flex-shrink-0" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

interface SocialLoginButtonProps {
  id: string
  label: string
  onClick: () => void
  icon: React.ReactNode
  className?: string
}

function SocialLoginButton({ id, label, onClick, icon, className }: SocialLoginButtonProps) {
  return (
    <Button
      id={id}
      type="button"
      variant="outline"
      size="lg"
      onClick={onClick}
      className={cn(
        "h-11 w-full rounded-full border-border bg-background px-4 text-sm font-medium",
        "flex items-center justify-center",
        "transition-all hover:bg-accent/40 hover:border-border/80",
        className
      )}
    >
      <span className="inline-flex items-center justify-center gap-2">
        <span className="flex size-5 items-center justify-center">{icon}</span>
        <span>{label}</span>
      </span>
    </Button>
  )
}

// ── صفحة تسجيل الدخول ──────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("Auth")
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
      if (nextParam) localStorage.setItem("auth_next", nextParam)
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

  const handleOAuth = (provider: "google" | "linkedin" | "facebook") => {
    const origin = window.location.origin
    const params = new URLSearchParams({
      redirect_origin: origin,
    })
    if (nextParam) params.set("next", nextParam)
    window.location.href = `${API_BASE}/auth/${provider}?${params.toString()}`
  }

  return (
    <AuthLayout className="max-w-[460px]">
      <section className="w-full bg-background/95 px-5 py-6 sm:px-7 sm:py-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-xs font-medium text-foreground">
            {t("welcome_back")}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("welcome_back")}
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("login_subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              {t("email_label")}
            </label>
            <div className="flex h-11 items-center gap-2.5 rounded-full border border-input bg-input/30 px-3 transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
              <Mail className="size-4 shrink-0 text-muted-foreground" />
              <input
                id="email"
                type="email"
                placeholder={t("email_placeholder")}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                autoComplete="email"
                autoFocus
                aria-invalid={!!error}
                className="h-full w-full bg-transparent text-sm text-left outline-none placeholder:text-muted-foreground"
                dir="ltr"
              />
            </div>
          </div>

          {error && (
            <p
              className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}

          <Button
            id="send-magic-link-btn"
            type="submit"
            size="lg"
            disabled={!isValidEmail || isLoading}
            className={cn(
              "h-11 w-full rounded-full text-sm font-semibold transition-all",
              "bg-primary text-primary-foreground hover:opacity-95",
              "disabled:opacity-45"
            )}
          >
            {isLoading ? (
              t("sending")
            ) : (
              <>
                {t("send_magic_link")}
                <ArrowUpRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        <div className="my-5 flex w-full items-center gap-3">
          <Separator className="flex-1" />
          <span className="shrink-0 text-xs text-muted-foreground">{t("or_continue_with")}</span>
          <Separator className="flex-1" />
        </div>

        <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
          <SocialLoginButton
            id="google-login-btn"
            onClick={() => handleOAuth("google")}
            label={t("continue_with_google")}
            icon={<GoogleIcon />}
            className="col-span-1 sm:col-span-2"
          />

          <SocialLoginButton
            id="linkedin-login-btn"
            onClick={() => handleOAuth("linkedin")}
            label={t("continue_with_linkedin")}
            icon={<LinkedInIcon />}
            className="col-span-1"
          />

          <SocialLoginButton
            id="facebook-login-btn"
            onClick={() => handleOAuth("facebook")}
            label={t("continue_with_facebook")}
            icon={<FacebookIcon />}
            className="col-span-1"
          />
        </div>

        <AuthFooter className="mt-6" />
      </section>
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
