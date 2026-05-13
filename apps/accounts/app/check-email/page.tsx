"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthFooter } from "@/components/auth/auth-footer"
import { CheckEmailCard } from "@/components/auth/check-email-card"
import { resendMagicLink, startVerifyIdentity } from "@/lib/api"

export default function CheckEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("auth_email")
    if (!storedEmail) {
      router.replace("/login")
      return
    }
    setEmail(storedEmail)

    // Pre-fetch available methods in background to speed up /choose-method
    startVerifyIdentity(storedEmail)
      .then((result) => {
        sessionStorage.setItem(`auth_methods_${storedEmail}`, JSON.stringify({
          has2FA: result.availableMethods.authenticator,
          isSubscribed: result.availableMethods.whatsapp || false,
          timestamp: Date.now()
        }))
      })
      .catch(() => {
        // Ignore errors, we'll try again in /choose-method
      })
  }, [router])

  if (!email) return null

  return (
    <AuthLayout>
      <CheckEmailCard
        email={email}
        onResend={async () => { await resendMagicLink(email) }}
        onTryOtherMethod={() => router.push("/choose-method")}
      />
      <AuthFooter />
    </AuthLayout>
  )
}
