"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Layers } from "lucide-react";
import type { MailApp } from "@/lib/mail-apps-client";
import { MailAppCard } from "@/components/apps/mail-app-card";
import { MailInviteJoinHero, MailInviteRow } from "@/components/apps/mail-invite-join-card";
import { MailJoinTeamCard } from "@/components/apps/mail-join-team-card";
import { fetchCurrentUser } from "@/lib/api/auth";
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
  const [invitesLoaded, setInvitesLoaded] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState("");

  const loadInvites = useCallback(async () => {
    try {
      const rows = await listMailInvitations();
      setInvitations(rows);
      setInviteError("");
    } catch {
      /* picker still works without invites */
    } finally {
      setInvitesLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadInvites();
    void fetchCurrentUser()
      .then((user) => setAccountEmail(user?.email ?? null))
      .catch(() => undefined);
  }, [loadInvites]);

  async function onAccept(invite: MailTeamInvitation) {
    setInviteBusy(invite.id);
    setInviteError("");
    try {
      const result = await acceptMailInvitation(invite);
      const next = invite.reservedMailboxes.length ? "?next=inbox" : "";
      window.location.assign(`/apps/${result.appId}/open${next}`);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Could not accept invitation.");
      setInviteBusy(null);
    }
  }

  async function onDecline(invite: MailTeamInvitation) {
    setInviteBusy(invite.id);
    setInviteError("");
    try {
      await declineMailInvitation(invite);
      setInvitations((prev) => prev.filter((row) => row.id !== invite.id));
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Could not decline invitation.");
    } finally {
      setInviteBusy(null);
    }
  }

  const singleInvite = isEmpty && invitations.length === 1 ? invitations[0] : null;
  const firstRun = isEmpty && invitations.length === 0;

  const heading = singleInvite
    ? "You're invited"
    : firstRun
      ? "Get started with Mail"
      : "Your workspaces";
  const lead = singleInvite
    ? "Your team already set everything up. Join to open your mailbox."
    : firstRun
      ? "Join your team's workspace, or create your own for a domain you own."
      : "Owned and invited workspaces appear here. Open one or add another.";

  if (isEmpty && !invitesLoaded) {
    return (
      <p className="py-16 text-center text-sm text-[var(--muted-foreground)]">Loading…</p>
    );
  }

  return (
    <div className="dashboard-section-stack" dir="ltr">
      <header className="space-y-2 text-center">
        <p className="text-xs font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
          Mail workspaces
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
          {heading}
        </h1>
        <p className="mx-auto max-w-md text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
          {lead}
        </p>
      </header>

      {inviteError ? (
        <p className="rounded-xl border border-[var(--danger)]/30 bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-4 py-3 text-center text-sm text-[var(--danger)]">
          {inviteError}
        </p>
      ) : null}

      {singleInvite ? (
        <>
          <MailInviteJoinHero
            invite={singleInvite}
            busy={inviteBusy === singleInvite.id}
            onAccept={() => void onAccept(singleInvite)}
            onDecline={() => void onDecline(singleInvite)}
          />
          <p className="text-center text-xs text-[var(--muted-foreground)]">
            Not what you need?{" "}
            <Link href="/apps/creation" className="font-medium text-[var(--foreground)] hover:underline">
              Create your own workspace
            </Link>
          </p>
        </>
      ) : (
        <>
          {invitations.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-center text-sm font-semibold text-[var(--foreground)]">
                Invitations
              </h2>
              {invitations.map((invite) => (
                <MailInviteRow
                  key={`${invite.kind}:${invite.id}`}
                  invite={invite}
                  busy={inviteBusy === invite.id}
                  onAccept={() => void onAccept(invite)}
                  onDecline={() => void onDecline(invite)}
                />
              ))}
            </section>
          ) : null}

          {firstRun ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <MailJoinTeamCard accountEmail={accountEmail} />
              <div className="dashboard-card flex flex-col gap-4 p-6 text-left">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]">
                  <Layers className="size-5" />
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-[var(--foreground)]">Create a workspace</p>
                  <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                    Connect a domain you own, then add mailboxes and invite your team.
                  </p>
                </div>
                <Link
                  href="/apps/creation"
                  className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
                >
                  <Plus className="size-4" />
                  Start mail
                </Link>
              </div>
            </div>
          ) : isEmpty ? (
            <p className="text-center text-xs text-[var(--muted-foreground)]">
              Or{" "}
              <Link href="/apps/creation" className="font-medium text-[var(--foreground)] hover:underline">
                create your own workspace
              </Link>
            </p>
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
        </>
      )}

      <p className="text-center text-xs text-[var(--muted-foreground)]">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-[var(--foreground)]">
          <ArrowLeft className="size-3" />
          Back to home
        </Link>
      </p>
    </div>
  );
}
