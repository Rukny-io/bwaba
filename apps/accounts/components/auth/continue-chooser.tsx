"use client"

import React from "react"
import { ArrowUpRight, FileText, Mail, UserRound } from "lucide-react"
import { useTranslations } from "next-intl"
import { AuthSplitPage } from "@/components/auth/auth-split-page"
import { resolveFormsUrl, resolveMailUrl } from "@/lib/env-urls"

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
              className="group flex items-start gap-4 rounded-2xl border border-border bg-background px-4 py-4 text-start transition-colors hover:bg-muted/60"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
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
