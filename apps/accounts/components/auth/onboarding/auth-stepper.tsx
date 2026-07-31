"use client"

import React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthStepperProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function AuthStepper({ steps, currentStep, className }: AuthStepperProps) {
  return (
    <nav
      aria-label="Progress"
      className={cn("mb-8 flex w-full items-center gap-1.5", className)}
    >
      {steps.map((label, index) => {
        const stepNumber = index + 1
        const isComplete = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep

        return (
          <React.Fragment key={label}>
            <div className="flex min-w-0 items-center gap-1.5">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                  isComplete && "scale-90 bg-primary text-primary-foreground",
                  isCurrent &&
                    "bg-primary text-primary-foreground ring-4 ring-primary/15",
                  !isComplete &&
                    !isCurrent &&
                    "bg-muted text-muted-foreground",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? (
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={cn(
                  "hidden truncate text-xs transition-colors sm:block",
                  stepNumber <= currentStep
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>

            {index < steps.length - 1 ? (
              <div
                className={cn(
                  "h-0.5 min-w-4 flex-1 rounded-full transition-colors duration-500",
                  currentStep > stepNumber ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
            ) : null}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
