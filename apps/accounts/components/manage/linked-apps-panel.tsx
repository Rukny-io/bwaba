"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ExternalLink, Blocks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchDeveloperApps } from "@/lib/manage/api";
import type { DeveloperAppSummary } from "@/lib/manage/types";
import {
  ManageEmptyState,
  ManageGroup,
  ManagePageHeader,
  ManagePageStack,
  ManageRow,
  ManageSpinner,
} from "./manage-ui";

export function LinkedAppsPanel() {
  const t = useTranslations("Manage");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? ar : enUS;

  const [apps, setApps] = useState<DeveloperAppSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const developersUrl =
    process.env.NEXT_PUBLIC_DEVELOPERS_URL || "http://localhost:3004";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDeveloperApps();
      setApps(data);
    } catch {
      setError(t("linked_apps.load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("linked_apps.title")}
        description={t("linked_apps.description")}
      />

      <Alert>
        <AlertDescription>{t("linked_apps.oauth_note")}</AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <ManageSpinner />
      ) : apps.length === 0 ? (
        <ManageEmptyState
          icon={Blocks}
          title={t("linked_apps.empty_title")}
          description={t("linked_apps.empty_desc")}
          action={
            <Button variant="outline" asChild>
              <a href={developersUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                {t("linked_apps.create_app")}
              </a>
            </Button>
          }
        />
      ) : (
        <>
          <p className="px-0.5 text-sm font-medium text-foreground">
            {t("linked_apps.your_apps")}
          </p>
          <ManageGroup>
            {apps.map((app) => (
              <ManageRow key={app.id}>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium">
                    {app.icon ? (
                      <img src={app.icon} alt="" className="size-full object-cover" />
                    ) : (
                      app.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{app.name}</p>
                      {app.verified && (
                        <Badge variant="secondary" className="text-[10px]">
                          {t("linked_apps.verified")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {app.appId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(app.createdAt), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {app.status}
                </Badge>
              </ManageRow>
            ))}
          </ManageGroup>
          <Button variant="outline" size="sm" asChild className="w-fit">
            <a href={developersUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              {t("linked_apps.manage_in_developers")}
            </a>
          </Button>
        </>
      )}
    </ManagePageStack>
  );
}
