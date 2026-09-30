"use client"

import React from "react"
import { AuthFooter } from "@/components/auth/auth-footer"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthPageHeader } from "@/components/auth/auth-page-header"
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
    <AuthLayout className={className}>
      <div className="flex w-full flex-col items-stretch">
        <AuthPageHeader
          badge={badge}
          title={title}
          description={description}
          icon={icon}
        />

        <div className="mt-8 w-full">{children}</div>

        {showFooter ? <AuthFooter className="mt-8" /> : null}
      </div>
    </AuthLayout>
  )
}
