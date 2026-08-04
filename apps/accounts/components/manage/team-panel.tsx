"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ListBox, Modal, Select, useOverlayState } from "@heroui/react";
import { Clock, Inbox, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const ROLE_BADGE_CLASSES: Record<string, string> = {
  OWNER: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
  ADMIN: "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-300",
  MANAGER: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300",
  DEVELOPER: "bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-300",
  SUPPORT: "bg-teal-500/15 text-teal-700 border-teal-500/30 dark:text-teal-300",
  VIEWER: "bg-slate-500/15 text-slate-700 border-slate-500/30 dark:text-slate-300",
};

function RoleBadge({ role, label }: { role: string; label: string }) {
  const classes = ROLE_BADGE_CLASSES[role] ?? ROLE_BADGE_CLASSES.VIEWER;
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
  const barColor = isFull ? "bg-red-500" : isWarn ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="manage-surface px-5 py-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums text-foreground">
          {used} / {limit}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
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

function MemberIdentity({
  avatar,
  name,
  email,
}: {
  avatar?: string | null;
  name: string;
  email: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <ManageAvatar
        avatar={avatar}
        initials={initialsFrom({ name, username: null }, email)}
        size="nav"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground" dir="ltr">
          {email}
        </p>
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
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMemberRecord | null>(null);
  const removeModal = useOverlayState();

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
  const quotaFull = Boolean(quota && limit > 0 && quota.used >= limit);

  const activeMembers = useMemo(
    () => (data?.members ?? []).filter((m) => m.status === "ACCEPTED"),
    [data?.members],
  );
  const pendingMembers = useMemo(
    () => (data?.members ?? []).filter((m) => m.status === "PENDING"),
    [data?.members],
  );

  const roleLabel = (role: string) => {
    const key = `team.roles.${role}` as const;
    return t.has(key) ? t(key) : role;
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email || inviting || quotaFull) return;

    setInviting(true);
    setError(null);
    setSuccess(null);
    try {
      await inviteWorkspaceMember({ email, role: inviteRole });
      setInviteEmail("");
      setInviteRole("VIEWER");
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

  const openRemoveModal = (member: WorkspaceMemberRecord) => {
    setMemberToRemove(member);
    removeModal.open();
  };

  const closeRemoveModal = () => {
    removeModal.close();
    setMemberToRemove(null);
  };

  const handleRemoveConfirm = async () => {
    if (!memberToRemove) return;
    setActionId(memberToRemove.id);
    setError(null);
    setSuccess(null);
    try {
      await removeWorkspaceMember(memberToRemove.id);
      setSuccess(t("team.remove_success"));
      closeRemoveModal();
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

  const incomingLink = (
    <ManageGroup>
      <ManageListItem
        icon={Inbox}
        tone="blue"
        title={t("team.incoming_title")}
        subtitle={t("team.incoming_desc")}
        href="/manage/team/invitations"
      />
    </ManageGroup>
  );

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
        {incomingLink}
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
        {incomingLink}
      </ManagePageStack>
    );
  }

  const removeBusy = memberToRemove ? actionId === memberToRemove.id : false;
  const removeName = memberToRemove
    ? displayName(memberToRemove.user.profile, memberToRemove.user.email)
    : "";

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

      {incomingLink}

      {quota && (
        <ManageSection title={t("team.quota_section")}>
          <QuotaBar
            used={quota.used}
            limit={limit}
            label={t("team.quota", { used: quota.used, limit })}
          />
          {quotaFull && (
            <ManageNotice className="mt-3">{t("team.quota_full")}</ManageNotice>
          )}
        </ManageSection>
      )}

      {canInvite && (
        <ManageSection title={t("team.invite_section")}>
          <ManageNotice>{t("team.invite_note")}</ManageNotice>
          <ManageGroup className="mt-3">
            <form onSubmit={handleInvite}>
              <ManageFormBody>
                <ManageFormField
                  label={t("team.invite_email")}
                  htmlFor="team-invite-email"
                  hint={t("team.invite_email_hint")}
                >
                  <Input
                    id="team-invite-email"
                    type="email"
                    dir="ltr"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    autoComplete="off"
                    required
                    disabled={quotaFull}
                  />
                </ManageFormField>
                <ManageFormField
                  label={t("team.invite_role")}
                  htmlFor="team-invite-role"
                  hint={t(`team.role_desc.${inviteRole}`)}
                >
                  <Select
                    id="team-invite-role"
                    selectedKey={inviteRole}
                    onSelectionChange={(key) => {
                      if (key) setInviteRole(String(key) as WorkspaceRole);
                    }}
                    isDisabled={quotaFull}
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
                <Button
                  type="submit"
                  disabled={inviting || quotaFull || !inviteEmail.trim()}
                >
                  <UserPlus className="size-4" aria-hidden />
                  {inviting ? t("team.inviting") : t("team.invite_action")}
                </Button>
              </ManageFormFooter>
            </form>
          </ManageGroup>
        </ManageSection>
      )}

      <ManageSection title={t("team.members_section")}>
        {data?.owner || activeMembers.length > 0 ? (
          <ManageGroup>
            {data?.owner && (
              <div className={cn(ui.row, ui.divider, "items-center gap-3")}>
                <MemberIdentity
                  avatar={data.owner.profile?.avatar}
                  name={displayName(data.owner.profile, data.owner.email)}
                  email={data.owner.email}
                />
                <RoleBadge role="OWNER" label={roleLabel("OWNER")} />
              </div>
            )}

            {activeMembers.map((member) => {
              const busy = actionId === member.id;
              const name = displayName(member.user.profile, member.user.email);

              return (
                <div
                  key={member.id}
                  className={cn(
                    ui.row,
                    ui.divider,
                    "flex-col items-stretch gap-3 sm:flex-row sm:items-center",
                  )}
                >
                  <MemberIdentity
                    avatar={member.user.profile?.avatar}
                    name={name}
                    email={member.user.email}
                  />

                  <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
                    {isOwner ? (
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
                              <ListBox.Item
                                key={role}
                                id={role}
                                textValue={roleLabel(role)}
                              >
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

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={busy}
                      onClick={() => openRemoveModal(member)}
                    >
                      {t("team.remove_member")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </ManageGroup>
        ) : (
          <ManageEmptyState
            icon={Users}
            title={t("team.members_empty_title")}
            description={
              canInvite
                ? t("team.members_empty_hint")
                : t("team.members_empty")
            }
          />
        )}
      </ManageSection>

      <ManageSection title={t("team.pending_section")}>
        {pendingMembers.length > 0 ? (
          <ManageGroup>
            {pendingMembers.map((member) => {
              const busy = actionId === member.id;
              const name = displayName(member.user.profile, member.user.email);

              return (
                <div
                  key={member.id}
                  className={cn(
                    ui.row,
                    ui.divider,
                    "flex-col items-stretch gap-3 sm:flex-row sm:items-center",
                  )}
                >
                  <MemberIdentity
                    avatar={member.user.profile?.avatar}
                    name={name}
                    email={member.user.email}
                  />

                  <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
                    <RoleBadge role={member.role} label={roleLabel(member.role)} />
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                      <Clock className="size-3" aria-hidden />
                      {t("team.status.PENDING")}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => void handleCancelInvitation(member)}
                    >
                      {t("team.cancel_invite")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </ManageGroup>
        ) : (
          <ManageGroup>
            <div className={cn(ui.row, "flex-col items-center gap-1.5 py-6 text-center")}>
              <Clock className="size-5 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium text-foreground">
                {t("team.pending_empty_title")}
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {t("team.pending_empty_desc")}
              </p>
            </div>
          </ManageGroup>
        )}
      </ManageSection>

      <Modal state={removeModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>{t("team.remove_confirm_title")}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("team.remove_confirm_desc", { name: removeName })}
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="outline"
                  onClick={closeRemoveModal}
                  disabled={removeBusy}
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant="destructive"
                  disabled={removeBusy}
                  onClick={() => void handleRemoveConfirm()}
                >
                  {removeBusy ? t("team.processing") : t("team.remove_confirm_action")}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </ManagePageStack>
  );
}
