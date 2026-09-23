"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  MoreHorizontal,
  UserPlus,
  Users,
} from "lucide-react";
import {
  AlertDialog,
  Avatar,
  Button,
  Chip,
  cn,
  Description,
  Disclosure,
  Dropdown,
  EmptyState,
  Input,
  Label,
  Meter,
  SearchField,
  Skeleton,
  TextField,
} from "@heroui/react";
import { MailNotice } from "@/components/app/mail-notice";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import { resolveAvatarUrl } from "@/lib/media-url";
import {
  assignMailMailbox,
  inviteMailTeamMember,
  leaveMailTeam,
  listMailTeam,
  removeMailTeamMember,
  resendMailTeamInvite,
  transferMailOwnership,
  updateMailTeamMember,
  type MailTeamEmailInviteView,
  type MailTeamMailboxOption,
  type MailTeamMemberView,
  type MailTeamRole,
  type MailTeamRoster,
} from "@/lib/mail-team-client";

const ROLE_OPTIONS: { value: MailTeamRole; label: string; hint: string }[] = [
  {
    value: "ADMIN",
    label: "Admin",
    hint: "Team, domain, mailboxes, and billing",
  },
  {
    value: "BILLING",
    label: "Billing",
    hint: "Billing only",
  },
  {
    value: "MEMBER",
    label: "Member",
    hint: "Mailboxes (not team or domain)",
  },
  {
    value: "VIEWER",
    label: "Viewer",
    hint: "Read-only / SSO for assigned mailbox",
  },
];

const PERMISSION_ROWS: {
  label: string;
  owner: boolean;
  admin: boolean;
  billing: boolean;
  member: boolean;
  viewer: boolean;
}[] = [
  {
    label: "Team",
    owner: true,
    admin: true,
    billing: false,
    member: false,
    viewer: false,
  },
  {
    label: "Domain",
    owner: true,
    admin: true,
    billing: false,
    member: false,
    viewer: false,
  },
  {
    label: "Mailboxes",
    owner: true,
    admin: true,
    billing: false,
    member: true,
    viewer: false,
  },
  {
    label: "Billing",
    owner: true,
    admin: true,
    billing: true,
    member: false,
    viewer: false,
  },
  {
    label: "Read / SSO assigned",
    owner: true,
    admin: true,
    billing: false,
    member: true,
    viewer: true,
  },
];

type StatusFilter = "all" | "active" | "pending";
type RoleFilter = "ALL" | "OWNER" | MailTeamRole;

type RemoveTarget =
  | { kind: "member"; member: MailTeamMemberView }
  | { kind: "email_invite"; invite: MailTeamEmailInviteView };

const EXPIRES_SOON_MS = 48 * 60 * 60 * 1000;

function roleLabel(role: string) {
  if (role === "OWNER") return "Owner";
  return ROLE_OPTIONS.find((r) => r.value === role)?.label || role;
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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

function formatRelativeDate(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatExpiresIn(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Expires in under an hour";
  if (hours < 48) return `Expires in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Expires in ${days}d`;
}

function isExpiresSoon(iso: string | null | undefined) {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const left = date.getTime() - Date.now();
  return left > 0 && left < EXPIRES_SOON_MS;
}

function mailboxAddress(box: { localPart: string; domain: string; address?: string }) {
  return box.address || `${box.localPart}@${box.domain}`;
}

function matchesSearch(
  query: string,
  name: string | null | undefined,
  email: string,
) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    email.toLowerCase().includes(q) ||
    (name || "").toLowerCase().includes(q)
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
            ? "inline-flex h-9 min-w-[7.5rem] items-center justify-between gap-1.5 rounded-full bg-[var(--surface-secondary)] px-3 text-start text-[13px] font-medium text-[var(--foreground)] outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_8%,var(--surface-secondary))]"
            : "inline-flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl bg-[var(--field-background)] px-3.5 text-start text-sm font-medium text-[var(--foreground)] outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_4%,var(--field-background))]"
        }
      >
        <span className="min-w-0 truncate">{selected?.label ?? "Role"}</span>
        <ChevronDown className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />
      </Dropdown.Trigger>
      <Dropdown.Popover
        placement="bottom start"
        className="min-w-[15rem] overflow-hidden rounded-2xl"
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
                <div className="flex min-w-0 flex-col gap-0.5 py-0.5">
                  <Label className="leading-5">{opt.label}</Label>
                  <Description className="leading-4">{opt.hint}</Description>
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
    <Avatar
      size="md"
      className="shrink-0 ring-1 ring-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
    >
      {src ? <Avatar.Image alt="" src={src} /> : null}
      <Avatar.Fallback>{initials(display, email)}</Avatar.Fallback>
    </Avatar>
  );
}

function FilterChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-[var(--foreground)] text-[var(--background)]"
          : "bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
      )}
    >
      {label}
    </button>
  );
}

