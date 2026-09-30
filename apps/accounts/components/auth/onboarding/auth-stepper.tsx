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
                  isComplete && "scale-90 bg-[#1D1D1D] text-white",
                  isCurrent &&
                    "bg-[#1D1D1D] text-white ring-4 ring-[#1D1D1D]/10",
                  !isComplete &&
                    !isCurrent &&
                    "bg-[#F5F5F5] text-[#9CA3AF]",
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
                    ? "font-medium text-[#1D1D1D]"
                    : "text-[#9CA3AF]",
                )}
              >
                {label}
              </span>
            </div>

            {index < steps.length - 1 ? (
              <div
                className={cn(
                  "h-0.5 min-w-4 flex-1 rounded-full transition-colors duration-500",
                  currentStep > stepNumber ? "bg-[#1D1D1D]" : "bg-[#E8E8E8]",
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
