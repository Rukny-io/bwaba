"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, UserPlus, Users } from "lucide-react";
import {
  Alert,
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
            ? "inline-flex h-8 min-w-[7.5rem] items-center justify-between gap-1.5 rounded-lg bg-[var(--surface-secondary)] px-2.5 text-start text-xs font-medium text-[var(--foreground)] outline-none"
            : "inline-flex h-10 w-full min-w-0 items-center justify-between gap-1.5 rounded-xl bg-[var(--field-background)] px-3 text-start text-sm font-medium text-[var(--foreground)] outline-none"
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
    <Avatar size="md" className="shrink-0">
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

  const needsUpgrade = Boolean(roster && roster.consoleMembersIncluded === 0);
  const atSeatLimit = Boolean(roster && seatsLeft <= 0 && !needsUpgrade);

  async function onInvite() {
    if (!appId || busy || !email.trim()) return;
    setBusy(true);
    setError("");
    try {
      await inviteMailTeamMember(appId, {
        email: email.trim(),
        role,
      });
      setEmail("");
      setRole("MEMBER");
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
    try {
      await updateMailTeamMember(appId, memberId, nextRole);
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
    try {
      await removeMailTeamMember(appId, memberId);
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
    <section className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6" dir="ltr">
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Team
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--muted-foreground)]">
            Invite Rukny accounts to manage this workspace, then assign mailboxes
            for SSO inbox access.
          </p>
        </div>
        {loading || !roster ? null : (
          <Chip
            color={needsUpgrade || atSeatLimit ? "warning" : "default"}
            size="sm"
            variant="soft"
          >
            {needsUpgrade
              ? "Upgrade to invite"
              : `${roster.consoleMembersUsed} / ${roster.consoleMembersIncluded} seats`}
          </Chip>
        )}
      </div>

      {error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Team</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {loading || !roster ? (
        <div className="space-y-3 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <div className="flex min-w-0 flex-col gap-4 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)]">
                <Users className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Console seats
                  </p>
                  <p className="text-xs tabular-nums text-[var(--muted-foreground)]">
                    {roster.consoleMembersUsed} used · {seatsLeft} left
                  </p>
                </div>
                {needsUpgrade ? (
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Standard unlocks teammate invites for this workspace.
                  </p>
                ) : (
                  <Meter
                    aria-label="Console seats used"
                    className="mt-3 gap-1.5"
                    size="sm"
                    value={seatPercent}
                  >
                    <Meter.Track>
                      <Meter.Fill />
                    </Meter.Track>
                  </Meter>
                )}
              </div>
            </div>

            {needsUpgrade ? (
              <Alert status="warning" className="items-center">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Invites locked</Alert.Title>
                  <Alert.Description>
                    Upgrade on the pricing page to invite teammates.
                  </Alert.Description>
                </Alert.Content>
                <Button size="sm" onPress={() => router.push("/pricing")}>
                  View plans
                </Button>
              </Alert>
            ) : null}
          </div>

          {roster.canManage ? (
            <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
              <div className="flex items-center gap-2">
                <UserPlus className="size-4 text-[var(--muted-foreground)]" aria-hidden />
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  Invite teammate
                </h2>
              </div>

              <TextField
                isRequired
                fullWidth
                className="gap-1.5"
                type="email"
                value={email}
                onChange={setEmail}
                isDisabled={busy || needsUpgrade || atSeatLimit}
              >
                <Label className="text-sm font-medium text-[var(--foreground)]">
                  Rukny email
                </Label>
                <Input placeholder="teammate@company.com" autoComplete="email" />
                <Description>
                  They must already have a Rukny account with this email.
                </Description>
              </TextField>

              <div className="min-w-0">
                <Label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                  Role
                </Label>
                <RoleDropdown
                  label="Invite role"
                  value={role}
                  disabled={busy || needsUpgrade || atSeatLimit}
                  onChange={setRole}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  isDisabled={
                    busy || needsUpgrade || atSeatLimit || !email.trim()
                  }
                  onPress={() => void onInvite()}
                >
                  {busy ? "Sending…" : "Send invite"}
                </Button>
              </div>
            </div>
          ) : null}

          {roster.owner || roster.members.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  People
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {(roster.owner ? 1 : 0) + roster.members.length} total
                </p>
              </div>

              {roster.owner ? (
                <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 md:px-5">
                  <PersonAvatar
                    name={roster.owner.name}
                    email={roster.owner.email}
                    avatar={roster.owner.avatar}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">
                      {roster.owner.name || roster.owner.email}
                    </p>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">
                      {roster.owner.email}
                    </p>
                  </div>
                  <Chip size="sm" variant="soft" color="accent">
                    Owner
                  </Chip>
                </div>
              ) : null}

              {roster.members.map((member) => {
                const label = member.user.name || member.user.email;
                const pending = member.status === "PENDING";
                const rowBusy = busyId === member.id;

                return (
                  <div
                    key={member.id}
                    className="flex min-w-0 flex-col gap-3 rounded-2xl bg-[var(--surface)] p-4 sm:flex-row sm:items-center md:px-5"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <PersonAvatar
                        name={member.user.name}
                        email={member.user.email}
                        avatar={member.user.avatar}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-[var(--foreground)]">
                            {label}
                          </p>
                          {pending ? (
                            <Chip size="sm" variant="soft" color="warning">
                              Pending
                            </Chip>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-[var(--muted-foreground)]">
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
                            variant="danger"
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
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState className="rounded-2xl bg-[var(--surface)] px-5 py-12">
              <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
                <Users className="size-5" aria-hidden />
              </div>
              <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
                No teammates yet
              </p>
              <p className="mt-1 max-w-sm text-sm text-[var(--muted-foreground)]">
                {roster.canManage
                  ? "Send an invite above. After they accept, assign a mailbox from Mailboxes."
                  : "Only the owner can invite people to this workspace."}
              </p>
            </EmptyState>
          )}

          {!roster.canManage ? (
            <div className="flex justify-start">
              <AlertDialog>
                <Button size="sm" variant="danger" isDisabled={busy}>
                  Leave workspace
                </Button>
                <AlertDialog.Backdrop>
                  <AlertDialog.Container>
                    <AlertDialog.Dialog className="sm:max-w-[400px]">
                      <AlertDialog.CloseTrigger />
                      <AlertDialog.Header>
                        <AlertDialog.Icon status="danger" />
                        <AlertDialog.Heading>Leave this workspace?</AlertDialog.Heading>
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
