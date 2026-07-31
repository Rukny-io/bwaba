"use client"

import { useTranslations } from "next-intl"
import { AuthSplitPage } from "@/components/auth/auth-split-page"
import { AuthStatus } from "@/components/auth/auth-status"

export function AuthLoadingFallback() {
  const t = useTranslations("Auth")

  return (
    <AuthSplitPage
      badge={t("login_badge")}
      title={t("loading")}
      showFooter={false}
    >
      <AuthStatus variant="loading" message={t("loading")} />
    </AuthSplitPage>
  )
}
