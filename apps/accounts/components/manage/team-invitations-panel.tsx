"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  acceptWorkspaceInvitation,
  declineWorkspaceInvitation,
  fetchWorkspaceIncomingInvitations,
  type WorkspaceIncomingInvitation,
  type WorkspaceRole,
} from "@/lib/manage/api";
import {
  ManageAvatar,
  ManageEmptyState,
  ManageGroup,
  ManageLinkButton,
  ManagePageHeader,
  ManagePageStack,
  ManageSpinner,
  ManageSuccessBanner,
  ui,
} from "./manage-ui";
import { cn } from "@/lib/utils";

function displayName(
  profile: { name: string | null; username: string | null } | null | undefined,
  email: string,
): string {
  return profile?.name || profile?.username || email;
}

function initialsFrom(
  profile: { name: string | null; username: string | null } | null | undefined,
  email: string,
): string {
  const base = profile?.name || profile?.username || email;
  return base.slice(0, 1).toUpperCase();
}

function extractApiErrorMessage(err: unknown): string | undefined {
  const data = (err as Error & { data?: { message?: string | string[] } }).data;
  if (!data?.message) return undefined;
  return Array.isArray(data.message) ? data.message[0] : data.message;
}

export function TeamInvitationsPanel() {
  const t = useTranslations("Manage");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? ar : enUS;

  const [invitations, setInvitations] = useState<WorkspaceIncomingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWorkspaceIncomingInvitations();
      setInvitations(data);
    } catch (err) {
      setError(extractApiErrorMessage(err) ?? t("team.incoming_load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const roleLabel = (role: WorkspaceRole | string) => {
    const key = `team.roles.${role}` as const;
    return t.has(key) ? t(key) : role;
  };

  const handleAccept = async (id: string) => {
    setActionId(id);
    setError(null);
    setSuccess(null);
    try {
      await acceptWorkspaceInvitation(id);
      setSuccess(t("team.accept_success"));
      await load();
    } catch (err) {
      setError(extractApiErrorMessage(err) ?? t("team.action_error"));
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionId(id);
    setError(null);
    setSuccess(null);
    try {
      await declineWorkspaceInvitation(id);
      setSuccess(t("team.decline_success"));
      await load();
    } catch (err) {
      setError(extractApiErrorMessage(err) ?? t("team.action_error"));
    } finally {
      setActionId(null);
    }
  };

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("team.incoming_page_title")}
        titleShort={t("team.incoming_short")}
        description={t("team.incoming_page_desc")}
      />

      <div className="px-0.5">
        <Link
          href="/manage/team"
          className="text-sm font-medium text-primary hover:underline"
        >
          {t("team.back_to_team")}
        </Link>
      </div>

      {success && <ManageSuccessBanner>{success}</ManageSuccessBanner>}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <ManageSpinner />
      ) : invitations.length === 0 ? (
        <ManageEmptyState
          icon={Inbox}
          title={t("team.incoming_empty_title")}
          description={t("team.incoming_empty_desc")}
          action={
            <ManageLinkButton href="/manage/team">
              {t("team.back_to_team")}
            </ManageLinkButton>
          }
        />
      ) : (
        <ManageGroup className="divide-y divide-border/50">
          {invitations.map((invitation) => {
            const workspace = invitation.workspace;
            const inviterName =
              invitation.inviter?.profile?.name ||
              invitation.inviter?.profile?.username ||
              t("team.unknown_inviter");
            const busy = actionId === invitation.id;
            const invitedAgo = invitation.invitedAt
              ? formatDistanceToNow(new Date(invitation.invitedAt), {
                  addSuffix: true,
                  locale: dateLocale,
                })
              : null;

            return (
              <div
                key={invitation.id}
                className={cn(ui.row, "flex-col items-stretch gap-3 sm:flex-row sm:items-center")}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <ManageAvatar
                    avatar={workspace.profile?.avatar}
                    initials={initialsFrom(workspace.profile, workspace.email)}
                    size="nav"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {displayName(workspace.profile, workspace.email)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("team.incoming_from", {
                        name: inviterName,
                        role: roleLabel(invitation.role),
                      })}
                    </p>
                    {invitedAgo && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{invitedAgo}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge variant="outline">{roleLabel(invitation.role)}</Badge>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => void handleAccept(invitation.id)}
                  >
                    {t("team.accept")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => void handleDecline(invitation.id)}
                  >
                    {t("team.decline")}
                  </Button>
                </div>
              </div>
            );
          })}
        </ManageGroup>
      )}
    </ManagePageStack>
  );
}
