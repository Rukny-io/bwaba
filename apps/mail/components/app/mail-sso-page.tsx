"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Skeleton } from "@heroui/react";
import { MailNotice } from "@/components/app/mail-notice";
import { MailSsoAddCard } from "@/components/app/sso/mail-sso-add-card";
import { MailSsoBulkCard } from "@/components/app/sso/mail-sso-bulk-card";
import { MailSsoEnterpriseCard } from "@/components/app/sso/mail-sso-enterprise-card";
import {
  MailSsoPeopleCard,
  type MailSsoPersonAction,
} from "@/components/app/sso/mail-sso-people-card";
import { copyToClipboard } from "@/components/app/sso/mail-sso-select";
import { MailSsoSettingsCard } from "@/components/app/sso/mail-sso-settings-card";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import {
  getMailSsoOverview,
  getMailSecurityAudit,
  provisionMailSso,
  provisionMailSsoBulk,
  resendMailSsoLink,
  revokeMailSsoLink,
  updateMailSsoSettings,
  type MailSsoOverview,
  type MailSsoPerson,
  type MailSsoProvisionInput,
  type MailSsoSettings,
  type MailSecurityAuditEvent,
} from "@/lib/mail-sso-client";
import type { MailTeamRole } from "@/lib/mail-team-client";

