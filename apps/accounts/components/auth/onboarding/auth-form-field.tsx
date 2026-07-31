"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { status } from "@/lib/status-colors"

interface AuthFormFieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  hintTone?: "success" | "muted"
  children: React.ReactNode
  className?: string
}

export function AuthFormField({
  label,
  htmlFor,
  error,
  hint,
  hintTone = "muted",
  children,
  className,
}: AuthFormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p
          className={cn(
            "text-xs",
            hintTone === "success" ? status.successHint : "text-muted-foreground",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface AuthInputShellProps {
  children: React.ReactNode
  invalid?: boolean
  className?: string
}

export function AuthInputShell({
  children,
  invalid,
  className,
}: AuthInputShellProps) {
  return (
    <div
      className={cn(
        "auth-field flex h-12 items-center gap-2.5 overflow-hidden rounded-2xl border border-input/70 bg-background/80 px-3 backdrop-blur-sm transition-all sm:h-11 sm:rounded-full",
        "focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/15",
        invalid && "border-destructive/50 focus-within:border-destructive/50 focus-within:ring-destructive/15",
        className,
      )}
    >
      {children}
    </div>
  )
}

interface AuthTextInputProps
  extends Omit<React.ComponentProps<"input">, "className" | "prefix"> {
  className?: string
  shellClassName?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export function AuthTextInput({
  className,
  shellClassName,
  prefix,
  suffix,
  invalid,
  ...props
}: AuthTextInputProps & { invalid?: boolean }) {
  return (
    <AuthInputShell invalid={invalid} className={shellClassName}>
      {prefix}
      <input
        className={cn(
          "h-full min-w-0 flex-1 border-0 bg-transparent text-sm outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0",
          className,
        )}
        aria-invalid={invalid}
        {...props}
      />
      {suffix}
    </AuthInputShell>
  )
}
