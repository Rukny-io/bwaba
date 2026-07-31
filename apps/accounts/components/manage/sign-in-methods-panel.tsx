"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  fetchLinkedProviders,
  initiateProviderLink,
  unlinkProvider,
} from "@/lib/manage/api";
import type { LinkedProvidersStatus, OAuthProvider } from "@/lib/manage/types";
import { getLinkableOAuthProviders } from "@/lib/auth/oauth-providers";
import type { ProviderIconId } from "@/components/auth/provider-icons";
import { useManage } from "@/lib/manage/context";
import { cn } from "@/lib/utils";
import { ManageBrandIcon } from "./manage-brand-icon";
import { PasswordManageSection } from "./password-manage-section";
import {
  ManageGroup,
  ManagePageHeader,
  ManagePageStack,
  ManageSpinner,
  ui,
} from "./manage-ui";

const PROVIDERS: {
  id: ProviderIconId;
  labelKey: string;
}[] = [
  { id: "google", labelKey: "providers.google" },
  { id: "linkedin", labelKey: "providers.linkedin" },
  { id: "github", labelKey: "providers.github" },
  { id: "facebook", labelKey: "providers.facebook" },
  { id: "quicksign", labelKey: "providers.email" },
];

export function SignInMethodsPanel() {
  const t = useTranslations("Manage");
  const { refreshSummary } = useManage();
  const [status, setStatus] = useState<LinkedProvidersStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLinkedProviders();
      setStatus(data);
    } catch {
      setError(t("sign_in_methods.load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const isLinked = (id: string): boolean => {
    if (!status) return false;
    if (id === "quicksign") return status.quicksign.available;
    return status[id as OAuthProvider]?.linked ?? false;
  };

  const canUnlink = (id: OAuthProvider): boolean => {
    if (!status) return false;
    const map = {
      google: status.canUnlinkGoogle,
      github: status.canUnlinkGithub,
      linkedin: status.canUnlinkLinkedin,
      facebook: status.canUnlinkFacebook,
    };
    return map[id];
  };

  const handleLink = (provider: OAuthProvider) => {
    if (!getLinkableOAuthProviders().includes(provider)) {
      return;
    }
    initiateProviderLink(provider);
  };

  const visibleProviders = PROVIDERS.filter((provider) => {
    if (provider.id === "quicksign") return true;
    const oauthId = provider.id as OAuthProvider;
    return (
      getLinkableOAuthProviders().includes(oauthId) || isLinked(provider.id)
    );
  });

  const handleUnlink = async (provider: OAuthProvider) => {
    setActionLoading(provider);
    setError(null);
    try {
      await unlinkProvider(provider);
      await load();
      await refreshSummary();
    } catch (err) {
      const message =
        (err as Error & { data?: { message?: string } }).data?.message ||
        t("sign_in_methods.unlink_error");
      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const linkedCount = visibleProviders.filter((p) => isLinked(p.id)).length;

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("sign_in_methods.title")}
        titleShort={t("security.sign_in_methods_short")}
        description={t("sign_in_methods.description")}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PasswordManageSection />

      {loading ? (
        <ManageSpinner />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 px-0.5 pt-2">
            <p className="text-xs text-muted-foreground">
              {t("sign_in_methods.linked_count", {
                count: linkedCount,
                total: visibleProviders.length,
              })}
            </p>
          </div>

          <ManageGroup>
            {visibleProviders.map((provider) => {
              const linked = isLinked(provider.id);
              const isOAuth = provider.id !== "quicksign";

              return (
                <div
                  key={provider.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5",
                    ui.divider,
                    linked && "bg-primary/[0.02]",
                  )}
                >
                  <ManageBrandIcon provider={provider.id} />

                  <div className="min-w-0 flex-1 py-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium leading-snug text-foreground">
                        {t(provider.labelKey)}
                      </p>
                      <Badge
                        variant={linked ? "secondary" : "outline"}
                        className="text-[10px] font-normal"
                      >
                        {linked ? t("badges.linked") : t("badges.not_linked")}
                      </Badge>
                    </div>
                    {!linked && isOAuth && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t("sign_in_methods.not_linked_hint")}
                      </p>
                    )}
                  </div>

                  {isOAuth && (
                    <div className="shrink-0">
                      {linked ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            !canUnlink(provider.id as OAuthProvider) ||
                            actionLoading === provider.id
                          }
                          onClick={() => handleUnlink(provider.id as OAuthProvider)}
                          className="h-8 rounded-full border-destructive/30 px-3 text-xs text-destructive hover:bg-destructive/5"
                        >
                          {actionLoading === provider.id
                            ? t("sign_in_methods.unlinking")
                            : t("sign_in_methods.unlink")}
                        </Button>
                      ) : getLinkableOAuthProviders().includes(
                          provider.id as OAuthProvider,
                        ) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full px-3 text-xs"
                          onClick={() => handleLink(provider.id as OAuthProvider)}
                        >
                          {t("sign_in_methods.link")}
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </ManageGroup>

          <p className="px-0.5 text-xs leading-relaxed text-muted-foreground">
            {t("sign_in_methods.last_method_note")}
          </p>
        </>
      )}
    </ManagePageStack>
  );
}