export function MailSsoPage() {
  const pathname = usePathname();
  const slot = parseMailSlot(pathname);
  const [appId, setAppId] = useState<string | null>(null);
  const [data, setData] = useState<MailSsoOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<MailSecurityAuditEvent[]>([]);

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
      const [overview, audit] = await Promise.all([
        getMailSsoOverview(id),
        getMailSecurityAudit(id).catch(() => []),
      ]);
      setData(overview);
      setAuditEvents(audit);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load SSO.");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (appId) void load(appId);
  }, [appId, load]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  function fail(err: unknown, fallback: string) {
    setSuccess("");
    setError(err instanceof Error ? err.message : fallback);
  }

  async function onSaveSettings(patch: Partial<MailSsoSettings>) {
    if (!appId || !data) return;
    setSavingSettings(true);
    const previous = data.settings;
    setData({ ...data, settings: { ...previous, ...patch } });
    try {
      const settings = await updateMailSsoSettings(appId, patch);
      setData((current) => (current ? { ...current, settings } : current));
      setError("");
    } catch (err) {
      setData((current) => (current ? { ...current, settings: previous } : current));
      fail(err, "Could not save settings.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function onProvision(input: MailSsoProvisionInput) {
    if (!appId) return null;
    try {
      const result = await provisionMailSso(appId, input);
      setError("");
      setSuccess(
        result.mailbox
          ? `Sign-in link sent to ${result.email} for ${result.mailbox.address}.`
          : `Sign-in link sent to ${result.email}.`,
      );
      await load(appId, { silent: true });
      return result;
    } catch (err) {
      fail(err, "Could not add teammate.");
      return null;
    }
  }

  async function onBulk(rows: MailSsoProvisionInput[]) {
    if (!appId) return null;
    try {
      const result = await provisionMailSsoBulk(appId, rows);
      setError("");
      setSuccess(`${result.succeeded} link${result.succeeded === 1 ? "" : "s"} sent.`);
      await load(appId, { silent: true });
      return result;
    } catch (err) {
      fail(err, "Could not add teammates.");
      return null;
    }
  }

  async function onPersonAction(person: MailSsoPerson, action: MailSsoPersonAction) {
    if (!appId || busyKey) return;
    setBusyKey(person.key);
    try {
      if (action === "send") {
        await provisionMailSso(appId, {
          email: person.email,
          role: (person.role === "OWNER" ? "MEMBER" : person.role) as MailTeamRole,
        });
        setSuccess(`Sign-in link sent to ${person.email}.`);
      } else if (action === "resend" && person.link) {
        await resendMailSsoLink(appId, person.link.id, { deliver: true });
        setSuccess(`New link sent to ${person.email}.`);
      } else if (action === "copy" && person.link) {
        const link = await resendMailSsoLink(appId, person.link.id, { deliver: false });
        const copied = await copyToClipboard(link.url);
        setSuccess(
          copied
            ? "New link copied. The previous link no longer works."
            : `New link: ${link.url}`,
        );
      } else if (action === "revoke" && person.link) {
        await revokeMailSsoLink(appId, person.link.id);
        setSuccess("Link revoked.");
      }
      setError("");
      await load(appId, { silent: true });
    } catch (err) {
      fail(err, "Action failed.");
    } finally {
      setBusyKey(null);
    }
  }

  const canManage = Boolean(data?.canManage);
  const linksOff = Boolean(data && !data.settings.quickLinkEnabled);
  const seatsFull = Boolean(
    data && data.consoleMembersUsed >= data.consoleMembersIncluded,
  );

  return (
    <section
      className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6"
      dir="ltr"
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          SSO
        </h1>
        <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
          Add teammates, hand out mailboxes and let them sign in with one click.
          Roles and removals stay on{" "}
          <Link
            href={withMailSlot("/team", slot)}
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            Team
          </Link>
          .
        </p>
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

      {loading || !data ? (
        <div className="space-y-4">
          {[0, 1, 2].map((key) => (
            <div key={key} className="space-y-3 rounded-2xl bg-[var(--surface)] p-5 md:p-6">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {!canManage ? (
            <MailNotice
              status="default"
              title="View only"
              description="Only the owner or an admin can change SSO and send sign-in links."
            />
          ) : null}

          <MailSsoSettingsCard
            settings={data.settings}
            canManage={canManage}
            saving={savingSettings}
            onSave={onSaveSettings}
          />

          {canManage ? (
            <>
              {linksOff ? (
                <MailNotice
                  status="warning"
                  title="Quick sign-in is off"
                  description="Turn on quick sign-in links above to add teammates from here."
                />
              ) : seatsFull ? (
                <MailNotice
                  status="warning"
                  title="All console seats in use"
                  description={`This plan includes ${data.consoleMembersIncluded} seats. Existing teammates can still get links; new people need a free seat.`}
                />
              ) : null}

              <MailSsoAddCard
                mailboxes={data.mailboxes}
                primaryDomain={data.workspace.primaryDomain}
                domainActive={data.workspace.domainActive}
                disabled={linksOff}
                onSubmit={onProvision}
              />
              <MailSsoBulkCard
                mailboxes={data.mailboxes}
                primaryDomain={data.workspace.primaryDomain}
                domainActive={data.workspace.domainActive}
                disabled={linksOff}
                onSubmit={onBulk}
              />
            </>
          ) : null}

          <MailSsoPeopleCard
            people={data.people}
            canManage={canManage && !linksOff}
            busyKey={busyKey}
            onAction={(person, action) => void onPersonAction(person, action)}
          />

          {appId ? (
            <MailSsoEnterpriseCard
              appId={appId}
              summary={data.identityProvider}
              canManage={canManage}
              isOwner={data.isOwner}
              primaryDomain={data.workspace.primaryDomain}
              domainActive={data.workspace.domainActive}
              onChanged={() => void load(appId, { silent: true })}
            />
          ) : null}

          {canManage && auditEvents.length ? (
            <section className="rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
              <h2 className="text-[15px] font-semibold text-[var(--foreground)]">Security activity</h2>
              <div className="mt-3 divide-y divide-[var(--border)]">
                {auditEvents.slice(0, 8).map((event) => (
                  <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[12px]">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{event.action}</p>
                      <p className="text-[var(--muted-foreground)]">{event.actor?.email || "System"}</p>
                    </div>
                    <time dateTime={event.createdAt} className="text-[var(--muted-foreground)]">
                      {new Date(event.createdAt).toLocaleString()}
                    </time>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}
