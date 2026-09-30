"use client"

import React, { useState } from "react"
import { ArrowUpRight, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  authBtnPrimaryClass,
  authFieldShellClass,
  authInputClass,
} from "@/components/auth/auth-ui"
import { cn } from "@/lib/utils"

interface EmailVerificationActionProps {
  email: string
  onSubmit: () => Promise<void>
  className?: string
}

export function EmailVerificationAction({
  email,
  onSubmit,
  className,
}: EmailVerificationActionProps) {
  const t = useTranslations("Auth")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await onSubmit()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className={authFieldShellClass}>
        <span
          className={cn(authInputClass, "font-medium")}
          dir="ltr"
        >
          {email}
        </span>
      </div>

      <button
        type="button"
        disabled={isLoading}
        onClick={handleSubmit}
        className={authBtnPrimaryClass}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("sending")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            {t("resend_link")}
            <ArrowUpRight className="size-4 rtl:rotate-180" />
          </span>
        )}
      </button>
    </div>
  )
}
