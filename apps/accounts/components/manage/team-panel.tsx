"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ListBox, Select } from "@heroui/react";
import { Users, UserPlus, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useManage } from "@/lib/manage/context";
import {
  cancelWorkspaceInvitation,
  fetchWorkspaceMembers,
  fetchWorkspaceQuota,
  inviteWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
  type WorkspaceMemberRecord,
  type WorkspaceMembersResponse,
  type WorkspaceQuota,
  type WorkspaceRole,
} from "@/lib/manage/api";
import {
  ManageAvatar,
  ManageEmptyState,
  ManageFormBody,
  ManageFormField,
  ManageFormFooter,
  ManageGroup,
  ManageLinkButton,
  ManageListItem,
  ManageNotice,
  ManagePageHeader,
  ManagePageStack,
  ManageRow,
  ManageSection,
  ManageSpinner,
  ManageSuccessBanner,
  ui,
} from "./manage-ui";
import { cn } from "@/lib/utils";

const INVITE_ROLES: WorkspaceRole[] = [
  "ADMIN",
  "MANAGER",
  "DEVELOPER",
  "SUPPORT",
  "VIEWER",
];

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

type BadgeVariant = "default" | "secondary" | "success" | "destructive" | "outline" | "ghost" | "link";

function statusVariant(status: string): BadgeVariant {
  if (status === "ACCEPTED") return "success";
  if (status === "PENDING") return "outline";
  if (status === "DECLINED" || status === "CANCELLED" || status === "EXPIRED") {
    return "secondary";
  }
  return "outline";
}

const ROLE_BADGE_CLASSES: Record<string, string> = {
  OWNER:
    "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
  ADMIN:
    "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-300",
  MANAGER:
    "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300",
  DEVELOPER:
    "bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-300",
  SUPPORT:
    "bg-teal-500/15 text-teal-700 border-teal-500/30 dark:text-teal-300",
  VIEWER:
    "bg-slate-500/15 text-slate-700 border-slate-500/30 dark:text-slate-300",
};

function RoleBadge({ role, label }: { role: string; label: string }) {
  const classes =
    ROLE_BADGE_CLASSES[role] ?? ROLE_BADGE_CLASSES.VIEWER;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
        classes,
      )}
    >
      {label}
    </span>
  );
}

