"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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

const oauthButtonClassName = cn(
  "rounded-2xl border-border/60 bg-background/80 font-medium shadow-none backdrop-blur-sm",
  "transition-colors hover:border-border hover:bg-background",
)

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
          <Separator className="flex-1" />
          <span className="shrink-0 text-xs text-muted-foreground">
            {t("or_continue_with")}
          </span>
          <Separator className="flex-1" />
        </div>
      ) : null}

      <div
        className={cn(
          showSeparator ? "mt-4" : "",
          "gap-2",
          layout === "stack" ? "flex flex-col gap-2.5" : "grid grid-cols-3",
        )}
      >
        {enabledProviders.map(({ id, icon: Icon, nameKey, ariaKey, buttonId }) => (
          <Button
            key={id}
            id={buttonId}
            type="button"
            variant="outline"
            size="lg"
            onClick={() => onProvider(id)}
            aria-label={t(ariaKey)}
            className={cn(
              oauthButtonClassName,
              "w-full",
              layout === "stack"
                ? "h-12 rounded-full px-3 text-sm sm:h-11"
                : "h-11 justify-center px-2.5 text-xs sm:text-sm",
            )}
          >
            <span className="inline-flex min-w-0 items-center justify-center gap-2">
              <Icon className="size-4 shrink-0 sm:size-[1.125rem]" />
              <span className="truncate">{t(nameKey)}</span>
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}
