"use client"

import React from "react"
import { AuthFooter } from "@/components/auth/auth-footer"
import { AuthLayout } from "@/components/auth/auth-layout"
import { cn } from "@/lib/utils"

interface AuthVerifyPageProps {
  badge?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  children: React.ReactNode
  showFooter?: boolean
  className?: string
}

/** Centered one-composition layout for OTP / code verification steps. */
export function AuthVerifyPage({
  badge,
  title,
  description,
  icon,
  children,
  showFooter = true,
  className,
}: AuthVerifyPageProps) {
  return (
    <AuthLayout variant="centered" className={cn("max-w-[28rem]", className)}>
      <div className="flex w-full flex-col items-stretch">
        <header className="mb-8 text-center sm:mb-10">
          {icon ? (
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-foreground/[0.06] text-foreground">
              {icon}
            </div>
          ) : null}
          {badge ? (
            <p className="mb-2 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {badge}
            </p>
          ) : null}
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
            {title}
          </h1>
          {description ? (
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
              {description}
            </p>
          ) : null}
        </header>

        <div className="w-full">{children}</div>

        {showFooter ? <AuthFooter className="mt-10" /> : null}
      </div>
    </AuthLayout>
  )
}