function QuotaBar({
  used,
  limit,
  label,
}: {
  used: number;
  limit: number;
  label: string;
}) {
  const safeLimit = Math.max(limit, 1);
  const pct = Math.min(100, Math.round((used / safeLimit) * 100));
  const isFull = used >= limit;
  const isWarn = pct >= 80 && !isFull;
  const barColor = isFull
    ? "bg-red-500"
    : isWarn
      ? "bg-amber-500"
      : "bg-emerald-500";
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold tabular-nums">
          {used} / {limit}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
        <div
          className={cn("h-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
          role="progressbar"
        />
      </div>
    </div>
  );
}

export function TeamPanel() {
  const t = useTranslations("Manage");
  const { user } = useManage();

  const [quota, setQuota] = useState<WorkspaceQuota | null>(null);
  const [data, setData] = useState<WorkspaceMembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("VIEWER");
  const [inviting, setInviting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const [quotaRes, membersRes] = await Promise.all([
        fetchWorkspaceQuota(),
        fetchWorkspaceMembers(),
      ]);
      setQuota(quotaRes);
      setData(membersRes);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 403) {
        setForbidden(true);
      } else {
        setError(extractApiErrorMessage(err) ?? t("team.load_error"));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = Boolean(data?.owner?.id && user?.id && data.owner.id === user.id);
  const canInvite = Boolean(quota?.enabled && data);
  const limit =
    typeof quota?.limit === "number" ? quota.limit : Number(quota?.limit) || 0;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email || inviting) return;

    setInviting(true);
    setError(null);
    setSuccess(null);
    try {
      await inviteWorkspaceMember({ email, role: inviteRole });
      setInviteEmail("");
      setSuccess(t("team.invite_success"));
      await load();
    } catch (err) {
      setError(extractApiErrorMessage(err) ?? t("team.invite_error"));
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvitation = async (member: WorkspaceMemberRecord) => {
    setActionId(member.id);
    setError(null);
    setSuccess(null);
    try {
      await cancelWorkspaceInvitation(member.id);
      setSuccess(t("team.cancel_success"));
      await load();
    } catch (err) {
      setError(extractApiErrorMessage(err) ?? t("team.action_error"));
    } finally {
      setActionId(null);
    }
  };

  const handleRemove = async (member: WorkspaceMemberRecord) => {
    if (!window.confirm(t("team.remove_confirm"))) return;
    setActionId(member.id);
    setError(null);
    setSuccess(null);
    try {
      await removeWorkspaceMember(member.id);
      setSuccess(t("team.remove_success"));
      await load();
    } catch (err) {
      setError(extractApiErrorMessage(err) ?? t("team.action_error"));
    } finally {
      setActionId(null);
    }
  };

  const handleRoleChange = async (member: WorkspaceMemberRecord, role: WorkspaceRole) => {
    if (member.role === role) return;
    setActionId(member.id);
    setError(null);
    setSuccess(null);
    try {
      await updateWorkspaceMemberRole(member.id, role);
      setSuccess(t("team.role_updated"));
      await load();
    } catch (err) {
      setError(extractApiErrorMessage(err) ?? t("team.action_error"));
    } finally {
      setActionId(null);
    }
  };

  const roleLabel = (role: string) => {
    const key = `team.roles.${role}` as const;
    return t.has(key) ? t(key) : role;
  };

  const statusLabel = (status: string) => {
    const key = `team.status.${status}` as const;
    return t.has(key) ? t(key) : status;
  };

  if (loading) {
    return (
      <ManagePageStack>
        <ManagePageHeader
          title={t("team.title")}
          titleShort={t("nav.team_short")}
          description={t("team.description")}
        />
        <ManageSpinner />
      </ManagePageStack>
    );
  }

  if (forbidden) {
    return (
      <ManagePageStack>
        <ManagePageHeader
          title={t("team.title")}
          titleShort={t("nav.team_short")}
          description={t("team.description")}
        />
        <ManageNotice>{t("team.no_manage_access")}</ManageNotice>
        <ManageGroup>
          <ManageListItem
            icon={Inbox}
            tone="blue"
            title={t("team.incoming_title")}
            subtitle={t("team.incoming_desc")}
            href="/manage/team/invitations"
          />
        </ManageGroup>
      </ManagePageStack>
    );
  }

  if (quota && !quota.enabled) {
    return (
      <ManagePageStack>
        <ManagePageHeader
          title={t("team.title")}
          titleShort={t("nav.team_short")}
          description={t("team.description")}
        />
        <ManageEmptyState
          icon={Users}
          title={t("team.upgrade_title")}
          description={t("team.upgrade_desc")}
          action={
            <ManageLinkButton href="/manage/billing">
              {t("team.upgrade_cta")}
            </ManageLinkButton>
          }
        />
        <ManageGroup>
          <ManageListItem
            icon={Inbox}
            tone="blue"
            title={t("team.incoming_title")}
            subtitle={t("team.incoming_desc")}
            href="/manage/team/invitations"
          />
        </ManageGroup>
      </ManagePageStack>
    );
  }

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("team.title")}
        titleShort={t("nav.team_short")}
        description={t("team.description")}
      />

      {success && <ManageSuccessBanner>{success}</ManageSuccessBanner>}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ManageGroup>
        <ManageListItem
          icon={Inbox}
          tone="blue"
          title={t("team.incoming_title")}
          subtitle={t("team.incoming_desc")}
          href="/manage/team/invitations"
        />
      </ManageGroup>

      {quota && (
        <QuotaBar
          used={quota.used}
          limit={limit}
          label={t("team.quota", { used: quota.used, limit })}
        />
      )}

      {canInvite && (
        <ManageSection title={t("team.invite_section")}>
          <ManageGroup>
            <form onSubmit={handleInvite}>
              <ManageFormBody>
                <ManageFormField label={t("team.invite_email")} htmlFor="team-invite-email">
                  <Input
                    id="team-invite-email"
                    type="email"
                    dir="ltr"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    autoComplete="off"
                    required
                  />
                </ManageFormField>
                <ManageFormField label={t("team.invite_role")} htmlFor="team-invite-role">
                  <Select
                    id="team-invite-role"
                    selectedKey={inviteRole}
                    onSelectionChange={(key) => {
                      if (key) setInviteRole(String(key) as WorkspaceRole);
                    }}
                    className="w-full"
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {INVITE_ROLES.map((role) => (
                          <ListBox.Item key={role} id={role} textValue={roleLabel(role)}>
                            <div>
                              <p className="text-sm font-medium">{roleLabel(role)}</p>
                              <p className="text-xs text-muted-foreground">
                                {t(`team.role_desc.${role}`)}
                              </p>
                            </div>
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </ManageFormField>
              </ManageFormBody>
              <ManageFormFooter>
                <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
                  <UserPlus className="size-4" aria-hidden />
                  {inviting ? t("team.inviting") : t("team.invite_action")}
                </Button>
              </ManageFormFooter>
            </form>
          </ManageGroup>
          <ManageNotice className="mt-3">{t("team.invite_note")}</ManageNotice>
        </ManageSection>
      )}

      <ManageSection title={t("team.members_section")}>
        <ManageGroup className="divide-y divide-border/50">
          {data?.owner && (
            <div className={cn(ui.row, "items-center gap-3")}>
              <ManageAvatar
                avatar={data.owner.profile?.avatar}
                initials={initialsFrom(data.owner.profile, data.owner.email)}
                size="nav"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {displayName(data.owner.profile, data.owner.email)}
                </p>
                <p className="truncate text-xs text-muted-foreground" dir="ltr">
                  {data.owner.email}
                </p>
              </div>
              <RoleBadge role="OWNER" label={roleLabel("OWNER")} />
            </div>
          )}

          {data?.members.length === 0 && (
            <ManageRow>
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Users className="size-5 text-muted-foreground" aria-hidden />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {t("team.members_empty")}
                </p>
                {canInvite && (
                  <p className="max-w-sm text-xs text-muted-foreground">
                    {t.has("team.members_empty_hint")
                      ? t("team.members_empty_hint")
                      : "استخدم النموذج أعلاه لدعوة أول عضو في فريقك."}
                  </p>
                )}
              </div>
            </ManageRow>
          )}

          {data?.members.map((member) => {
            const busy = actionId === member.id;
            const name = displayName(member.user.profile, member.user.email);

            return (
              <div
                key={member.id}
                className={cn(ui.row, "flex-col items-stretch gap-3 sm:flex-row sm:items-center")}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <ManageAvatar
                    avatar={member.user.profile?.avatar}
                    initials={initialsFrom(member.user.profile, member.user.email)}
                    size="nav"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{name}</p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">
                      {member.user.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
                  <Badge variant={statusVariant(member.status)}>
                    {statusLabel(member.status)}
                  </Badge>

                  {member.status === "ACCEPTED" && isOwner ? (
                    <Select
                      selectedKey={member.role}
                      onSelectionChange={(key) => {
                        if (key) {
                          void handleRoleChange(member, String(key) as WorkspaceRole);
                        }
                      }}
                      isDisabled={busy}
                      className="min-w-[140px]"
                    >
                      <Select.Trigger className="h-9">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {INVITE_ROLES.map((role) => (
                            <ListBox.Item key={role} id={role} textValue={roleLabel(role)}>
                              {roleLabel(role)}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  ) : (
                    <RoleBadge role={member.role} label={roleLabel(member.role)} />
                  )}

                  {member.status === "PENDING" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => void handleCancelInvitation(member)}
                    >
                      {t("team.cancel_invite")}
                    </Button>
                  )}

                  {member.status === "ACCEPTED" && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={busy}
                      onClick={() => void handleRemove(member)}
                    >
                      {t("team.remove_member")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </ManageGroup>
      </ManageSection>
    </ManagePageStack>
  );
}
