"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { getEnabledLoginOAuthProviders } from "@/lib/auth/oauth-providers"
import {
  FacebookIcon,
  GitHubIcon,
  GoogleIcon,
  LinkedInIcon,
} from "@/components/auth/provider-icons"

export type OAuthProviderId = "google" | "github" | "linkedin" | "facebook"

const OAUTH_PROVIDERS: {
  id: OAuthProviderId
  icon: (props: { className?: string }) => React.ReactElement
  nameKey: "provider_google" | "provider_github" | "provider_linkedin" | "provider_facebook"
  ariaKey:
    | "continue_with_google"
    | "continue_with_github"
    | "continue_with_linkedin"
    | "continue_with_facebook"
  buttonId: string
}[] = [
  {
    id: "github",
    icon: GitHubIcon,
    nameKey: "provider_github",
    ariaKey: "continue_with_github",
    buttonId: "github-login-btn",
  },
  {
    id: "google",
    icon: GoogleIcon,
    nameKey: "provider_google",
    ariaKey: "continue_with_google",
    buttonId: "google-login-btn",
  },
  {
    id: "linkedin",
    icon: LinkedInIcon,
    nameKey: "provider_linkedin",
    ariaKey: "continue_with_linkedin",
    buttonId: "linkedin-login-btn",
  },
  {
    id: "facebook",
    icon: FacebookIcon,
    nameKey: "provider_facebook",
    ariaKey: "continue_with_facebook",
    buttonId: "facebook-login-btn",
  },
]

const oauthButtonClassName =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#E8E8E8] bg-white px-3 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:bg-[#FAFAFA]"

interface AuthOAuthButtonsProps {
  onProvider: (provider: OAuthProviderId) => void
  className?: string
  /** `stack` — full-width rows; `grid` — 3-column icon grid */
  layout?: "grid" | "stack"
  showSeparator?: boolean
}

export function AuthOAuthButtons({
  onProvider,
  className,
  layout = "grid",
  showSeparator = true,
}: AuthOAuthButtonsProps) {
  const t = useTranslations("Auth")
  const enabledProviders = OAUTH_PROVIDERS.filter((provider) =>
    getEnabledLoginOAuthProviders().includes(provider.id),
  )
  const count = enabledProviders.length

  if (count === 0) {
    return null
  }

  return (
    <div className={cn("w-full", className)}>
      {showSeparator ? (
        <div className="flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-[#E8E8E8]" />
          <span className="shrink-0 text-xs text-[#9CA3AF]">
            {t("or_continue_with")}
          </span>
          <div className="h-px flex-1 bg-[#E8E8E8]" />
        </div>
      ) : null}

      <div
        className={cn(
          showSeparator ? "mt-4" : "",
          layout === "stack" ? "flex flex-col gap-2.5" : "grid grid-cols-3 gap-2",
        )}
      >
        {enabledProviders.map(({ id, icon: Icon, nameKey, ariaKey, buttonId }) => (
          <button
            key={id}
            id={buttonId}
            type="button"
            onClick={() => onProvider(id)}
            aria-label={t(ariaKey)}
            className={cn(
              oauthButtonClassName,
              layout === "grid" && "px-2.5 text-xs sm:text-sm",
            )}
          >
            <Icon className="size-4 shrink-0 sm:size-[1.125rem]" />
            <span className="truncate">{t(nameKey)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
