"use client"

import React from "react"
import { AuthFooter } from "@/components/auth/auth-footer"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthPageHeader } from "@/components/auth/auth-page-header"
import { cn } from "@/lib/utils"

interface AuthSplitPageProps {
  badge?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  children: React.ReactNode
  showFooter?: boolean
  contentClassName?: string
  layoutClassName?: string
}

/** Centered auth page — aligned with apps/mail login layout. */
export function AuthSplitPage({
  badge,
  title,
  description,
  icon,
  children,
  showFooter = true,
  contentClassName,
  layoutClassName,
}: AuthSplitPageProps) {
  return (
    <AuthLayout className={layoutClassName}>
      <div className={cn("w-full", contentClassName)}>
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
