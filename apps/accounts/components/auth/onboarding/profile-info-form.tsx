"use client"

import React from "react"
import { ArrowUpRight, Check, Loader2, User, X } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  AuthFormField,
  AuthTextInput,
} from "@/components/auth/onboarding/auth-form-field"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { status } from "@/lib/status-colors"

interface ProfileInfoFormProps {
  fullName: string
  username: string
  email?: string
  errors: Record<string, string>
  usernameAvailable: boolean | null
  isCheckingUsername: boolean
  isSubmitting?: boolean
  submitDisabled?: boolean
  onFullNameChange: (value: string) => void
  onUsernameChange: (value: string) => void
  onSubmit: (event: React.FormEvent) => void
}

export function ProfileInfoForm({
  fullName,
  username,
  errors,
  usernameAvailable,
  isCheckingUsername,
  isSubmitting = false,
  submitDisabled = false,
  onFullNameChange,
  onUsernameChange,
  onSubmit,
}: ProfileInfoFormProps) {
  const t = useTranslations("Auth")

  return (
    <form
      onSubmit={onSubmit}
      className="w-full space-y-4 animate-in fade-in slide-in-from-right-4 duration-300"
      noValidate
    >
      <AuthFormField
        label={t("full_name_label")}
        htmlFor="fullName"
        error={errors.fullName}
      >
        <AuthTextInput
          id="fullName"
          type="text"
          placeholder={t("full_name_placeholder")}
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
          invalid={!!errors.fullName}
          autoFocus
          autoComplete="name"
          prefix={<User className="size-4 shrink-0 text-muted-foreground" />}
        />
      </AuthFormField>

      <AuthFormField
        label={t("username_label")}
        htmlFor="username"
        error={errors.username}
        hint={
          usernameAvailable === true && !errors.username
            ? t("username_available")
            : undefined
        }
        hintTone="success"
      >
        <AuthTextInput
          id="username"
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          invalid={!!errors.username || usernameAvailable === false}
          autoComplete="username"
          dir="ltr"
          className="text-left"
          prefix={
            <span className="shrink-0 text-sm text-muted-foreground">@</span>
          }
          suffix={
            username.length >= 3 ? (
              <span className="flex shrink-0 items-center">
                {isCheckingUsername ? (
                  <Loader2
                    className="size-4 animate-spin text-muted-foreground"
                    aria-hidden
                  />
                ) : usernameAvailable === true ? (
                  <Check
                    className={cn("size-4", status.successIcon)}
                    strokeWidth={2.5}
                    aria-hidden
                  />
                ) : usernameAvailable === false ? (
                  <X
                    className="size-4 text-destructive"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                ) : null}
              </span>
            ) : null
          }
        />
      </AuthFormField>

      <Button
        type="submit"
        size="lg"
        disabled={
          submitDisabled ||
          isSubmitting ||
          isCheckingUsername ||
          usernameAvailable === false
        }
        className={cn(
          "mt-2 h-12 w-full rounded-full text-sm font-semibold transition-all sm:h-11",
          "bg-primary text-primary-foreground hover:opacity-95 disabled:opacity-45",
        )}
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("saving")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            {t("next")}
            <ArrowUpRight className="size-4 rtl:rotate-180" aria-hidden />
          </span>
        )}
      </Button>
    </form>
  )
}
