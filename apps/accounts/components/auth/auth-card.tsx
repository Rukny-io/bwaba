"use client"

import React from "react"
import { Card } from "@heroui/react"
import {
  authBadgeClass,
  authLeadClass,
  authLinkClass,
  authTitleClass,
} from "@/components/auth/auth-ui"
import { cn } from "@/lib/utils"

interface AuthCardProps {
  children: React.ReactNode
  className?: string
  footer?: React.ReactNode
}

/** HeroUI Card shell for auth flows */
export function AuthCard({ children, className, footer }: AuthCardProps) {
  return (
    <Card variant="default" className={cn("w-full border border-[#E8E8E8] bg-white p-6 shadow-none sm:p-8", className)}>
      <Card.Content className="gap-0 p-0">{children}</Card.Content>
      {footer ? <div className="mt-8">{footer}</div> : null}
    </Card>
  )
}

interface AuthCardHeaderProps {
  badge?: string
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function AuthCardHeader({
  badge,
  title,
  description,
  icon,
  className,
}: AuthCardHeaderProps) {
  return (
    <header
      className={cn(
        "mb-7 flex flex-col items-center text-center sm:mb-8",
        className,
      )}
    >
      {icon ? (
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#F5F5F5] text-[#1D1D1D]">
          {icon}
        </div>
      ) : badge ? (
        <span className={cn(authBadgeClass, "mb-4")}>
          {badge}
        </span>
      ) : null}

      <h1 className={authTitleClass}>
        {title}
      </h1>

      {description ? (
        <p className={cn(authLeadClass, "mt-2.5 max-w-sm")}>
          {description}
        </p>
      ) : null}
    </header>
  )
}

export function AuthCardBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("w-full", className)}>{children}</div>
}

export function AuthCardBackLink({
  onClick,
  label,
  className,
}: {
  onClick: () => void
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        authLinkClass,
        "mb-6 flex items-center gap-1.5",
        className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-4 rtl:rotate-180"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
        />
      </svg>
      {label}
    </button>
  )
}
