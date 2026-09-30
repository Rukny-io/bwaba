"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  authBadgeClass,
  authLeadClass,
  authTitleClass,
} from "@/components/auth/auth-ui"

interface AuthPageHeaderProps {
  badge?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function AuthPageHeader({
  badge,
  title,
  description,
  icon,
  className,
}: AuthPageHeaderProps) {
  return (
    <header className={cn("text-center", className)}>
      {icon ? (
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#F5F5F5] text-[#1D1D1D]">
          {icon}
        </div>
      ) : null}
      {badge ? <p className={authBadgeClass}>{badge}</p> : null}
      <h1 className={cn(authTitleClass, badge || icon ? "mt-4" : undefined)}>
        {title}
      </h1>
      {description ? (
        <p className={cn(authLeadClass, "mt-3")}>{description}</p>
      ) : null}
    </header>
  )
}
