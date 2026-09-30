"use client"

import React from "react"
import { Check, Code2, Loader2, Store, User } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  authBtnPrimaryClass,
  authBtnRowClass,
  authBtnSecondaryClass,
  authCardClass,
  authChipSelectedClass,
} from "@/components/auth/auth-ui"
import { cn } from "@/lib/utils"

export type AccountType = "user" | "store" | "developer"

interface AccountTypeOption {
  id: AccountType
  icon: React.ReactNode
  labelKey: "type_user" | "type_store" | "type_developer"
  descriptionKey:
    | "type_user_desc"
    | "type_store_desc"
    | "type_developer_desc"
}

const accountTypes: AccountTypeOption[] = [
  {
    id: "user",
    icon: <User className="size-5" strokeWidth={1.5} />,
    labelKey: "type_user",
    descriptionKey: "type_user_desc",
  },
  {
    id: "store",
    icon: <Store className="size-5" strokeWidth={1.5} />,
    labelKey: "type_store",
    descriptionKey: "type_store_desc",
  },
  {
    id: "developer",
    icon: <Code2 className="size-5" strokeWidth={1.5} />,
    labelKey: "type_developer",
    descriptionKey: "type_developer_desc",
  },
]

interface AccountTypeSelectorProps {
  value: AccountType
  onChange: (value: AccountType) => void
}

export function AccountTypeSelector({
  value,
  onChange,
}: AccountTypeSelectorProps) {
  const t = useTranslations("Auth")

  return (
    <div className="space-y-2">
      {accountTypes.map((option) => {
        const selected = value === option.id

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "group flex w-full cursor-pointer items-center gap-3",
              authCardClass,
              selected && authChipSelectedClass,
            )}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                selected
                  ? "bg-[#1D1D1D] text-white"
                  : "bg-[#F5F5F5] text-[#6B6F76]",
              )}
            >
              {option.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#1D1D1D]">
                {t(option.labelKey)}
              </p>
              <p className="text-xs text-[#6B6F76]">
                {t(option.descriptionKey)}
              </p>
            </div>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all",
                selected
                  ? "border-[#1D1D1D] bg-[#1D1D1D] text-white"
                  : "border-[#E8E8E8] bg-white",
              )}
              aria-hidden
            >
              {selected ? <Check className="size-3" strokeWidth={3} /> : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}

interface AccountTypeStepProps {
  value: AccountType
  onChange: (value: AccountType) => void
  onBack: () => void
  onFinish: () => void
  isLoading?: boolean
}

export function AccountTypeStep({
  value,
  onChange,
  onBack,
  onFinish,
  isLoading = false,
}: AccountTypeStepProps) {
  const t = useTranslations("Auth")

  return (
    <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
      <AccountTypeSelector value={value} onChange={onChange} />

      <div className={cn(authBtnRowClass, "mt-6")}>
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className={cn(authBtnSecondaryClass, "flex-1")}
        >
          {t("back")}
        </button>
        <button
          type="button"
          onClick={onFinish}
          disabled={isLoading}
          className={cn(authBtnPrimaryClass, "flex-1")}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t("saving")}
            </span>
          ) : (
            t("start_now")
          )}
        </button>
      </div>
    </div>
  )
}
