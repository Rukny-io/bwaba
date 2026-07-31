"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { AlertTriangle, Clock, Link2, Loader2 } from "lucide-react"
import { AuthSplitPage } from "@/components/auth/auth-split-page"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ERROR_KEYS = ["used", "expired", "invalid", "processing"] as const
type VerifyErrorKey = (typeof ERROR_KEYS)[number]

const ERROR_ICONS: Record<VerifyErrorKey, React.ReactNode> = {
  used: <Link2 className="size-8 text-muted-foreground" aria-hidden />,
  expired: <Clock className="size-8 text-muted-foreground" aria-hidden />,
  invalid: <AlertTriangle className="size-8 text-amber-600" aria-hidden />,
  processing: null,
}

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 3000

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("Auth")
  const errorParam = searchParams.get("error") || "invalid"
  const error: VerifyErrorKey = ERROR_KEYS.includes(errorParam as VerifyErrorKey)
    ? (errorParam as VerifyErrorKey)
    : "invalid"
  const message = searchParams.get("message")
  const [retryCount, setRetryCount] = useState(0)
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (error !== "processing") return
    if (retryCount >= MAX_RETRIES) return

    retryTimerRef.current = setTimeout(() => {
      setRetryCount((c) => c + 1)
      window.location.reload()
    }, RETRY_DELAY_MS)

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [error, retryCount])

  const showRetryExhausted = error === "processing" && retryCount >= MAX_RETRIES
  const titleKey = showRetryExhausted
    ? "verify_failed_title"
    : (`verify_${error}_title` as const)
  const descKey = showRetryExhausted
    ? "verify_failed_desc"
    : (`verify_${error}_desc` as const)

  const isProcessing = error === "processing" && !showRetryExhausted

  return (
    <AuthSplitPage
      badge={t("login_badge")}
      title={t(titleKey)}
      description={
        showRetryExhausted
          ? t("verify_failed_desc")
          : message || t(descKey)
      }
    >
      {isProcessing ? (
        <div className="space-y-5 py-2 text-center">
          <Loader2
            className="mx-auto size-10 animate-spin text-primary"
            role="status"
            aria-label={t("verify_processing_title")}
          />
          <p className="text-xs text-muted-foreground">
            {t("verify_retry", { current: retryCount + 1, max: MAX_RETRIES })}
          </p>
        </div>
      ) : (
        <div className="space-y-6 py-2">
          <div
            className={cn(
              "mx-auto flex size-16 items-center justify-center rounded-full",
              showRetryExhausted || error === "invalid"
                ? "bg-amber-500/10"
                : "bg-muted/60",
            )}
          >
            {showRetryExhausted ? (
              <AlertTriangle className="size-8 text-amber-600" aria-hidden />
            ) : (
              ERROR_ICONS[error]
            )}
          </div>

          <Button
            onClick={() => router.replace("/login")}
            size="lg"
            className="h-12 w-full rounded-full text-sm font-semibold"
          >
            {t("verify_request_new")}
          </Button>
        </div>
      )}
    </AuthSplitPage>
  )
}

export default function AuthVerifyPage() {
  const t = useTranslations("Auth")

  return (
    <React.Suspense
      fallback={
        <AuthSplitPage
          badge={t("login_badge")}
          title={t("loading")}
          showFooter={false}
        >
          <Loader2
            className="mx-auto size-10 animate-spin text-primary"
            role="status"
            aria-label={t("loading")}
          />
        </AuthSplitPage>
      }
    >
      <VerifyContent />
    </React.Suspense>
  )
}
