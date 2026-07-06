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
import { useManage } from "@/lib/manage/context";
import {
  ManageGroup,
  ManagePageHeader,
  ManagePageStack,
  ManageRow,
  ManageSpinner,
} from "./manage-ui";

const PROVIDERS: {
  id: OAuthProvider | "quicksign";
  labelKey: string;
}[] = [
  { id: "google", labelKey: "providers.google" },
  { id: "linkedin", labelKey: "providers.linkedin" },
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
      linkedin: status.canUnlinkLinkedin,
      facebook: status.canUnlinkFacebook,
    };
    return map[id];
  };

  const handleLink = (provider: OAuthProvider) => {
    initiateProviderLink(provider);
  };

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

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("sign_in_methods.title")}
        description={t("sign_in_methods.description")}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <ManageSpinner />
      ) : (
        <>
          <ManageGroup>
            {PROVIDERS.map((provider) => {
              const linked = isLinked(provider.id);
              const isOAuth = provider.id !== "quicksign";

              return (
                <ManageRow key={provider.id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{t(provider.labelKey)}</p>
                      <Badge variant={linked ? "secondary" : "outline"} className="text-[10px]">
                        {linked ? t("badges.linked") : t("badges.not_linked")}
                      </Badge>
                    </div>
                    {linked && status && (
                      <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                        {provider.id === "quicksign"
                          ? status.quicksign.email
                          : status[provider.id as OAuthProvider]?.email}
                      </p>
                    )}
                  </div>

                  {isOAuth && (
                    <>
                      {linked ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            !canUnlink(provider.id as OAuthProvider) ||
                            actionLoading === provider.id
                          }
                          onClick={() => handleUnlink(provider.id as OAuthProvider)}
                          className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/5"
                        >
                          {actionLoading === provider.id
                            ? t("sign_in_methods.unlinking")
                            : t("sign_in_methods.unlink")}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={() => handleLink(provider.id as OAuthProvider)}
                        >
                          {t("sign_in_methods.link")}
                        </Button>
                      )}
                    </>
                  )}
                </ManageRow>
              );
            })}
          </ManageGroup>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("sign_in_methods.last_method_note")}
          </p>
        </>
      )}
    </ManagePageStack>
  );
}
