"use client"

import React, { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Loader2, Mail } from "lucide-react"
import { AuthFooter } from "@/components/auth/auth-footer"
import { AuthLoadingFallback } from "@/components/auth/auth-loading"
import { AuthSplitPage } from "@/components/auth/auth-split-page"
import { OtpCodeInput } from "@/components/manage/otp-code-input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  fetchEmailVerificationStatus,
  saveProfileOAuthHint,
  sendEmailVerification,
  verifyEmailCode,
} from "@/lib/api"
import { getRedirectUrlByRole } from "@/lib/redirect"

function VerifyEmailContent() {
  const router = useRouter()
  const t = useTranslations("Auth")
  const [email, setEmail] = useState(
    () =>
      (typeof window !== "undefined" &&
        sessionStorage.getItem("auth_email")) ||
      "",
  )
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentHint, setSentHint] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(id)
  }, [cooldown])

  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      try {
        const status = await fetchEmailVerificationStatus()
        if (cancelled) return
        setEmail(status.email)
        sessionStorage.setItem("auth_email", status.email)

        if (status.emailVerified) {
          if (!status.profileCompleted) {
            saveProfileOAuthHint(status.email)
            window.location.replace("/complete-profile")
            return
          }
          window.location.replace(getRedirectUrlByRole())
          return
        }

        const sentAt = Number(sessionStorage.getItem("email_verify_sent_at") || 0)
        const recentlySent = sentAt && Date.now() - sentAt < 60_000
        if (!recentlySent) {
          try {
            await sendEmailVerification()
            sessionStorage.setItem("email_verify_sent_at", String(Date.now()))
            if (!cancelled) {
              setSentHint(true)
              setCooldown(60)
            }
          } catch {
            // User can manually resend
          }
        } else if (!cancelled) {
          setCooldown(Math.ceil((60_000 - (Date.now() - sentAt)) / 1000))
        }
      } catch {
        if (!cancelled) {
          router.replace("/login?mode=password")
          return
        }
      } finally {
        if (!cancelled) setBooting(false)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [router])

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || isSending) return
    setError(null)
    setIsSending(true)
    try {
      const result = await sendEmailVerification()
      setEmail(result.email)
      setSentHint(true)
      setCooldown(60)
      sessionStorage.setItem("email_verify_sent_at", String(Date.now()))
    } catch (err: unknown) {
      const apiError = err as {
        status?: number
        data?: { message?: string }
        message?: string
      }
      if (apiError.status === 429) setError(t("rate_limit"))
      else
        setError(
          apiError.data?.message ||
            apiError.message ||
            t("verify_email_send_error"),
        )
    } finally {
      setIsSending(false)
    }
  }, [cooldown, isSending, t])

  const handleVerify = async (value: string) => {
    if (value.length !== 6 || isLoading) return
    setError(null)
    setIsLoading(true)
    try {
      const result = await verifyEmailCode(value)
      sessionStorage.removeItem("auth_email")
      if (result.needsProfileCompletion) {
        if (email) saveProfileOAuthHint(email)
        window.location.replace("/complete-profile")
        return
      }
      window.location.replace(getRedirectUrlByRole())
    } catch (err: unknown) {
      const apiError = err as {
        status?: number
        data?: { message?: string }
        message?: string
      }
      setCode("")
      if (apiError.status === 429) setError(t("rate_limit"))
      else
        setError(
          apiError.data?.message ||
            apiError.message ||
            t("verify_email_invalid"),
        )
    } finally {
      setIsLoading(false)
    }
  }

  if (booting) {
    return <AuthLoadingFallback />
  }

  return (
    <AuthSplitPage
      badge={t("verify_email_badge")}
      title={t("verify_email_title")}
      description={t("verify_email_desc")}
      showFooter={false}
    >
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/30 px-3 py-3">
        <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-foreground">
            {t("verify_email_sent_to")}
          </p>
          <p className="truncate text-sm font-medium" dir="ltr">
            {email || "—"}
          </p>
          {sentHint ? (
            <p className="text-xs text-muted-foreground">
              {t("verify_email_resent")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <OtpCodeInput
          value={code}
          onChange={(value) => {
            setCode(value)
            setError(null)
            if (value.length === 6) void handleVerify(value)
          }}
          disabled={isLoading}
          aria-label={t("verify_email_code_label")}
          aria-invalid={!!error}
        />

        {error ? (
          <p
            className="rounded-xl bg-destructive/8 px-3 py-2 text-xs text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          size="lg"
          disabled={code.length !== 6 || isLoading}
          onClick={() => void handleVerify(code)}
          className={cn(
            "h-12 w-full rounded-full text-sm font-semibold transition-all sm:h-11",
            "bg-primary text-primary-foreground hover:opacity-95",
            "disabled:opacity-45",
          )}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t("verifying")}
            </span>
          ) : (
            t("verify_email_submit")
          )}
        </Button>

        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={isSending || cooldown > 0}
          className="block w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {isSending
            ? t("sending")
            : cooldown > 0
              ? t("resend_in", { seconds: String(cooldown) })
              : t("verify_email_resend")}
        </button>
      </div>

      <AuthFooter className="mt-8" />
    </AuthSplitPage>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
