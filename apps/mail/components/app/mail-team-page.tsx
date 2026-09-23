"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, UserPlus, Users } from "lucide-react";
import {
  AlertDialog,
  Avatar,
  Button,
  Chip,
  Description,
  Dropdown,
  EmptyState,
  Input,
  Label,
  Meter,
  Skeleton,
  TextField,
} from "@heroui/react";
import { MailNotice } from "@/components/app/mail-notice";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { resolveAvatarUrl } from "@/lib/media-url";
import {
  inviteMailTeamMember,
  leaveMailTeam,
  listMailTeam,
  removeMailTeamMember,
  updateMailTeamMember,
  type MailTeamRole,
  type MailTeamRoster,
} from "@/lib/mail-team-client";

const ROLE_OPTIONS: { value: MailTeamRole; label: string; hint: string }[] = [
  { value: "ADMIN", label: "Admin", hint: "Full console access" },
  { value: "BILLING", label: "Billing", hint: "Seats and plan" },
  { value: "MEMBER", label: "Member", hint: "Day-to-day mail" },
  { value: "VIEWER", label: "Viewer", hint: "Read-only" },
];

function roleLabel(role: string) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label || role;
}

function initials(name: string, email: string) {
  const source = (name || email).trim();
  return (
    source
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function RoleDropdown({
  value,
  onChange,
  disabled,
  label,
  size = "md",
}: {
  value: MailTeamRole;
  onChange: (value: MailTeamRole) => void;
  disabled?: boolean;
  label: string;
  size?: "sm" | "md";
}) {
  const selected = ROLE_OPTIONS.find((opt) => opt.value === value);

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={label}
        isDisabled={disabled}
        className={
          size === "sm"
            ? "inline-flex h-9 min-w-[8rem] items-center justify-between gap-1.5 rounded-full bg-[var(--surface-secondary)] px-3 text-start text-[13px] font-medium text-[var(--foreground)] outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_8%,var(--surface-secondary))]"
            : "inline-flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-2xl bg-[var(--surface-secondary)] px-3.5 text-start text-sm font-medium text-[var(--foreground)] outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_8%,var(--surface-secondary))]"
        }
      >
        <span className="min-w-0 truncate">{selected?.label ?? "Role"}</span>
        <ChevronDown className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />
      </Dropdown.Trigger>
      <Dropdown.Popover
        placement="bottom start"
        className="min-w-[14rem] overflow-hidden rounded-2xl"
      >
        <Dropdown.Menu
          selectedKeys={new Set([value])}
          selectionMode="single"
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const next = [...keys][0];
            if (next == null) return;
            onChange(String(next) as MailTeamRole);
          }}
        >
          <Dropdown.Section>
            {ROLE_OPTIONS.map((opt) => (
              <Dropdown.Item key={opt.value} id={opt.value} textValue={opt.label}>
                <Dropdown.ItemIndicator />
                <div className="min-w-0">
                  <Label>{opt.label}</Label>
                  <Description>{opt.hint}</Description>
                </div>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

function PersonAvatar({
  name,
  email,
  avatar,
}: {
  name: string | null;
  email: string;
  avatar?: string | null;
}) {
  const display = name || email;
  const src = resolveAvatarUrl(avatar);

  return (
    <Avatar size="md" className="shrink-0 ring-1 ring-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
      {src ? <Avatar.Image alt="" src={src} /> : null}
      <Avatar.Fallback>{initials(display, email)}</Avatar.Fallback>
    </Avatar>
  );
}

export function MailTeamPage() {
  const router = useRouter();

  const [appId, setAppId] = useState<string | null>(null);
  const [roster, setRoster] = useState<MailTeamRoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MailTeamRole>("MEMBER");
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const id = readMailAppIdFromDocument();
    if (!id) {
      window.location.assign("/apps?error=app_required");
      return;
    }
    setAppId(id);
  }, []);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const next = await listMailTeam(id);
      setRoster(next);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load team.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!appId) return;
    void load(appId);
  }, [appId, load]);

  const seatsLeft = useMemo(() => {
    if (!roster) return 0;
    return Math.max(0, roster.consoleMembersIncluded - roster.consoleMembersUsed);
  }, [roster]);

  const seatPercent = useMemo(() => {
    if (!roster || roster.consoleMembersIncluded <= 0) return 0;
    return Math.min(
      100,
      Math.round(
        (roster.consoleMembersUsed / roster.consoleMembersIncluded) * 100,
      ),
    );
  }, [roster]);

  const peopleCount = useMemo(() => {
    if (!roster) return 0;
    return (roster.owner ? 1 : 0) + roster.members.length;
  }, [roster]);

  const needsUpgrade = Boolean(roster && roster.consoleMembersIncluded === 0);
  const atSeatLimit = Boolean(roster && seatsLeft <= 0 && !needsUpgrade);
  const inviteLocked = busy || needsUpgrade || atSeatLimit;

  async function onInvite() {
    if (!appId || busy || !email.trim()) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const invited = email.trim();
      await inviteMailTeamMember(appId, {
        email: invited,
        role,
      });
      setEmail("");
      setRole("MEMBER");
      setSuccess(`Invite sent to ${invited}.`);
      await load(appId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not invite.");
    } finally {
      setBusy(false);
    }
  }

  async function onChangeRole(memberId: string, nextRole: MailTeamRole) {
    if (!appId || busyId) return;
    setBusyId(memberId);
    setError("");
    setSuccess("");
    try {
      await updateMailTeamMember(appId, memberId, nextRole);
      setSuccess("Role updated.");
      await load(appId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update role.");
    } finally {
      setBusyId(null);
    }
  }

  async function onRemove(memberId: string) {
    if (!appId || busyId) return;
    setBusyId(memberId);
    setError("");
    setSuccess("");
    try {
      await removeMailTeamMember(appId, memberId);
      setSuccess("Teammate removed.");
      await load(appId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove.");
    } finally {
      setBusyId(null);
    }
  }

  async function onLeave() {
    if (!appId || busy) return;
    setBusy(true);
    try {
      await leaveMailTeam(appId);
      window.location.assign("/apps");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not leave.");
      setBusy(false);
    }
  }

  return (
    <section
      className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-5 sm:gap-7"
      dir="ltr"
    >
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Team
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
            Invite Rukny accounts to this workspace, then assign mailboxes for SSO
            inbox access.
          </p>
        </div>
        {loading || !roster ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <Chip
              color={needsUpgrade || atSeatLimit ? "warning" : "default"}
              size="sm"
              variant="soft"
            >
              {needsUpgrade
                ? "Upgrade to invite"
                : `${roster.consoleMembersUsed} / ${roster.consoleMembersIncluded} seats`}
            </Chip>
            <Chip size="sm" variant="soft">
              {peopleCount} {peopleCount === 1 ? "person" : "people"}
            </Chip>
          </div>
        )}
      </div>

      {error ? (
        <MailNotice
          status="danger"
          title="Something went wrong"
          description={error}
          onDismiss={() => setError("")}
        />
      ) : null}

      {success ? (
        <MailNotice
          status="success"
          title="Done"
          description={success}
          onDismiss={() => setSuccess("")}
        />
      ) : null}

      {loading || !roster ? (
        <div className="space-y-4">
          <div className="space-y-3 rounded-[1.35rem] bg-[var(--surface)] p-5 md:p-6">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-11 w-full rounded-2xl" />
          </div>
          <div className="space-y-3 rounded-[1.35rem] bg-[var(--surface)] p-5 md:p-6">
            <Skeleton className="h-5 w-28 rounded-lg" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Seats + invite */}
          <div className="overflow-hidden rounded-[1.35rem] bg-[var(--surface)]">
            <div className="border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-5 py-5 md:px-6">
              <div className="flex min-w-0 items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--foreground)]">
                  <Users className="size-[1.125rem]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
                      Console seats
                    </p>
                    <p className="text-[12px] tabular-nums text-[var(--muted-foreground)]">
                      {needsUpgrade
                        ? "No seats on this plan"
                        : `${roster.consoleMembersUsed} used · ${seatsLeft} left`}
                    </p>
                  </div>
                  {needsUpgrade ? (
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                      Standard unlocks teammate invites for this workspace.
                    </p>
                  ) : (
                    <Meter
                      aria-label="Console seats used"
                      className="mt-3 gap-1.5"
                      size="sm"
                      value={seatPercent}
                    >
                      <Meter.Track className="rounded-full bg-[var(--surface-secondary)]">
                        <Meter.Fill className="rounded-full bg-[var(--foreground)]" />
                      </Meter.Track>
                    </Meter>
                  )}
                </div>
              </div>

              {needsUpgrade ? (
                <div className="mt-4">
                  <MailNotice
                    status="warning"
                    title="Invites locked"
                    description="Upgrade to Standard or Premium to invite teammates and assign console seats."
                    action={{
                      label: "View plans",
                      onPress: () => router.push("/pricing"),
                    }}
                  />
                </div>
              ) : null}

              {atSeatLimit ? (
                <div className="mt-4">
                  <MailNotice
                    status="warning"
                    title="All seats in use"
                    description={`This plan includes ${roster.consoleMembersIncluded} console seats. Remove someone or upgrade for more.`}
                    action={{
                      label: "Upgrade",
                      onPress: () => router.push("/pricing"),
                    }}
                  />
                </div>
              ) : null}
            </div>

            {roster.canManage ? (
              <div className="px-5 py-5 md:px-6 md:py-6">
                <div className="mb-4 flex items-center gap-2">
                  <UserPlus
                    className="size-4 text-[var(--muted-foreground)]"
                    aria-hidden
                  />
                  <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
                    Invite teammate
                  </h2>
                </div>

                <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end">
                  <TextField
                    isRequired
                    fullWidth
                    className="min-w-0 flex-1 gap-1.5"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    isDisabled={inviteLocked}
                  >
                    <Label className="text-[13px] font-medium text-[var(--foreground)]">
                      Rukny email
                    </Label>
                    <Input
                      placeholder="teammate@company.com"
                      autoComplete="email"
                      className="h-11 rounded-2xl"
                    />
                  </TextField>

                  <div className="min-w-0 lg:w-[11rem]">
                    <Label className="mb-1.5 block text-[13px] font-medium text-[var(--foreground)]">
                      Role
                    </Label>
                    <RoleDropdown
                      label="Invite role"
                      value={role}
                      disabled={inviteLocked}
                      onChange={setRole}
                    />
                  </div>

                  <Button
                    className="h-11 shrink-0 rounded-full px-5 lg:self-end"
                    isDisabled={inviteLocked || !email.trim()}
                    onPress={() => void onInvite()}
                  >
                    {busy ? "Sending…" : "Send invite"}
                  </Button>
                </div>

                <p className="mt-2.5 text-[13px] leading-5 text-[var(--muted-foreground)]">
                  They must already have a Rukny account with this email.
                </p>
              </div>
            ) : null}
          </div>

          {/* People */}
          {roster.owner || roster.members.length > 0 ? (
            <div className="overflow-hidden rounded-[1.35rem] bg-[var(--surface)]">
              <div className="flex items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-5 py-4 md:px-6">
                <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
                  People
                </h2>
                <p className="text-[12px] tabular-nums text-[var(--muted-foreground)]">
                  {peopleCount} total
                </p>
              </div>

              <ul className="divide-y divide-[color-mix(in_srgb,var(--foreground)_6%,transparent)]">
                {roster.owner ? (
                  <li className="flex min-w-0 items-center gap-3.5 px-5 py-4 md:px-6">
                    <PersonAvatar
                      name={roster.owner.name}
                      email={roster.owner.email}
                      avatar={roster.owner.avatar}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                        {roster.owner.name || roster.owner.email}
                      </p>
                      <p className="truncate text-[13px] text-[var(--muted-foreground)]">
                        {roster.owner.email}
                      </p>
                    </div>
                    <Chip size="sm" variant="soft" color="accent">
                      Owner
                    </Chip>
                  </li>
                ) : null}

                {roster.members.map((member) => {
                  const label = member.user.name || member.user.email;
                  const pending = member.status === "PENDING";
                  const rowBusy = busyId === member.id;

                  return (
                    <li
                      key={member.id}
                      className="flex min-w-0 flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center md:px-6"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3.5">
                        <PersonAvatar
                          name={member.user.name}
                          email={member.user.email}
                          avatar={member.user.avatar}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                              {label}
                            </p>
                            {pending ? (
                              <Chip size="sm" variant="soft" color="warning">
                                Pending
                              </Chip>
                            ) : null}
                          </div>
                          <p className="truncate text-[13px] text-[var(--muted-foreground)]">
                            {member.user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
                        {roster.canManage ? (
                          <RoleDropdown
                            size="sm"
                            label={`Role for ${label}`}
                            value={member.role}
                            disabled={rowBusy || busy}
                            onChange={(next) => void onChangeRole(member.id, next)}
                          />
                        ) : (
                          <Chip size="sm" variant="soft">
                            {roleLabel(member.role)}
                          </Chip>
                        )}

                        {roster.canManage ? (
                          <AlertDialog>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-full text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"
                              isDisabled={rowBusy || busy}
                            >
                              Remove
                            </Button>
                            <AlertDialog.Backdrop>
                              <AlertDialog.Container>
                                <AlertDialog.Dialog className="sm:max-w-[400px]">
                                  <AlertDialog.CloseTrigger />
                                  <AlertDialog.Header>
                                    <AlertDialog.Icon status="danger" />
                                    <AlertDialog.Heading>
                                      Remove {label}?
                                    </AlertDialog.Heading>
                                  </AlertDialog.Header>
                                  <AlertDialog.Body>
                                    <p className="text-sm text-[var(--muted-foreground)]">
                                      They lose console access to this workspace.
                                      Assigned mailboxes stay on the domain.
                                    </p>
                                  </AlertDialog.Body>
                                  <AlertDialog.Footer>
                                    <Button slot="close" variant="tertiary">
                                      Cancel
                                    </Button>
                                    <Button
                                      slot="close"
                                      variant="danger"
                                      onPress={() => void onRemove(member.id)}
                                    >
                                      Remove
                                    </Button>
                                  </AlertDialog.Footer>
                                </AlertDialog.Dialog>
                              </AlertDialog.Container>
                            </AlertDialog.Backdrop>
                          </AlertDialog>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <EmptyState className="rounded-[1.35rem] bg-[var(--surface)] px-5 py-14">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
                <Users className="size-5" aria-hidden />
              </div>
              <p className="mt-4 text-[15px] font-semibold text-[var(--foreground)]">
                No teammates yet
              </p>
              <p className="mt-1.5 max-w-sm text-sm leading-6 text-[var(--muted-foreground)]">
                {roster.canManage
                  ? "Send an invite above. After they accept, assign a mailbox from Mailboxes."
                  : "Only the owner can invite people to this workspace."}
              </p>
            </EmptyState>
          )}

          {!roster.canManage ? (
            <div className="flex justify-start pt-1">
              <AlertDialog>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-[var(--danger)]"
                  isDisabled={busy}
                >
                  Leave workspace
                </Button>
                <AlertDialog.Backdrop>
                  <AlertDialog.Container>
                    <AlertDialog.Dialog className="sm:max-w-[400px]">
                      <AlertDialog.CloseTrigger />
                      <AlertDialog.Header>
                        <AlertDialog.Icon status="danger" />
                        <AlertDialog.Heading>
                          Leave this workspace?
                        </AlertDialog.Heading>
                      </AlertDialog.Header>
                      <AlertDialog.Body>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          You will lose console access. An owner can invite you
                          again later.
                        </p>
                      </AlertDialog.Body>
                      <AlertDialog.Footer>
                        <Button slot="close" variant="tertiary">
                          Stay
                        </Button>
                        <Button
                          slot="close"
                          variant="danger"
                          onPress={() => void onLeave()}
                        >
                          Leave
                        </Button>
                      </AlertDialog.Footer>
                    </AlertDialog.Dialog>
                  </AlertDialog.Container>
                </AlertDialog.Backdrop>
              </AlertDialog>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
