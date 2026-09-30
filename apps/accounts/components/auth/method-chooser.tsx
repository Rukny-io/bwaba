"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { authCardClass } from "@/components/auth/auth-ui"
import { chooseMethodPath } from "@/lib/auth/choose-method"

export type VerificationMethod = "authenticator" | "backup-code" | "email"

interface Method {
  id: VerificationMethod
  icon: React.ReactNode
  requires2FA?: boolean
}

const methods: Method[] = [
  {
    id: "authenticator",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
        />
      </svg>
    ),
    requires2FA: true,
  },
  {
    id: "backup-code",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z"
        />
      </svg>
    ),
    requires2FA: true,
  },
  {
    id: "email",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
        />
      </svg>
    ),
  },
]

function methodLabelKey(id: VerificationMethod) {
  return `method_${id.replace("-", "_")}` as const
}

interface MethodChooserProps {
  has2FA?: boolean
  className?: string
  isLoading?: boolean
  sessionId?: string | null
  email?: string | null
}

export function MethodChooser({
  has2FA = false,
  className,
  isLoading = false,
  sessionId,
  email,
}: MethodChooserProps) {
  const router = useRouter()
  const t = useTranslations("Auth")

  const visibleMethods = methods.filter((method) => {
    if (method.id === "email") return true
    if (isLoading && method.requires2FA) return true
    if (method.requires2FA && !has2FA) return false
    return true
  })

  const handleSelect = (method: VerificationMethod) => {
    if (isLoading) return
    router.push(chooseMethodPath(method, { sessionId, email }))
  }

  return (
    <div className={cn("w-full", className)}>
      <ul className="flex flex-col gap-2" aria-label={t("choose_method_title")}>
        {visibleMethods.map((method) => {
          if (isLoading && method.requires2FA && method.id !== "email") {
            return (
              <li key={method.id}>
                <div className="h-[4.5rem] animate-pulse rounded-2xl bg-[#F5F5F5]" />
              </li>
            )
          }

          if (method.requires2FA && !has2FA && method.id !== "email") {
            return null
          }

          const label = t(methodLabelKey(method.id))

          return (
            <li key={method.id}>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSelect(method.id)}
                className={cn(
                  "flex w-full items-center gap-3 text-start",
                  authCardClass,
                  isLoading && "cursor-not-allowed opacity-55 hover:bg-white",
                )}
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F5F5] text-[#6B6F76]">
                  {method.icon}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[#1D1D1D]">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-[#6B6F76]">
                    {t(`${methodLabelKey(method.id)}_desc` as const)}
                  </span>
                </span>

                {!isLoading ? (
                  <ChevronRight
                    className="size-4 shrink-0 text-[#9CA3AF] rtl:rotate-180"
                    aria-hidden
                  />
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function getDefaultVerificationMethod(
  has2FA: boolean,
): VerificationMethod {
  return has2FA ? "authenticator" : "email"
}

export function getVerificationMethodMeta(
  method: VerificationMethod,
  t: (key: string) => string,
) {
  switch (method) {
    case "authenticator":
      return {
        title: t("enter_auth_code"),
        description: t("desc_auth"),
      }
    case "backup-code":
      return {
        title: t("enter_backup_code"),
        description: t("desc_backup"),
      }
    default:
      return {
        title: t("method_email"),
        description: t("method_email_desc"),
      }
  }
}
