"use client"

import React, { Suspense } from "react"
import { useTranslations } from "next-intl"
import { AuthLoadingFallback } from "@/components/auth/auth-loading"
import { AuthSplitPage } from "@/components/auth/auth-split-page"
import { MethodChooser } from "@/components/auth/method-chooser"
import { useChooseMethodSession } from "@/hooks/use-choose-method-session"

function ChooseMethodContent() {
  const t = useTranslations("Auth")
  const { email, isLoading, has2FA, isSubscribed, sessionId } =
    useChooseMethodSession()

  if (!email) return null

  const headingParts = t("choose_method_heading").split("<br/>")

  return (
    <AuthSplitPage
      badge={t("choose_method_title")}
      title={
        headingParts.length > 1 ? (
          <>
            {headingParts[0]}
            <br />
            {headingParts[1]}
          </>
        ) : (
          headingParts[0]
        )
      }
      description={t("choose_method_desc")}
    >
      <MethodChooser
        has2FA={has2FA}
        isSubscribed={isSubscribed}
        isLoading={isLoading}
        sessionId={sessionId}
        email={email}
      />
    </AuthSplitPage>
  )
}

export default function ChooseMethodPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <ChooseMethodContent />
    </Suspense>
  )
}
