"use client"

import React, { useState } from "react"
import { ArrowUpRight, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
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
      <div className="auth-field flex h-12 items-center gap-2.5 overflow-hidden rounded-2xl border border-input/70 bg-background/80 px-3 backdrop-blur-sm sm:h-11 sm:rounded-full">
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" dir="ltr">
          {email}
        </span>
      </div>

      <Button
        type="button"
        size="lg"
        disabled={isLoading}
        onClick={handleSubmit}
        className="h-12 w-full rounded-full text-sm font-semibold sm:h-11"
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
      </Button>
    </div>
  )
}
