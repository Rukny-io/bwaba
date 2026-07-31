"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  fetchSessions,
  revokeOtherSessions,
  revokeSession,
} from "@/lib/manage/api";
import type { UserSession } from "@/lib/manage/types";
import { useManage } from "@/lib/manage/context";
import { cn } from "@/lib/utils";
import {
  ManageEmptyState,
  ManageGroup,
  ManageIconCircle,
  ManagePageHeader,
  ManagePageStack,
  ManageSpinner,
  ui,
} from "./manage-ui";

export function SessionsPanel() {
  const t = useTranslations("Manage");
  const locale = useLocale();
  const { refreshSummary } = useManage();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const dateLocale = locale === "ar" ? ar : enUS;

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSessions(await fetchSessions());
    } catch {
      setError(t("sessions.load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await revokeSession(sessionId);
      await loadSessions();
      await refreshSummary();
    } catch {
      setError(t("sessions.revoke_error"));
    } finally {
      setRevoking(null);
    }
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("sessions.title")}
        titleShort={t("security.sessions_short")}
        description={t("sessions.description")}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {otherSessions.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            setRevoking("all");
            try {
              await revokeOtherSessions();
              await loadSessions();
              await refreshSummary();
            } catch {
              setError(t("sessions.revoke_error"));
            } finally {
              setRevoking(null);
            }
          }}
          disabled={revoking === "all"}
          className="w-fit"
        >
          {revoking === "all" ? t("sessions.revoking") : t("sessions.revoke_all")}
        </Button>
      )}

      {loading ? (
        <ManageSpinner />
      ) : sessions.length === 0 ? (
        <ManageEmptyState
          icon={Monitor}
          title={t("sessions.empty_title")}
          description={t("sessions.empty_desc")}
        />
      ) : (
        <ManageGroup>
          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              dateLocale={dateLocale}
              revoking={revoking === session.id}
              onRevoke={() => handleRevoke(session.id)}
              t={t}
            />
          ))}
        </ManageGroup>
      )}
    </ManagePageStack>
  );
}

function SessionRow({
  session,
  dateLocale,
  revoking,
  onRevoke,
  t,
}: {
  session: UserSession;
  dateLocale: typeof ar;
  revoking: boolean;
  onRevoke: () => void;
  t: ReturnType<typeof useTranslations<"Manage">>;
}) {
  const DeviceIcon =
    session.deviceType === "mobile"
      ? Smartphone
      : session.deviceType === "tablet"
        ? Tablet
        : Monitor;

  const label =
    session.deviceName ||
    [session.browser, session.os].filter(Boolean).join(" · ") ||
    t("sessions.unknown_device");

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 px-4 py-3.5",
        ui.divider,
        session.isCurrent && "bg-primary/[0.02]",
      )}
    >
      <div className="flex min-w-0 gap-3">
        <ManageIconCircle icon={DeviceIcon} muted />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{label}</p>
            {session.isCurrent && (
              <Badge variant="secondary" className="text-[10px]">
                {t("sessions.current")}
              </Badge>
            )}
          </div>
          {session.ipAddress && (
            <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
              {session.ipAddress}
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(session.lastActivity), {
              addSuffix: true,
              locale: dateLocale,
            })}
          </p>
        </div>
      </div>
      {!session.isCurrent && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRevoke}
          disabled={revoking}
          className="min-h-11 shrink-0 text-destructive hover:bg-destructive/5"
        >
          {revoking ? "…" : t("sessions.revoke")}
        </Button>
      )}
    </div>
  );
}
