"use client";

import { Inbox, Users } from "lucide-react";
import type { MailTeamInvitation } from "@/lib/mail-team-client";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "admin",
  BILLING: "billing",
  MEMBER: "member",
  VIEWER: "viewer",
};

function inviterLabel(invite: MailTeamInvitation) {
  return invite.inviter.name || invite.inviter.email;
}

/** Big single-invite hero: one click joins the team and opens the inbox. */
export function MailInviteJoinHero({
  invite,
  busy,
  onAccept,
  onDecline,
}: {
  invite: MailTeamInvitation;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const mailbox = invite.reservedMailboxes[0];
  return (
    <div className="dashboard-card flex flex-col items-center gap-5 p-6 text-center sm:p-8">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]">
        <Users className="size-7" />
      </span>
      <div className="space-y-1.5">
        <p className="text-lg font-semibold text-[var(--foreground)]">
          Join {invite.workspace.name}
        </p>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
          {inviterLabel(invite)} invited you as {ROLE_LABELS[invite.role] ?? "member"}. No setup
          needed — the workspace and domain are already ready.
        </p>
      </div>

      {mailbox ? (
        <div className="flex max-w-full items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-4 py-2 text-sm">
          <Inbox className="size-4 shrink-0 text-[var(--muted-foreground)]" />
          <span className="truncate font-medium text-[var(--foreground)]" dir="ltr">
            {mailbox}
          </span>
          {invite.reservedMailboxes.length > 1 ? (
            <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
              +{invite.reservedMailboxes.length - 1}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex w-full max-w-xs flex-col gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onAccept}
          className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Opening…" : mailbox ? "Join & open my inbox" : "Join workspace"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDecline}
          className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

/** Compact row used when there are several invites or the user already has workspaces. */
export function MailInviteRow({
  invite,
  busy,
  onAccept,
  onDecline,
}: {
  invite: MailTeamInvitation;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const mailbox = invite.reservedMailboxes[0];
  return (
    <div className="dashboard-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate font-semibold text-[var(--foreground)]">{invite.workspace.name}</p>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
          {inviterLabel(invite)} invited you as {ROLE_LABELS[invite.role] ?? "member"}
          {invite.workspace.primaryDomain ? ` · ${invite.workspace.primaryDomain}` : ""}
        </p>
        {mailbox ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--foreground)]">
            <Inbox className="size-3.5 text-[var(--muted-foreground)]" />
            <span dir="ltr" className="truncate">
              {mailbox}
            </span>
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onDecline}
          className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] disabled:opacity-50"
        >
          Decline
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onAccept}
          className="inline-flex h-9 items-center justify-center rounded-full bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50"
        >
          {busy ? "Opening…" : mailbox ? "Join & open inbox" : "Accept"}
        </button>
      </div>
    </div>
  );
}
