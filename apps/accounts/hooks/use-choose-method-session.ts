"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { VerificationMethod } from "@/components/auth/method-chooser"
import { isVerificationMethodAvailable } from "@/lib/auth/choose-method"
import { startVerifyIdentity } from "@/lib/api"

export function useChooseMethodSession() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [has2FA, setHas2FA] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const ensureSessionId = useCallback(async () => {
    if (sessionId) return sessionId
    if (!email) return null

    const result = await startVerifyIdentity(email)
    if (result.pendingSessionId) {
      setSessionId(result.pendingSessionId)
      return result.pendingSessionId
    }

    return null
  }, [email, sessionId])

  const isMethodAvailable = useCallback(
    (method: VerificationMethod) =>
      isVerificationMethodAvailable(method, has2FA, isSubscribed),
    [has2FA, isSubscribed],
  )

  useEffect(() => {
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
      setHas2FA(true)
      sessionStorage.setItem("auth_pending_2fa_session", urlSessionId)
    } else {
      const storedSession = sessionStorage.getItem("auth_pending_2fa_session")
      if (storedSession) {
        setSessionId(storedSession)
        setHas2FA(true)
      }
    }

    const cachedData = sessionStorage.getItem(`auth_methods_${finalEmail}`)
    if (cachedData) {
      try {
        const { has2FA: cached2FA, isSubscribed: cachedSub } =
          JSON.parse(cachedData)
        if (!urlSessionId) setHas2FA(cached2FA)
        setIsSubscribed(cachedSub)
        setIsLoading(false)
      } catch {
        // ignore invalid cache
      }
    }

    startVerifyIdentity(finalEmail)
      .then((result) => {
        const fresh2FA =
          Boolean(result.availableMethods.authenticator) || Boolean(urlSessionId)
        const freshSub = result.availableMethods.whatsapp || false

        setHas2FA(fresh2FA)
        setIsSubscribed(freshSub)

        sessionStorage.setItem(
          `auth_methods_${finalEmail}`,
          JSON.stringify({
            has2FA: fresh2FA,
            isSubscribed: freshSub,
            timestamp: Date.now(),
          }),
        )

        if (result.pendingSessionId && !urlSessionId) {
          setSessionId(result.pendingSessionId)
          sessionStorage.setItem(
            "auth_pending_2fa_session",
            result.pendingSessionId,
          )
        }
      })
      .catch(() => {
        // Keep email path; preserve has2FA when we already have a 2FA session.
        if (urlSessionId) setHas2FA(true)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [router, searchParams])

  return {
    email,
    isLoading,
    has2FA,
    isSubscribed,
    sessionId,
    setSessionId,
    ensureSessionId,
    isMethodAvailable,
    router,
  }
}
