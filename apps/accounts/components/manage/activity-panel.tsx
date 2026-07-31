"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Download, ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { fetchSecurityLogs, downloadSecurityLogsExport } from "@/lib/manage/api";
import type { SecurityLogEntry } from "@/lib/manage/types";
import {
  ManageEmptyState,
  ManageGroup,
  ManageIconCircle,
  ManagePageHeader,
  ManagePageStack,
  ManageSpinner,
  ui,
} from "./manage-ui";

export function ActivityPanel() {
  const t = useTranslations("Manage");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const dateLocale = locale === "ar" ? ar : enUS;

  const [logs, setLogs] = useState<SecurityLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null);

  const handleExport = async (format: "csv" | "json") => {
    setExporting(format);
    try {
      await downloadSecurityLogsExport(format);
    } catch {
      setError(t("activity.export_error"));
    } finally {
      setExporting(null);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSecurityLogs(page, 15);
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch {
      setError(t("activity.load_error"));
    } finally {
      setLoading(false);
    }
  }, [page, t]);

  useEffect(() => {
    load();
  }, [load]);

  const statusVariant = (status: string) => {
    if (status === "WARNING") return "outline" as const;
    if (status === "FAILED") return "destructive" as const;
    return "secondary" as const;
  };

  const statusLabel = (status: string) => {
    const key = `activity.status.${status}` as const;
    return t.has(key) ? t(key) : status;
  };

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("activity.title")}
        titleShort={t("security.activity_short")}
        description={t("activity.description")}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={exporting !== null}
          onClick={() => handleExport("csv")}
        >
          <Download className="size-4" />
          {exporting === "csv" ? t("activity.exporting") : t("activity.export_csv")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={exporting !== null}
          onClick={() => handleExport("json")}
        >
          <Download className="size-4" />
          {exporting === "json" ? t("activity.exporting") : t("activity.export_json")}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <ManageSpinner />
      ) : logs.length === 0 ? (
        <ManageEmptyState
          icon={ScrollText}
          title={t("activity.empty_title")}
          description={t("activity.empty_desc")}
        />
      ) : (
        <ManageGroup>
          {logs.map((log) => (
            <div key={log.id} className={cn("flex gap-3 px-4 py-3.5", ui.divider)}>
              <ManageIconCircle icon={ScrollText} muted />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">
                    {log.description || log.action.replace(/_/g, " ")}
                  </p>
                  <Badge variant={statusVariant(log.status)} className="text-[10px]">
                    {statusLabel(log.status)}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {log.ipAddress && <span dir="ltr">{log.ipAddress}</span>}
                  {log.browser && <span>{log.browser}</span>}
                  {log.os && <span>{log.os}</span>}
                  <span>
                    {formatDistanceToNow(new Date(log.createdAt), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </ManageGroup>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className={cn("size-4", !isRtl && "rotate-180")} />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className={cn("size-4", !isRtl && "rotate-180")} />
          </Button>
        </div>
      )}
    </ManagePageStack>
  );
}
