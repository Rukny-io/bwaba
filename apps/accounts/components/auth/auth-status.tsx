"use client"

import React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AuthStatusProps {
  variant?: "loading" | "error"
  message: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function AuthStatus({
  variant = "loading",
  message,
  actionLabel,
  onAction,
  className,
}: AuthStatusProps) {
  return (
    <div className={cn("w-full space-y-5 py-2", className)}>
      {variant === "loading" ? (
        <Loader2
          className="mx-auto size-10 animate-spin text-primary"
          role="status"
          aria-label={message}
        />
      ) : (
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-6 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
      )}

      <p
        className={cn(
          "text-center text-sm",
          variant === "error" ? "text-destructive" : "text-muted-foreground",
        )}
        role={variant === "error" ? "alert" : "status"}
      >
        {message}
      </p>

      {variant === "error" && actionLabel && onAction ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onAction}
            className="h-11 rounded-full px-6"
          >
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
