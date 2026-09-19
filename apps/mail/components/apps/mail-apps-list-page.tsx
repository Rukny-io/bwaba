"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Layers } from "lucide-react";
import type { MailApp } from "@/lib/mail-apps-client";
import { MailAppCard } from "@/components/apps/mail-app-card";
import {
  acceptMailInvitation,
  declineMailInvitation,
  listMailInvitations,
  type MailTeamInvitation,
} from "@/lib/mail-team-client";

interface MailAppsListPageProps {
  apps: MailApp[];
  currentAppId?: string | null;
}

export function MailAppsListPage({ apps, currentAppId }: MailAppsListPageProps) {
  const isEmpty = apps.length === 0;
  const [invitations, setInvitations] = useState<MailTeamInvitation[]>([]);
  const [inviteBusy, setInviteBusy] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState("");

  const loadInvites = useCallback(async () => {
    try {
      const rows = await listMailInvitations();
      setInvitations(rows);
      setInviteError("");
    } catch {
      /* picker still works without invites */
    }
  }, []);

  useEffect(() => {
    void loadInvites();
  }, [loadInvites]);

  async function onAccept(memberId: string) {
    setInviteBusy(memberId);
    setInviteError("");
    try {
      const result = await acceptMailInvitation(memberId);
      window.location.assign(`/apps/${result.appId}/open`);
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : "Could not accept invitation.",
      );
      setInviteBusy(null);
    }
  }

  async function onDecline(memberId: string) {
    setInviteBusy(memberId);
    setInviteError("");
    try {
      await declineMailInvitation(memberId);
      setInvitations((prev) => prev.filter((row) => row.id !== memberId));
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : "Could not decline invitation.",
      );
    } finally {
      setInviteBusy(null);
    }
  }

  return (
    <div className="dashboard-section-stack" dir="ltr">
      <header className="space-y-2 text-center">
        <p className="text-xs font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
          Mail workspaces
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
          {isEmpty && invitations.length === 0
            ? "Set up your mail"
            : "Your workspaces"}
        </h1>
        <p className="mx-auto max-w-md text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
          {isEmpty && invitations.length === 0
            ? "One workspace per domain — mailboxes, DNS, and its own plan."
            : "Owned and invited workspaces appear here. Open one or add another."}
        </p>
      </header>

      {inviteError ? (
        <p className="rounded-xl border border-[var(--danger)]/30 bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-4 py-3 text-center text-sm text-[var(--danger)]">
          {inviteError}
        </p>
      ) : null}

      {invitations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-center text-sm font-semibold text-[var(--foreground)]">
            Invitations
          </h2>
          {invitations.map((invite) => (
            <div
              key={invite.id}
              className="dashboard-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate font-semibold text-[var(--foreground)]">
                  {invite.workspace.name}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  {invite.inviter.name || invite.inviter.email} invited you as{" "}
                  {invite.role.toLowerCase()}
                  {invite.workspace.primaryDomain
                    ? ` · ${invite.workspace.primaryDomain}`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={inviteBusy === invite.id}
                  onClick={() => void onDecline(invite.id)}
                  className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  type="button"
                  disabled={inviteBusy === invite.id}
                  onClick={() => void onAccept(invite.id)}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50"
                >
                  {inviteBusy === invite.id ? "Opening…" : "Accept"}
                </button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {isEmpty ? (
        <div className="dashboard-card flex flex-col items-center gap-4 p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]">
            <Layers className="size-7" />
          </span>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
            {invitations.length > 0
              ? "Accept an invitation above, or create your own workspace."
              : "No workspace yet. Connect a domain you own and create your first mailbox."}
          </p>
          <Link
            href="/apps/creation"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            Start mail
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {apps.map((app) => (
            <MailAppCard
              key={app.appId}
              app={app}
              href={`/apps/${app.appId}/open`}
              active={currentAppId === app.appId}
            />
          ))}

          <Link
            href="/apps/creation"
            className="dashboard-card group flex min-h-[120px] flex-col items-center justify-center gap-2 border border-dashed border-[var(--border)] p-5 transition-colors hover:bg-[var(--surface-secondary)]"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)]">
              <Plus className="size-5" />
            </span>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              New workspace
            </span>
          </Link>
        </div>
      )}

      <p className="text-center text-xs text-[var(--muted-foreground)]">
        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="size-3" />
          Back to home
        </Link>
      </p>
    </div>
  );
}