function MailboxAssignDropdown({
  userId,
  mailboxes,
  disabled,
  onAssign,
}: {
  userId: string;
  mailboxes: MailTeamMailboxOption[];
  disabled?: boolean;
  onAssign: (mailboxId: string, nextUserId: string | null) => void;
}) {
  const assignedCount = mailboxes.filter((box) => box.assignedUserId === userId)
    .length;

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="Assign mailbox"
        isDisabled={disabled || mailboxes.length === 0}
        className="inline-flex h-9 min-w-[8.5rem] items-center justify-between gap-1.5 rounded-full bg-[var(--surface-secondary)] px-3 text-start text-[13px] font-medium text-[var(--foreground)] outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_8%,var(--surface-secondary))] disabled:opacity-50"
      >
        <span className="min-w-0 truncate">
          {mailboxes.length === 0
            ? "No mailboxes"
            : assignedCount > 0
              ? `${assignedCount} mailbox${assignedCount === 1 ? "" : "es"}`
              : "Assign mailbox"}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />
      </Dropdown.Trigger>
      <Dropdown.Popover
        placement="bottom end"
        className="min-w-[16rem] overflow-hidden rounded-2xl"
      >
        <Dropdown.Menu
          onAction={(key) => {
            const id = String(key);
            const box = mailboxes.find((item) => item.id === id);
            if (!box) return;
            if (box.assignedUserId === userId) {
              onAssign(box.id, null);
            } else {
              onAssign(box.id, userId);
            }
          }}
        >
          <Dropdown.Section>
            {mailboxes.map((box) => {
              const address = mailboxAddress(box);
              const mine = box.assignedUserId === userId;
              const taken =
                box.assignedUserId != null && box.assignedUserId !== userId;
              return (
                <Dropdown.Item
                  key={box.id}
                  id={box.id}
                  textValue={address}
                  isDisabled={taken}
                >
                  <div className="flex min-w-0 flex-col gap-0.5 py-0.5">
                    <Label className="leading-5" dir="ltr">
                      {address}
                    </Label>
                    <Description className="leading-4">
                      {mine
                        ? "Assigned · click to unassign"
                        : taken
                          ? "Assigned to someone else"
                          : "Unassigned"}
                    </Description>
                  </div>
                </Dropdown.Item>
              );
            })}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

function AssignedMailboxesLine({
  boxes,
}: {
  boxes: { id: string; localPart: string; domain: string; address?: string }[];
}) {
  if (boxes.length === 0) {
    return (
      <p className="mt-1 text-[12px] text-[var(--muted-foreground)]">
        No mailbox
      </p>
    );
  }

  return (
    <p className="mt-1 truncate text-[12px] text-[var(--muted-foreground)]" dir="ltr">
      {boxes.map((box) => mailboxAddress(box)).join(" · ")}
    </p>
  );
}

function PendingExpiryMeta({ expiresAt }: { expiresAt?: string | null }) {
  const text = formatExpiresIn(expiresAt);
  if (!text) return null;
  return (
    <span>
      {" · "}
      {text}
    </span>
  );
}

function MemberRow({
  member,
  canManage,
  busy,
  rowBusy,
  mailboxes,
  onChangeRole,
  onRequestRemove,
  onResend,
  onAssignMailbox,
}: {
  member: MailTeamMemberView;
  canManage: boolean;
  busy: boolean;
  rowBusy: boolean;
  mailboxes: MailTeamMailboxOption[];
  onChangeRole: (id: string, role: MailTeamRole) => void;
  onRequestRemove: (member: MailTeamMemberView) => void;
  onResend?: (id: string) => void;
  onAssignMailbox?: (mailboxId: string, userId: string | null) => void;
}) {
  const label = member.user.name || member.user.email;
  const pending = member.status === "PENDING";
  const when = formatRelativeDate(
    pending ? member.invitedAt : member.acceptedAt,
  );
  const assigned = member.assignedMailboxes ?? [];

  return (
    <li className="flex min-w-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 md:px-6">
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
            {pending && isExpiresSoon(member.expiresAt) ? (
              <Chip size="sm" variant="soft" color="warning">
                Expires soon
              </Chip>
            ) : null}
          </div>
          <p className="truncate text-[13px] text-[var(--muted-foreground)]">
            {member.user.email}
            {when ? (
              <span>
                {" · "}
                {pending ? `Invited ${when}` : `Joined ${when}`}
              </span>
            ) : null}
            {pending ? <PendingExpiryMeta expiresAt={member.expiresAt} /> : null}
          </p>
          {!pending ? <AssignedMailboxesLine boxes={assigned} /> : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
        {!pending && canManage && onAssignMailbox ? (
          <MailboxAssignDropdown
            userId={member.user.id}
            mailboxes={mailboxes}
            disabled={rowBusy || busy}
            onAssign={onAssignMailbox}
          />
        ) : null}

        {canManage && !pending ? (
          <RoleDropdown
            size="sm"
            label={`Role for ${label}`}
            value={member.role}
            disabled={rowBusy || busy}
            onChange={(next) => onChangeRole(member.id, next)}
          />
        ) : (
          <Chip size="sm" variant="soft">
            {roleLabel(member.role)}
          </Chip>
        )}

        {canManage ? (
          <Dropdown>
            <Dropdown.Trigger
              aria-label={`Actions for ${label}`}
              isDisabled={rowBusy || busy}
              className="inline-flex size-9 items-center justify-center rounded-full text-[var(--muted-foreground)] outline-none transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </Dropdown.Trigger>
            <Dropdown.Popover
              placement="bottom end"
              className="min-w-[10.5rem] overflow-hidden rounded-2xl"
            >
              <Dropdown.Menu
                onAction={(key) => {
                  if (key === "resend" && onResend) onResend(member.id);
                  if (key === "remove") onRequestRemove(member);
                }}
              >
                <Dropdown.Section>
                  {pending ? (
                    <Dropdown.Item id="resend" textValue="Resend">
                      Resend
                    </Dropdown.Item>
                  ) : null}
                  <Dropdown.Item
                    id="remove"
                    textValue={pending ? "Cancel invite" : "Remove"}
                    variant="danger"
                  >
                    {pending ? "Cancel invite" : "Remove"}
                  </Dropdown.Item>
                </Dropdown.Section>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        ) : null}
      </div>
    </li>
  );
}

function EmailInviteRow({
  invite,
  canManage,
  busy,
  rowBusy,
  onRequestCancel,
  onResend,
}: {
  invite: MailTeamEmailInviteView;
  canManage: boolean;
  busy: boolean;
  rowBusy: boolean;
  onRequestCancel: (invite: MailTeamEmailInviteView) => void;
  onResend: (id: string) => void;
}) {
  const when = formatRelativeDate(invite.invitedAt);

  return (
    <li className="flex min-w-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <PersonAvatar name={null} email={invite.email} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
              {invite.email}
            </p>
            <Chip size="sm" variant="soft" color="warning">
              Pending signup
            </Chip>
            {isExpiresSoon(invite.expiresAt) ? (
              <Chip size="sm" variant="soft" color="warning">
                Expires soon
              </Chip>
            ) : null}
          </div>
          <p className="truncate text-[13px] text-[var(--muted-foreground)]">
            Needs a Rukny account
            {when ? <span>{` · Invited ${when}`}</span> : null}
            <PendingExpiryMeta expiresAt={invite.expiresAt} />
          </p>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:justify-end">
        <Chip size="sm" variant="soft">
          {roleLabel(invite.role)}
        </Chip>
        {canManage ? (
          <Dropdown>
            <Dropdown.Trigger
              aria-label={`Actions for ${invite.email}`}
              isDisabled={rowBusy || busy}
              className="inline-flex size-9 items-center justify-center rounded-full text-[var(--muted-foreground)] outline-none transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </Dropdown.Trigger>
            <Dropdown.Popover
              placement="bottom end"
              className="min-w-[10.5rem] overflow-hidden rounded-2xl"
            >
              <Dropdown.Menu
                onAction={(key) => {
                  if (key === "resend") onResend(invite.id);
                  if (key === "remove") onRequestCancel(invite);
                }}
              >
                <Dropdown.Section>
                  <Dropdown.Item id="resend" textValue="Resend">
                    Resend
                  </Dropdown.Item>
                  <Dropdown.Item
                    id="remove"
                    textValue="Cancel invite"
                    variant="danger"
                  >
                    Cancel invite
                  </Dropdown.Item>
                </Dropdown.Section>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        ) : null}
      </div>
    </li>
  );
}

function RolePermissionsPanel() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--surface)]">
      <Disclosure isExpanded={expanded} onExpandedChange={setExpanded}>
        <Disclosure.Heading>
          <Disclosure.Trigger className="flex w-full items-center justify-between gap-3 px-4 py-4 text-start outline-none md:px-6">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
                Role permissions
              </p>
              <p className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">
                What each role can do in this workspace
              </p>
            </div>
            <Disclosure.Indicator className="shrink-0 text-[var(--muted-foreground)]" />
          </Disclosure.Trigger>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body className="border-t border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-4 pb-5 pt-3 md:px-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
                    <th className="pb-2 pr-3 font-semibold">Capability</th>
                    <th className="pb-2 px-2 font-semibold">Owner</th>
                    <th className="pb-2 px-2 font-semibold">Admin</th>
                    <th className="pb-2 px-2 font-semibold">Billing</th>
                    <th className="pb-2 px-2 font-semibold">Member</th>
                    <th className="pb-2 pl-2 font-semibold">Viewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color-mix(in_srgb,var(--foreground)_6%,transparent)]">
                  {PERMISSION_ROWS.map((row) => (
                    <tr key={row.label}>
                      <td className="py-2.5 pr-3 font-medium text-[var(--foreground)]">
                        {row.label}
                      </td>
                      {(
                        [
                          row.owner,
                          row.admin,
                          row.billing,
                          row.member,
                          row.viewer,
                        ] as boolean[]
                      ).map((allowed, index) => (
                        <td
                          key={`${row.label}-${index}`}
                          className="px-2 py-2.5 text-center text-[var(--muted-foreground)]"
                        >
                          {allowed ? (
                            <Check
                              className="mx-auto size-3.5 text-[var(--foreground)]"
                              aria-label="Allowed"
                            />
                          ) : (
                            <span aria-label="Not allowed">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[12px] leading-5 text-[var(--muted-foreground)]">
              Owner has full access. Viewer is read-only and can SSO only into an
              assigned mailbox.
            </p>
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
}

export function MailTeamPage() {
  const router = useRouter();
  const pathname = usePathname();
  const slot = parseMailSlot(pathname);
  const mailboxesHref = withMailSlot("/mailboxes", slot);

  const inviteEmailRef = useRef<HTMLInputElement | null>(null);
  const inviteSectionRef = useRef<HTMLDivElement | null>(null);

  const [appId, setAppId] = useState<string | null>(null);
  const [roster, setRoster] = useState<MailTeamRoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MailTeamRole>("MEMBER");
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferMemberId, setTransferMemberId] = useState("");
  const [transferConfirm, setTransferConfirm] = useState("");

  useEffect(() => {
    const id = readMailAppIdFromDocument();
    if (!id) {
      window.location.assign("/apps?error=app_required");
      return;
    }
    setAppId(id);
  }, []);

  const load = useCallback(async (id: string, opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const next = await listMailTeam(id);
      setRoster(next);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load team.");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!appId) return;
    void load(appId);
  }, [appId, load]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 4000);
    return () => window.clearTimeout(timer);
  }, [success]);

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

  const activeMembers = useMemo(
    () => (roster?.members ?? []).filter((m) => m.status === "ACCEPTED"),
    [roster],
  );
  const pendingMembers = useMemo(
    () => (roster?.members ?? []).filter((m) => m.status === "PENDING"),
    [roster],
  );
  const emailInvites = useMemo(
    () => roster?.emailInvites ?? [],
    [roster],
  );
  const mailboxes = useMemo(
    () => roster?.mailboxes ?? [],
    [roster],
  );

  const peopleCount = useMemo(() => {
    if (!roster) return 0;
    return (roster.owner ? 1 : 0) + activeMembers.length;
  }, [activeMembers.length, roster]);

  const pendingCount = pendingMembers.length + emailInvites.length;

  const needsUpgrade = Boolean(roster && roster.consoleMembersIncluded === 0);
  const atSeatLimit = Boolean(roster && seatsLeft <= 0 && !needsUpgrade);
  const inviteLocked = busy || needsUpgrade || atSeatLimit;
  const emailValid = looksLikeEmail(email);
  const showInvitePanel =
    Boolean(roster?.canManage) &&
    (inviteOpen || peopleCount + pendingCount <= 1);

  const query = search.trim();

  const filteredOwner = useMemo(() => {
    if (!roster?.owner) return null;
    if (statusFilter === "pending") return null;
    if (roleFilter !== "ALL" && roleFilter !== "OWNER") return null;
    if (!matchesSearch(query, roster.owner.name, roster.owner.email)) return null;
    return roster.owner;
  }, [query, roleFilter, roster, statusFilter]);

  const filteredActive = useMemo(() => {
    if (statusFilter === "pending") return [];
    return activeMembers.filter((member) => {
      if (roleFilter !== "ALL" && member.role !== roleFilter) return false;
      return matchesSearch(query, member.user.name, member.user.email);
    });
  }, [activeMembers, query, roleFilter, statusFilter]);

  const filteredPendingMembers = useMemo(() => {
    if (statusFilter === "active") return [];
    return pendingMembers.filter((member) => {
      if (roleFilter !== "ALL" && member.role !== roleFilter) return false;
      return matchesSearch(query, member.user.name, member.user.email);
    });
  }, [pendingMembers, query, roleFilter, statusFilter]);

  const filteredEmailInvites = useMemo(() => {
    if (statusFilter === "active") return [];
    return emailInvites.filter((invite) => {
      if (roleFilter !== "ALL" && invite.role !== roleFilter) return false;
      return matchesSearch(query, null, invite.email);
    });
  }, [emailInvites, query, roleFilter, statusFilter]);

  const hasAnyPeople =
    Boolean(roster?.owner) ||
    activeMembers.length > 0 ||
    pendingMembers.length > 0 ||
    emailInvites.length > 0;

  const hasFilteredPeople =
    Boolean(filteredOwner) ||
    filteredActive.length > 0 ||
    filteredPendingMembers.length > 0 ||
    filteredEmailInvites.length > 0;

  const workspaceName = roster?.workspace?.name?.trim() || "";
  const transferMember = activeMembers.find((m) => m.id === transferMemberId);
  const transferConfirmOk =
    Boolean(workspaceName) &&
    transferConfirm.trim().toLowerCase() === workspaceName.toLowerCase() &&
    Boolean(transferMemberId);

  function focusInvite() {
    setInviteOpen(true);
    window.requestAnimationFrame(() => {
      inviteSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      inviteEmailRef.current?.focus();
    });
  }

  async function onInvite() {
    if (!appId || busy || !emailValid) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const invited = email.trim();
      const result = await inviteMailTeamMember(appId, {
        email: invited,
        role,
      });
      setEmail("");
      setRole("MEMBER");
      setSuccess(
        result.needsSignup
          ? `Signup invite sent to ${invited}. They’ll join after creating an account.`
          : `Invite sent to ${invited}.`,
      );
      await load(appId, { silent: true });
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
      await load(appId, { silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update role.");
    } finally {
      setBusyId(null);
    }
  }

  async function onRemove(target: RemoveTarget) {
    if (!appId || busyId) return;
    const id =
      target.kind === "member" ? target.member.id : target.invite.id;
    setBusyId(id);
    setError("");
    setSuccess("");
    try {
      await removeMailTeamMember(appId, id);
      setSuccess(
        target.kind === "member" && target.member.status !== "PENDING"
          ? "Teammate removed."
          : "Invite cancelled.",
      );
      await load(appId, { silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove.");
    } finally {
      setBusyId(null);
    }
  }

  async function onResend(id: string) {
    if (!appId || busyId) return;
    setBusyId(id);
    setError("");
    setSuccess("");
    try {
      await resendMailTeamInvite(appId, id);
      setSuccess("Invite resent.");
      await load(appId, { silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend invite.");
    } finally {
      setBusyId(null);
    }
  }

  async function onAssignMailbox(mailboxId: string, userId: string | null) {
    if (!appId || busyId) return;
    setBusyId(mailboxId);
    setError("");
    setSuccess("");
    try {
      await assignMailMailbox(appId, mailboxId, userId);
      setSuccess(userId ? "Mailbox assigned." : "Mailbox unassigned.");
      await load(appId, { silent: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update mailbox assignment.",
      );
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

  async function onTransfer() {
    if (!appId || busy || !transferConfirmOk) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await transferMailOwnership(appId, transferMemberId);
      setTransferOpen(false);
      setTransferMemberId("");
      setTransferConfirm("");
      setSuccess("Ownership transferred.");
      await load(appId, { silent: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not transfer ownership.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6"
      dir="ltr"
    >
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Team
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
            Invite people to this workspace, set their role, and assign
            mailboxes here or from{" "}
            <Link
              href={mailboxesHref}
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              Mailboxes
            </Link>
            .
          </p>
        </div>

        {!loading && roster?.canManage ? (
          <Button
            className="h-10 shrink-0 rounded-full px-4"
            isDisabled={inviteLocked && !showInvitePanel}
            onPress={focusInvite}
          >
            <UserPlus className="size-4" aria-hidden />
            Invite
          </Button>
        ) : null}
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
          <div className="space-y-3 rounded-2xl bg-[var(--surface)] p-5 md:p-6">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-3 rounded-2xl bg-[var(--surface)] p-5 md:p-6">
            <Skeleton className="h-5 w-28 rounded-lg" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-[var(--surface)] px-4 py-4 md:px-6 md:py-5">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[var(--muted-foreground)]">
                  Console seats
                </p>
                <p className="mt-0.5 text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
                  {needsUpgrade
                    ? "No seats on this plan"
                    : `${roster.consoleMembersUsed} of ${roster.consoleMembersIncluded} used`}
                  {!needsUpgrade && seatsLeft > 0 ? (
                    <span className="font-normal text-[var(--muted-foreground)]">
                      {" "}
                      · {seatsLeft} left
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip size="sm" variant="soft">
                  {peopleCount} {peopleCount === 1 ? "member" : "members"}
                </Chip>
                {pendingCount > 0 ? (
                  <Chip size="sm" variant="soft" color="warning">
                    {pendingCount} pending
                  </Chip>
                ) : null}
              </div>
            </div>

            {!needsUpgrade ? (
              <Meter
                aria-label="Console seats used"
                className="mt-3 gap-0"
                size="sm"
                value={seatPercent}
              >
                <Meter.Track className="rounded-full bg-[var(--surface-secondary)]">
                  <Meter.Fill
                    className={
                      atSeatLimit
                        ? "rounded-full bg-[var(--warning)]"
                        : "rounded-full bg-[var(--foreground)]"
                    }
                  />
                </Meter.Track>
              </Meter>
            ) : null}

            {needsUpgrade ? (
              <div className="mt-4">
                <MailNotice
                  status="warning"
                  title="Invites locked"
                  description="Upgrade to Standard or Premium to invite teammates."
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

          {roster.canManage && showInvitePanel ? (
            <div
              ref={inviteSectionRef}
              className="rounded-2xl bg-[var(--surface)] px-4 py-5 md:px-6 md:py-6"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
                    Invite teammate
                  </h2>
                  <p className="mt-1 text-[13px] leading-5 text-[var(--muted-foreground)]">
                    Works for existing Rukny accounts and new emails — we’ll send
                    a signup link when needed.
                  </p>
                </div>
                {peopleCount + pendingCount > 1 ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full"
                    onPress={() => setInviteOpen(false)}
                  >
                    Close
                  </Button>
                ) : null}
              </div>

              <form
                className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end"
                onSubmit={(event) => {
                  event.preventDefault();
                  void onInvite();
                }}
              >
                <TextField
                  isRequired
                  fullWidth
                  className="min-w-0 flex-1 gap-1.5"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  isDisabled={inviteLocked}
                  isInvalid={email.length > 0 && !emailValid}
                >
                  <Label className="text-[13px] font-medium text-[var(--foreground)]">
                    Email
                  </Label>
                  <Input
                    ref={inviteEmailRef}
                    placeholder="teammate@company.com"
                    autoComplete="email"
                    className="h-11 rounded-xl"
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
                  type="submit"
                  className="h-11 shrink-0 rounded-full px-5 lg:self-end"
                  isDisabled={inviteLocked || !emailValid}
                >
                  {busy ? "Sending…" : "Send invite"}
                </Button>
              </form>
            </div>
          ) : null}

          {hasAnyPeople ? (
            <div className="overflow-hidden rounded-2xl bg-[var(--surface)]">
              <div className="flex flex-col gap-3 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-4 py-4 md:px-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
                    People
                  </h2>
                  <p className="text-[12px] tabular-nums text-[var(--muted-foreground)]">
                    {peopleCount + pendingCount} total
                  </p>
                </div>

                <SearchField
                  fullWidth
                  aria-label="Search team"
                  name="team-search"
                  value={search}
                  onChange={setSearch}
                >
                  <SearchField.Group className="h-9 rounded-xl border-0 bg-[var(--field-background)]">
                    <SearchField.SearchIcon className="text-[var(--muted-foreground)]" />
                    <SearchField.Input
                      placeholder="Search by name or email…"
                      className="text-sm placeholder:text-[var(--muted-foreground)]"
                    />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: "all", label: "All" },
                      { id: "active", label: "Active" },
                      { id: "pending", label: "Pending" },
                    ] as const
                  ).map((item) => (
                    <FilterChip
                      key={item.id}
                      active={statusFilter === item.id}
                      label={item.label}
                      onPress={() => setStatusFilter(item.id)}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: "ALL", label: "Any role" },
                      { id: "OWNER", label: "Owner" },
                      { id: "ADMIN", label: "Admin" },
                      { id: "BILLING", label: "Billing" },
                      { id: "MEMBER", label: "Member" },
                      { id: "VIEWER", label: "Viewer" },
                    ] as const
                  ).map((item) => (
                    <FilterChip
                      key={item.id}
                      active={roleFilter === item.id}
                      label={item.label}
                      onPress={() => setRoleFilter(item.id)}
                    />
                  ))}
                </div>
              </div>

              {hasFilteredPeople ? (
                <>
                  {statusFilter !== "pending" &&
                  (filteredOwner || filteredActive.length > 0) ? (
                    <ul className="divide-y divide-[color-mix(in_srgb,var(--foreground)_6%,transparent)]">
                      {filteredOwner ? (
                        <li className="flex min-w-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 md:px-6">
                          <div className="flex min-w-0 flex-1 items-center gap-3.5">
                            <PersonAvatar
                              name={filteredOwner.name}
                              email={filteredOwner.email}
                              avatar={filteredOwner.avatar}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                                {filteredOwner.name || filteredOwner.email}
                              </p>
                              <p className="truncate text-[13px] text-[var(--muted-foreground)]">
                                {filteredOwner.email}
                              </p>
                              <AssignedMailboxesLine
                                boxes={filteredOwner.assignedMailboxes ?? []}
                              />
                            </div>
                          </div>
                          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
                            {roster.canManage ? (
                              <MailboxAssignDropdown
                                userId={filteredOwner.id}
                                mailboxes={mailboxes}
                                disabled={busy || busyId != null}
                                onAssign={(mailboxId, userId) =>
                                  void onAssignMailbox(mailboxId, userId)
                                }
                              />
                            ) : null}
                            <Chip size="sm" variant="soft" color="accent">
                              Owner
                            </Chip>
                          </div>
                        </li>
                      ) : null}

                      {filteredActive.map((member) => (
                        <MemberRow
                          key={member.id}
                          member={member}
                          canManage={roster.canManage}
                          busy={busy}
                          rowBusy={busyId === member.id}
                          mailboxes={mailboxes}
                          onChangeRole={(id, next) => void onChangeRole(id, next)}
                          onRequestRemove={(m) =>
                            setRemoveTarget({ kind: "member", member: m })
                          }
                          onAssignMailbox={(mailboxId, userId) =>
                            void onAssignMailbox(mailboxId, userId)
                          }
                        />
                      ))}
                    </ul>
                  ) : null}

                  {statusFilter !== "active" &&
                  (filteredPendingMembers.length > 0 ||
                    filteredEmailInvites.length > 0) ? (
                    <>
                      <div className="border-t border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_2.5%,var(--surface))] px-4 py-2.5 md:px-6">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--muted-foreground)]">
                          Pending invites
                        </p>
                      </div>
                      <ul className="divide-y divide-[color-mix(in_srgb,var(--foreground)_6%,transparent)]">
                        {filteredPendingMembers.map((member) => (
                          <MemberRow
                            key={member.id}
                            member={member}
                            canManage={roster.canManage}
                            busy={busy}
                            rowBusy={busyId === member.id}
                            mailboxes={mailboxes}
                            onChangeRole={(id, next) => void onChangeRole(id, next)}
                            onRequestRemove={(m) =>
                              setRemoveTarget({ kind: "member", member: m })
                            }
                            onResend={(id) => void onResend(id)}
                          />
                        ))}
                        {filteredEmailInvites.map((invite) => (
                          <EmailInviteRow
                            key={invite.id}
                            invite={invite}
                            canManage={roster.canManage}
                            busy={busy}
                            rowBusy={busyId === invite.id}
                            onRequestCancel={(item) =>
                              setRemoveTarget({
                                kind: "email_invite",
                                invite: item,
                              })
                            }
                            onResend={(id) => void onResend(id)}
                          />
                        ))}
                      </ul>
                    </>
                  ) : null}
                </>
              ) : (
                <div className="px-4 py-10 text-center md:px-6">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    No people match these filters
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
                    Try a different search or clear the role filter.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState className="rounded-2xl bg-[var(--surface)] px-5 py-14">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
                <Users className="size-5" aria-hidden />
              </div>
              <p className="mt-4 text-[15px] font-semibold text-[var(--foreground)]">
                No teammates yet
              </p>
              <p className="mt-1.5 max-w-sm text-sm leading-6 text-[var(--muted-foreground)]">
                {roster.canManage
                  ? "Send an invite above. After they accept, assign a mailbox from this page or Mailboxes."
                  : "Only the owner can invite people to this workspace."}
              </p>
              {roster.canManage && !inviteLocked ? (
                <Button className="mt-5 rounded-full" onPress={focusInvite}>
                  <UserPlus className="size-4" aria-hidden />
                  Invite teammate
                </Button>
              ) : null}
            </EmptyState>
          )}

          <RolePermissionsPanel />

          {roster.canManage &&
          pendingCount === 0 &&
          activeMembers.length > 0 ? (
            <p className="flex items-start gap-2 px-1 text-[13px] leading-5 text-[var(--muted-foreground)]">
              <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              After someone joins, assign them a mailbox here or open{" "}
              <Link
                href={mailboxesHref}
                className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
              >
                Mailboxes
              </Link>
              .
            </p>
          ) : null}

          {roster.isOwner ? (
            <div className="rounded-2xl bg-[var(--surface)] px-4 py-5 md:px-6">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
                    Transfer ownership
                  </h2>
                  <p className="mt-1 text-[13px] leading-5 text-[var(--muted-foreground)]">
                    Move this workspace to another accepted member. You’ll become
                    an admin.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="shrink-0 rounded-full"
                  isDisabled={busy || activeMembers.length === 0}
                  onPress={() => {
                    setTransferMemberId(activeMembers[0]?.id ?? "");
                    setTransferConfirm("");
                    setTransferOpen(true);
                  }}
                >
                  Transfer ownership
                </Button>
              </div>
            </div>
          ) : null}

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

          <AlertDialog>
            <AlertDialog.Backdrop
              isOpen={removeTarget != null}
              onOpenChange={(open) => {
                if (!open) setRemoveTarget(null);
              }}
            >
              <AlertDialog.Container>
                <AlertDialog.Dialog className="sm:max-w-[400px]">
                  <AlertDialog.CloseTrigger />
                  <AlertDialog.Header>
                    <AlertDialog.Icon status="danger" />
                    <AlertDialog.Heading>
                      {removeTarget?.kind === "email_invite"
                        ? `Cancel invite for ${removeTarget.invite.email}?`
                        : removeTarget?.member.status === "PENDING"
                          ? `Cancel invite for ${removeTarget.member.user.name || removeTarget.member.user.email}?`
                          : `Remove ${removeTarget?.member.user.name || removeTarget?.member.user.email}?`}
                    </AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {removeTarget?.kind === "email_invite" ||
                      removeTarget?.member.status === "PENDING"
                        ? "They will not be able to join this workspace with this invite."
                        : "They lose console access to this workspace. Assigned mailboxes stay on the domain."}
                    </p>
                  </AlertDialog.Body>
                  <AlertDialog.Footer>
                    <Button slot="close" variant="tertiary">
                      Cancel
                    </Button>
                    <Button
                      slot="close"
                      variant="danger"
                      onPress={() => {
                        if (!removeTarget) return;
                        void onRemove(removeTarget);
                      }}
                    >
                      {removeTarget?.kind === "email_invite" ||
                      removeTarget?.member.status === "PENDING"
                        ? "Cancel invite"
                        : "Remove"}
                    </Button>
                  </AlertDialog.Footer>
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>

          <AlertDialog>
            <AlertDialog.Backdrop
              isOpen={transferOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setTransferOpen(false);
                  setTransferConfirm("");
                }
              }}
            >
              <AlertDialog.Container>
                <AlertDialog.Dialog className="sm:max-w-[440px]">
                  <AlertDialog.CloseTrigger />
                  <AlertDialog.Header>
                    <AlertDialog.Icon status="danger" />
                    <AlertDialog.Heading>
                      Transfer workspace ownership?
                    </AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body className="space-y-4">
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Choose an accepted member. You will become an admin after
                      the transfer.
                    </p>

                    <div className="min-w-0">
                      <Label className="mb-1.5 block text-[13px] font-medium text-[var(--foreground)]">
                        New owner
                      </Label>
                      <Dropdown>
                        <Dropdown.Trigger
                          aria-label="Select new owner"
                          className="inline-flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl bg-[var(--field-background)] px-3.5 text-start text-sm font-medium text-[var(--foreground)] outline-none"
                        >
                          <span className="min-w-0 truncate">
                            {transferMember
                              ? transferMember.user.name ||
                                transferMember.user.email
                              : "Select member"}
                          </span>
                          <ChevronDown className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />
                        </Dropdown.Trigger>
                        <Dropdown.Popover
                          placement="bottom start"
                          className="min-w-[16rem] overflow-hidden rounded-2xl"
                        >
                          <Dropdown.Menu
                            selectedKeys={
                              transferMemberId
                                ? new Set([transferMemberId])
                                : new Set()
                            }
                            selectionMode="single"
                            onSelectionChange={(keys) => {
                              if (keys === "all") return;
                              const next = [...keys][0];
                              if (next == null) return;
                              setTransferMemberId(String(next));
                            }}
                          >
                            <Dropdown.Section>
                              {activeMembers.map((member) => (
                                <Dropdown.Item
                                  key={member.id}
                                  id={member.id}
                                  textValue={
                                    member.user.name || member.user.email
                                  }
                                >
                                  <Dropdown.ItemIndicator />
                                  <div className="flex min-w-0 flex-col gap-0.5 py-0.5">
                                    <Label className="leading-5">
                                      {member.user.name || member.user.email}
                                    </Label>
                                    <Description className="leading-4">
                                      {member.user.email}
                                    </Description>
                                  </div>
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Section>
                          </Dropdown.Menu>
                        </Dropdown.Popover>
                      </Dropdown>
                    </div>

                    <TextField
                      fullWidth
                      className="gap-1.5"
                      value={transferConfirm}
                      onChange={setTransferConfirm}
                    >
                      <Label className="text-[13px] font-medium text-[var(--foreground)]">
                        Type{" "}
                        <span className="font-semibold">{workspaceName || "…"}</span>{" "}
                        to confirm
                      </Label>
                      <Input
                        placeholder={workspaceName || "Workspace name"}
                        className="h-11 rounded-xl"
                        autoComplete="off"
                      />
                    </TextField>
                  </AlertDialog.Body>
                  <AlertDialog.Footer>
                    <Button slot="close" variant="tertiary">
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      isDisabled={!transferConfirmOk || busy}
                      onPress={() => void onTransfer()}
                    >
                      {busy ? "Transferring…" : "Transfer ownership"}
                    </Button>
                  </AlertDialog.Footer>
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>
        </>
      )}
    </section>
  );
}
