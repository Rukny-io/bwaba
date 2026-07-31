"use client"

import React, { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { AuthLoadingFallback } from "@/components/auth/auth-loading"
import { AuthSplitPage } from "@/components/auth/auth-split-page"
import { CheckEmailCard } from "@/components/auth/check-email-card"
import { resendMagicLink, startVerifyIdentity } from "@/lib/api"

function CheckEmailContent() {
  const router = useRouter()
  const t = useTranslations("Auth")
  const [email, setEmail] = useState("")

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("auth_email")
    if (!storedEmail) {
      router.replace("/login")
      return
    }
    setEmail(storedEmail)

    startVerifyIdentity(storedEmail)
      .then((result) => {
        sessionStorage.setItem(
          `auth_methods_${storedEmail}`,
          JSON.stringify({
            has2FA: result.availableMethods.authenticator,
            isSubscribed: result.availableMethods.whatsapp || false,
            timestamp: Date.now(),
          }),
        )
      })
      .catch(() => {
        // Ignore errors, we'll try again in /choose-method
      })
  }, [router])

  if (!email) return null

  return (
    <AuthSplitPage
      badge={t("login_badge")}
      title={t("check_email_title")}
      description={
        <>
          {t("check_email_desc")}{" "}
          <span className="font-medium text-foreground" dir="ltr">
            {email}
          </span>
        </>
      }
    >
      <CheckEmailCard
        email={email}
        onResend={async () => {
          await resendMagicLink(email)
        }}
        onTryOtherMethod={() => router.push("/choose-method")}
      />
    </AuthSplitPage>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <CheckEmailContent />
    </Suspense>
  )
}
