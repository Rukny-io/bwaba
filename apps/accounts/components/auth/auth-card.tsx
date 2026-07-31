"use client"

import React from "react"
import { Card } from "@heroui/react"
import { cn } from "@/lib/utils"

interface AuthCardProps {
  children: React.ReactNode
  className?: string
  footer?: React.ReactNode
}

/** HeroUI Card shell for auth flows */
export function AuthCard({ children, className, footer }: AuthCardProps) {
  return (
    <Card variant="default" className={cn("w-full border border-border/40 p-6 shadow-none sm:p-8", className)}>
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
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted/35 text-muted-foreground">
          {icon}
        </div>
      ) : badge ? (
        <span className="mb-4 text-xs font-medium tracking-wide text-muted-foreground">
          {badge}
        </span>
      ) : null}

      <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>

      {description ? (
        <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
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
        "mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
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
