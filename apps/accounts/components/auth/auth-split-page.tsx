"use client"

import React from "react"
import { AuthFooter } from "@/components/auth/auth-footer"
import { AuthLayout } from "@/components/auth/auth-layout"
import { cn } from "@/lib/utils"

interface AuthSplitPageProps {
  badge?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  showFooter?: boolean
  panelClassName?: string
  heroClassName?: string
}

export function AuthSplitPage({
  badge,
  title,
  description,
  children,
  showFooter = true,
  panelClassName,
  heroClassName,
}: AuthSplitPageProps) {
  return (
    <AuthLayout variant="split">
      <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-16 xl:gap-20">
        <section className={cn("text-center lg:text-start", heroClassName)}>
          {badge ? (
            <p className="text-xs font-medium tracking-wide text-muted-foreground">
              {badge}
            </p>
          ) : null}
          <h1
            className={cn(
              "text-[2rem] font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]",
              badge && "mt-3",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base lg:mx-0">
              {description}
            </p>
          ) : null}
        </section>

        <section
          className={cn("w-full lg:max-w-[26rem] lg:justify-self-end", panelClassName)}
        >
          {children}
          {showFooter ? <AuthFooter className="mt-8" /> : null}
        </section>
      </div>
    </AuthLayout>
  )
}
