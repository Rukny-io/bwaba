"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { status } from "@/lib/status-colors"
import {
  authFieldShellClass,
  authInputClass,
  authLabelClass,
} from "@/components/auth/auth-ui"

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
      <label htmlFor={htmlFor} className={authLabelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-[#B91C1C]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p
          className={cn(
            "text-xs",
            hintTone === "success" ? status.successHint : "text-[#6B6F76]",
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
        authFieldShellClass,
        invalid &&
          "border-[#FCA5A5] focus-within:border-[#B91C1C]/50 focus-within:ring-[#B91C1C]/10",
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
        className={cn(authInputClass, "auth-email-input", className)}
        aria-invalid={invalid}
        {...props}
      />
      {suffix}
    </AuthInputShell>
  )
}
