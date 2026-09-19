"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { LegalSectionBlock } from "@/components/legal/legal-section"
import {
  LegalSidebar,
  type LegalNavGroup,
} from "@/components/legal/legal-sidebar"
import type { LegalDocumentContent } from "@/lib/legal/types"
import { switchLocale } from "@/lib/switch-locale"

type LegalPageKind = "terms" | "privacy"

interface LegalPageProps {
  kind: LegalPageKind
  contentAr: LegalDocumentContent
  contentEn: LegalDocumentContent
}

const RELATED: Record<
  LegalPageKind,
  { href: string; labelAr: string; labelEn: string }
> = {
  terms: {
    href: "/privacy",
    labelAr: "سياسة الخصوصية",
    labelEn: "Privacy Policy",
  },
  privacy: {
    href: "/terms",
    labelAr: "شروط الاستخدام",
    labelEn: "Terms of Use",
  },
}

function buildNavGroups(
  kind: LegalPageKind,
  content: LegalDocumentContent,
  isEn: boolean,
): LegalNavGroup[] {
  const byId = new Map(content.sections.map((section) => [section.id, section]))

  const pick = (ids: string[]) =>
    ids
      .map((id) => byId.get(id))
      .filter((section): section is NonNullable<typeof section> => Boolean(section))
      .filter((section) => !section.tocIgnore)
      .map((section) => ({ id: section.id, label: section.title }))

  if (kind === "privacy") {
    return [
      {
        label: isEn ? "Overview" : "نظرة عامة",
        items: pick(["intro", "collection"]),
      },
      {
        label: isEn ? "Products" : "المنتجات",
        items: pick(["mail-data", "forms-data", "developer-data"]),
      },
      {
        label: isEn ? "Use & sharing" : "الاستخدام والمشاركة",
        items: pick(["usage", "sharing", "retention", "security"]),
      },
      {
        label: isEn ? "Your control" : "حقوقك",
        items: pick([
          "rights",
          "cookies",
          "oauth",
          "international",
          "children",
          "changes",
          "contact",
        ]),
      },
    ].filter((group) => group.items.length > 0)
  }

  return [
    {
      label: isEn ? "Basics" : "الأساسيات",
      items: pick(["acceptance", "platform", "account"]),
    },
    {
      label: isEn ? "Products" : "المنتجات",
      items: pick(["mail", "forms", "developer"]),
    },
    {
      label: isEn ? "Rules & billing" : "القواعد والفوترة",
      items: pick(["aup", "availability", "billing", "ip", "liability"]),
    },
    {
      label: isEn ? "End & law" : "الإنهاء والقانون",
      items: pick(["termination", "governing-law", "updates", "contact"]),
    },
  ].filter((group) => group.items.length > 0)
}

export function LegalPage({ kind, contentAr, contentEn }: LegalPageProps) {
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations("Auth")
  const isEn = locale === "en"
  const content = isEn ? contentEn : contentAr
  const related = RELATED[kind]
  const productTitle = content.title

  const navGroups = useMemo(
    () => buildNavGroups(kind, content, isEn),
    [kind, content, isEn],
  )

  return (
    <div
      className="legal-docs-shell flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]"
      dir={isEn ? "ltr" : "rtl"}
      lang={isEn ? "en" : "ar"}
    >
      <header
        dir="ltr"
        className="sticky top-0 z-40 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[var(--background)]/85 backdrop-blur-md"
      >
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 px-5 sm:h-[3.75rem] sm:px-6 lg:max-w-6xl">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
            <Link
              href={kind === "privacy" ? "/privacy" : "/terms"}
              className="flex min-w-0 items-center gap-2 sm:gap-2.5"
            >
              <Image
                src="/rukny-logo.svg"
                alt="Rukny"
                width={28}
                height={28}
                className="size-7 shrink-0 dark:brightness-0 dark:invert"
                priority
              />
              <span className="truncate text-sm font-medium tracking-tight text-[var(--foreground)]/90 sm:text-base">
                Rukny Legal
              </span>
            </Link>
            <span className="hidden text-[13px] text-[var(--muted-foreground)] sm:inline">
              /
            </span>
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/privacy"
                className={
                  kind === "privacy"
                    ? "text-[13px] font-medium text-[var(--foreground)]"
                    : "text-[13px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
                }
              >
                {isEn ? "Privacy" : "الخصوصية"}
              </Link>
              <Link
                href="/terms"
                className={
                  kind === "terms"
                    ? "text-[13px] font-medium text-[var(--foreground)]"
                    : "text-[13px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
                }
              >
                {isEn ? "Terms" : "الشروط"}
              </Link>
            </div>
          </div>

          <nav className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => switchLocale(locale, router)}
              className="hidden h-9 items-center px-2.5 text-[13px] font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] sm:inline-flex"
              aria-label={t("language")}
            >
              {t("language")}
            </button>
            <Link
              href="/login"
              className="inline-flex h-8 items-center rounded-full bg-[var(--primary)] px-3 text-[12.5px] font-semibold text-[var(--primary-foreground)] transition-colors hover:opacity-90 sm:h-9 sm:text-[13px]"
            >
              {isEn ? "Sign in" : "تسجيل الدخول"}
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-8 sm:px-6 sm:pt-10 lg:pb-16">
          <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10 xl:gap-12">
            <LegalSidebar
              productTitle={productTitle}
              groups={navGroups}
              isEn={isEn}
            />

            <article className="min-w-0">
              <header className="mb-8 max-w-2xl sm:mb-10">
                <p className="text-[13px] font-medium text-[var(--muted-foreground)]">
                  {isEn ? "Legal" : "القانوني"}
                </p>
                <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-[var(--foreground)] sm:text-[2.25rem] sm:leading-[1.15]">
                  {content.title}
                </h1>
                <p className="mt-3 text-[15px] leading-7 text-[var(--muted-foreground)] sm:text-base sm:leading-8">
                  {content.description}
                </p>
                <p className="mt-3 text-[13px] text-[var(--muted-foreground)]">
                  {isEn
                    ? `Updated ${content.lastUpdated}. See also `
                    : `آخر تحديث ${content.lastUpdated}. راجع أيضًا `}
                  <Link
                    href={related.href}
                    className="font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:decoration-[var(--foreground)]"
                  >
                    {isEn ? related.labelEn : related.labelAr}
                  </Link>
                  .
                </p>
              </header>

              <div className="max-w-2xl space-y-10 text-[15px] leading-7 text-[var(--foreground)] sm:space-y-12 sm:text-base sm:leading-8">
                {content.sections.map((section) => (
                  <LegalSectionBlock key={section.id} section={section} />
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>

      <footer dir="ltr" className="mt-auto border-t border-[var(--border)]">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 py-8 text-[13px] text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:max-w-6xl">
          <p>© {new Date().getFullYear()} Rukny</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/privacy"
              className="transition-colors hover:text-[var(--foreground)]"
            >
              {isEn ? "Privacy" : "الخصوصية"}
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-[var(--foreground)]"
            >
              {isEn ? "Terms" : "الشروط"}
            </Link>
            <Link
              href="/login"
              className="transition-colors hover:text-[var(--foreground)]"
            >
              {isEn ? "Sign in" : "تسجيل الدخول"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
