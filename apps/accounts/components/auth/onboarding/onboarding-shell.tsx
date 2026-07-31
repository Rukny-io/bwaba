"use client"

import React from "react"
import { AuthStepper } from "@/components/auth/onboarding/auth-stepper"
import { cn } from "@/lib/utils"

interface OnboardingShellProps {
  steps: string[]
  currentStep: number
  children: React.ReactNode
  footer?: React.ReactNode
  apiError?: string | null
  className?: string
}

export function OnboardingShell({
  steps,
  currentStep,
  children,
  footer,
  apiError,
  className,
}: OnboardingShellProps) {
  return (
    <div className={cn("w-full", className)}>
      <AuthStepper steps={steps} currentStep={currentStep} />

      {apiError ? (
        <div
          className="mb-4 animate-in rounded-xl bg-destructive/8 px-3 py-2.5 text-sm text-destructive fade-in slide-in-from-top-2"
          role="alert"
        >
          {apiError}
        </div>
      ) : null}

      <div className="w-full">{children}</div>

      {footer ? <div className="mt-8">{footer}</div> : null}
    </div>
  )
}
