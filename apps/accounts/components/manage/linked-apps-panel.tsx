"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ExternalLink, Blocks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchDeveloperApps } from "@/lib/manage/api";
import type { DeveloperAppSummary } from "@/lib/manage/types";
import {
  ManageEmptyState,
  ManageFormFooter,
  ManageGroup,
  ManageIconBox,
  ManageLinkButton,
  ManageNotice,
  ManagePageHeader,
  ManagePageStack,
  ManageRow,
  ManageSection,
  ManageSpinner,
} from "./manage-ui";
import { cn } from "@/lib/utils";

function appStatusVariant(status: string): BadgeVariant {
  const normalized = status.toLowerCase();
  if (normalized === "active" || normalized === "approved") return "success";
  if (normalized === "pending" || normalized === "review") return "outline";
  if (normalized === "suspended" || normalized === "rejected") return "destructive";
  return "outline";
}

type BadgeVariant = "default" | "secondary" | "success" | "destructive" | "outline" | "ghost" | "link";

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

  const appStatusLabel = (status: string) => {
    const key = `linked_apps.status.${status}` as const;
    return t.has(key) ? t(key) : status;
  };

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("linked_apps.title")}
        titleShort={t("nav.linked_apps_short")}
        description={t("linked_apps.description")}
      />

      <ManageNotice>{t("linked_apps.oauth_note")}</ManageNotice>

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
            <ManageLinkButton href={developersUrl} external>
              <ExternalLink className="size-4 shrink-0" aria-hidden />
              {t("linked_apps.create_app")}
            </ManageLinkButton>
          }
        />
      ) : (
        <ManageSection title={t("linked_apps.your_apps")} className="pt-1">
          <ManageGroup>
            {apps.map((app, index) => (
              <ManageRow
                key={app.id}
                className={cn(index === apps.length - 1 && "border-b-0")}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  {app.icon ? (
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary ring-1 ring-border/50">
                      <img src={app.icon} alt="" className="size-full object-cover" />
                    </div>
                  ) : (
                    <ManageIconBox className="text-sm font-semibold">
                      {app.name.charAt(0).toUpperCase()}
                    </ManageIconBox>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{app.name}</p>
                      {app.verified && (
                        <span className="manage-badge-verified inline-flex h-5 items-center rounded-full px-2">
                          {t("linked_apps.verified")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">
                      {app.appId}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground/80">
                      {formatDistanceToNow(new Date(app.createdAt), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={appStatusVariant(app.status)}
                  className="shrink-0 font-medium"
                >
                  {appStatusLabel(app.status)}
                </Badge>
              </ManageRow>
            ))}

            <ManageFormFooter className="py-4">
              <ManageLinkButton href={developersUrl} external>
                <ExternalLink className="size-4 shrink-0" aria-hidden />
                {t("linked_apps.manage_in_developers")}
              </ManageLinkButton>
            </ManageFormFooter>
          </ManageGroup>
        </ManageSection>
      )}
    </ManagePageStack>
  );
}
