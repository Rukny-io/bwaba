"use client"

import React from "react"
import { ArrowUpRight, FileText, Mail, UserRound } from "lucide-react"
import { useTranslations } from "next-intl"
import { AuthSplitPage } from "@/components/auth/auth-split-page"
import { authCardClass } from "@/components/auth/auth-ui"
import { resolveFormsUrl, resolveMailUrl } from "@/lib/env-urls"
import { cn } from "@/lib/utils"

export function ContinueChooser() {
  const t = useTranslations("Continue")
  const formsUrl = `${resolveFormsUrl().replace(/\/$/, "")}/app`
  const mailUrl = `${resolveMailUrl().replace(/\/$/, "")}/apps`

  const destinations = [
    {
      href: formsUrl,
      icon: FileText,
      title: t("forms_title"),
      description: t("forms_desc"),
    },
    {
      href: mailUrl,
      icon: Mail,
      title: t("mail_title"),
      description: t("mail_desc"),
    },
    {
      href: "/manage",
      icon: UserRound,
      title: t("account_title"),
      description: t("account_desc"),
    },
  ] as const

  return (
    <AuthSplitPage badge={t("badge")} title={t("title")} description={t("subtitle")}>
      <div className="grid gap-3">
        {destinations.map((item) => {
          const Icon = item.icon
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn("group flex items-start gap-4", authCardClass)}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-[#1D1D1D]">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[#1D1D1D]">
                    {item.title}
                  </span>
                  <ArrowUpRight className="size-4 text-[#9CA3AF] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-[#6B6F76]">
                  {item.description}
                </span>
              </span>
            </a>
          )
        })}
      </div>
    </AuthSplitPage>
  )
}
