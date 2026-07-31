"use client"

import React from "react"
import { Check, Code2, Loader2, Store, User } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
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
    <div className="space-y-2.5">
      {accountTypes.map((option) => {
        const selected = value === option.id

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "group flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 text-start transition-all duration-200 sm:rounded-full sm:py-4",
              selected
                ? "border-primary/40 bg-primary/5 shadow-sm"
                : "border-border/60 bg-background/80 backdrop-blur-sm hover:border-primary/25 hover:bg-muted/40",
            )}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                selected
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground group-hover:text-foreground",
              )}
            >
              {option.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {t(option.labelKey)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(option.descriptionKey)}
              </p>
            </div>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background",
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

      <div className="mt-6 flex gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={isLoading}
          className="h-12 flex-1 rounded-full border-border/60 bg-background/80 text-sm font-semibold backdrop-blur-sm sm:h-11"
        >
          {t("back")}
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onFinish}
          disabled={isLoading}
          className="h-12 flex-1 rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:opacity-95 sm:h-11"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t("saving")}
            </span>
          ) : (
            t("start_now")
          )}
        </Button>
      </div>
    </div>
  )
}
