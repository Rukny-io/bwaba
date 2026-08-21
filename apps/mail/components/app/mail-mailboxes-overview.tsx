"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Inbox, MoreVertical, Plus } from "lucide-react";
import { Checkbox, cn, Dropdown, Input, Label, TextField } from "@heroui/react";
import type { MailDomainSetup } from "@/lib/mail-domain";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import {
  changeMailMailboxPassword,
  createMailMailbox,
  deleteMailMailbox,
  listMailMailboxes,
  setMailMailbox2fa,
  type MailMailboxView,
} from "@/lib/mail-mailboxes-client";
import {
  fetchMailSubscription,
  type MailSubscriptionView,
} from "@/lib/mail-subscription-client";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-CA");
}

function planDisplayName(subscription: MailSubscriptionView | null) {
  if (!subscription) return "No active plan";
  const base = (subscription.planName || subscription.planId || "").trim();
  if (!base) return "No active plan";
  if (/business email/i.test(base)) return base;
  return `${base} Business Email`;
}

export function MailMailboxesOverview({ setup }: { setup: MailDomainSetup }) {
  const router = useRouter();
  const pathname = usePathname();
  const slot = parseMailSlot(pathname);
  const href = (path: string) => withMailSlot(path, slot);

  const [appId, setAppId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<MailSubscriptionView | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [limitsOpen, setLimitsOpen] = useState(false);

  const [mailboxes, setMailboxes] = useState<MailMailboxView[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [localPart, setLocalPart] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [enable2fa, setEnable2fa] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<MailMailboxView | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const refreshMailboxes = useCallback(async (id: string) => {
    const list = await listMailMailboxes(id);
    setMailboxes(list);
  }, []);

  useEffect(() => {
    const id = readMailAppIdFromDocument();
    setAppId(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const current = await fetchMailSubscription();
        if (!cancelled) setSubscription(current?.status === "ACTIVE" ? current : null);
      } catch {
        if (!cancelled) setSubscription(null);
      } finally {
        if (!cancelled) setLoadingSub(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!appId) {
      setLoadingBoxes(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingBoxes(true);
      try {
        await refreshMailboxes(appId);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load mailboxes.");
        }
      } finally {
        if (!cancelled) setLoadingBoxes(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appId, refreshMailboxes]);

  const limits = subscription?.limits;
  const seatLimit = subscription?.mailboxCount ?? 0;
  const activeCount = mailboxes.filter((m) => m.status === "ACTIVE").length;
  const seatsLeft = Math.max(0, seatLimit - activeCount);
  const storageGb = limits?.storageGbPerMailbox ?? 0;
  const canCreate = Boolean(appId && subscription && activeCount < seatLimit);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!appId || creating) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      await createMailMailbox(appId, {
        localPart: localPart.trim(),
        password,
        enable2fa,
      });
      setLocalPart("");
      setPassword("");
      setPasswordConfirm("");
      setEnable2fa(false);
      setCreateOpen(false);
      await refreshMailboxes(appId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create mailbox.");
    } finally {
      setCreating(false);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!appId || !passwordModal || savingPassword) return;
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSavingPassword(true);
    setError("");
    try {
      await changeMailMailboxPassword(appId, passwordModal.id, newPassword);
      setPasswordModal(null);
      setNewPassword("");
      await refreshMailboxes(appId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function onToggle2fa(box: MailMailboxView) {
    if (!appId) return;
    setError("");
    try {
      await setMailMailbox2fa(appId, box.id, !box.totpEnabled);
      await refreshMailboxes(appId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update 2FA.");
    }
  }

  async function onDelete(mailboxId: string) {
    if (!appId || deletingId) return;
    if (!window.confirm("Delete this mailbox?")) return;
    setDeletingId(mailboxId);
    setError("");
    try {
      await deleteMailMailbox(appId, mailboxId);
      await refreshMailboxes(appId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete mailbox.");
    } finally {
      setDeletingId(null);
    }
  }

  function onMailboxAction(box: MailMailboxView, key: React.Key) {
    const action = String(key);
    switch (action) {
      case "password":
        setError("");
        setNewPassword("");
        setPasswordModal(box);
        break;
      case "app-passwords":
        setError("App passwords are coming soon.");
        break;
      case "settings":
        router.push(href("/settings"));
        break;
      case "forwarders":
        router.push(href("/forwarders"));
        break;
      case "alias":
        router.push(href("/aliases"));
        break;
      case "auto-reply":
        router.push(href("/auto-reply"));
        break;
      case "catch-all":
        router.push(href("/catch-all"));
        break;
      case "2fa":
        void onToggle2fa(box);
        break;
      case "delete":
        void onDelete(box.id);
        break;
      default:
        break;
    }
  }

  return (
    <section className="dashboard-page mx-auto flex w-full max-w-[890px] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Mailboxes
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/apps"
            className="inline-flex h-9 items-center rounded-full px-3 text-[13px] font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[rgba(15,23,42,0.06)] hover:text-[var(--foreground)]"
          >
            Switch app
          </Link>
          <button
            type="button"
            onClick={() => router.push(href("/inbox"))}
            className="inline-flex h-9 items-center rounded-full bg-[var(--foreground)] px-4 text-[13px] font-semibold text-[var(--background)]"
          >
            Open Mail
          </button>
        </div>
      </div>

      <div
        role="region"
        aria-label="Email plan"
        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)]"
        style={{ padding: "16px 24px" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[17px] font-semibold leading-snug text-[var(--foreground)]">
              {setup.domain}
            </h2>
            <div className="mt-2 space-y-0.5 text-[14px] leading-relaxed">
              <p className="text-[var(--muted-foreground)]">
                Expires at:{" "}
                <span className="text-[var(--foreground)]">
                  {loadingSub ? "…" : formatDate(subscription?.renewsAt)}
                </span>
              </p>
              <p className="text-[var(--muted-foreground)]">
                Email plan:{" "}
                <span className="text-[var(--foreground)]">
                  {loadingSub ? "…" : planDisplayName(subscription)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setLimitsOpen((open) => !open)}
              className="inline-flex items-center gap-1 text-[14px] font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
              aria-expanded={limitsOpen}
            >
              View limits
              <ChevronDown
                className={cn("size-4 transition-transform", limitsOpen && "rotate-180")}
                aria-hidden
              />
            </button>
            <Link
              href="/pricing"
              className="inline-flex h-9 items-center rounded-lg bg-[var(--foreground)] px-4 text-[13px] font-semibold text-[var(--background)]"
            >
              Upgrade
            </Link>
          </div>
        </div>

        {limitsOpen ? (
          <div className="mt-4 border-t border-[var(--separator)] pt-4">
            {!limits ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {loadingSub
                  ? "Loading plan limits…"
                  : "Activate a plan to see mailbox limits."}
              </p>
            ) : (
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--muted-foreground)]">Mailboxes</dt>
                  <dd className="font-medium text-[var(--foreground)]">
                    {activeCount} / {seatLimit || limits.mailboxesIncluded}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--muted-foreground)]">Storage / mailbox</dt>
                  <dd className="font-medium text-[var(--foreground)]">
                    {limits.storageGbPerMailbox} GB
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--muted-foreground)]">Forwarding rules</dt>
                  <dd className="font-medium text-[var(--foreground)]">
                    {limits.forwardingRules}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--muted-foreground)]">Email aliases</dt>
                  <dd className="font-medium text-[var(--foreground)]">
                    {limits.emailAliases}
                  </dd>
                </div>
              </dl>
            )}
            <p className="mt-3 text-xs text-[var(--muted-foreground)]">
              Domain DNS settings live on{" "}
              <Link
                href={href("/domain")}
                className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
              >
                Domain settings
              </Link>
              .
            </p>
          </div>
        ) : null}
      </div>

      {/* Hostinger-style manage mailboxes card */}
      <section
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)]"
        aria-label="Manage mailboxes"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--separator)] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Manage mailboxes
            </h2>
            <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
              Mailboxes left:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {loadingSub || loadingBoxes
                  ? "…"
                  : `${Math.max(0, seatsLeft)}/${seatLimit || "—"}`}
              </span>
              {" · "}
              <Link
                href="/pricing"
                className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
              >
                Buy more mailboxes
              </Link>
            </p>
          </div>
          <button
            type="button"
            disabled={!canCreate}
            title={
              !subscription
                ? "Activate a plan first"
                : !canCreate
                  ? "Mailbox limit reached — upgrade or add seats"
                  : undefined
            }
            onClick={() => {
              setError("");
              setCreateOpen(true);
            }}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-semibold",
              canCreate
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "cursor-not-allowed border border-[var(--border)] text-[var(--muted-foreground)] opacity-70",
            )}
          >
            <Plus className="size-3.5" aria-hidden />
            Create mailbox
          </button>
        </div>

        {error ? (
          <p className="border-b border-[var(--separator)] px-5 py-3 text-sm text-[var(--danger)] sm:px-6" role="alert">
            {error}
          </p>
        ) : null}

        {createOpen ? (
          <form
            onSubmit={(e) => void onCreate(e)}
            className="border-b border-[var(--separator)] px-5 py-4 sm:px-6"
          >
            <p className="text-sm font-medium text-[var(--foreground)]">New mailbox</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Address will be{" "}
              <span className="font-medium text-[var(--foreground)]">
                {localPart.trim() || "name"}@{setup.domain}
              </span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={localPart}
                onChange={(e) => setLocalPart(e.target.value.toLowerCase())}
                placeholder="info"
                autoComplete="off"
                required
                pattern="[a-z0-9]([a-z0-9._-]*[a-z0-9])?"
                className="min-w-[10rem] flex-1 rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />
              <span className="text-sm text-[var(--muted-foreground)]">@{setup.domain}</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <TextField isRequired className="gap-1.5">
                <Label className="text-xs font-medium text-[var(--muted-foreground)]">
                  Password
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="Min. 8 characters"
                />
              </TextField>
              <TextField isRequired className="gap-1.5">
                <Label className="text-xs font-medium text-[var(--muted-foreground)]">
                  Confirm password
                </Label>
                <Input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                />
              </TextField>
            </div>
            <Checkbox
              id="mailbox-enable-2fa"
              className="mt-3"
              isSelected={enable2fa}
              onChange={setEnable2fa}
            >
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <Label htmlFor="mailbox-enable-2fa" className="text-sm text-[var(--foreground)]">
                  Enable two-factor authentication (optional)
                </Label>
              </Checkbox.Content>
            </Checkbox>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={creating || !localPart.trim() || password.length < 8}
                className="inline-flex h-9 items-center rounded-lg bg-[var(--foreground)] px-4 text-[13px] font-semibold text-[var(--background)] disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  setError("");
                  setPassword("");
                  setPasswordConfirm("");
                  setEnable2fa(false);
                }}
                className="inline-flex h-9 items-center rounded-lg px-4 text-[13px] font-medium text-[var(--muted-foreground)] hover:bg-[rgba(15,23,42,0.06)]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {loadingBoxes ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--muted-foreground)] sm:px-6">
            Loading mailboxes…
          </div>
        ) : mailboxes.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
              <Inbox className="size-5" aria-hidden />
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--foreground)]">No mailboxes yet</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Create your first address on{" "}
              <span className="font-medium text-[var(--foreground)]">{setup.domain}</span>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--separator)] text-[12px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-5 py-3 font-medium sm:px-6">Mailbox</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Usage</th>
                  <th className="px-5 py-3 text-right font-medium sm:px-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {mailboxes.map((box) => {
                  const isActive = box.status === "ACTIVE";
                  return (
                    <tr
                      key={box.id}
                      className="border-b border-[var(--separator)] last:border-b-0"
                    >
                      <td className="px-5 py-4 align-middle sm:px-6">
                        <p className="font-semibold text-[var(--foreground)]">{box.address}</p>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                          {box.hasPassword ? "Password set" : "No password"}
                          {box.totpEnabled ? " · 2FA on" : ""}
                          {" · aliases coming soon"}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--foreground)]">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              isActive ? "bg-[var(--success)]" : "bg-[var(--muted-foreground)]",
                            )}
                            aria-hidden
                          />
                          {isActive ? "Active" : box.status === "DISABLED" ? "Disabled" : box.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <div className="min-w-[140px] max-w-[200px]">
                          <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                            <div
                              className="h-full rounded-full bg-[var(--primary)]"
                              style={{ width: "0%" }}
                            />
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            <span className="font-medium text-[var(--foreground)]">0% Used</span>
                            {" · "}
                            0 MB / {storageGb.toFixed(0)}.00 GB
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle sm:px-6">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(href("/inbox"))}
                            className="inline-flex h-8 items-center rounded-lg border border-[var(--border)] px-3 text-[12px] font-semibold text-[var(--foreground)] hover:bg-[rgba(15,23,42,0.04)]"
                          >
                            Webmail
                          </button>
                          <Dropdown>
                            <Dropdown.Trigger
                              aria-label={`Actions for ${box.address}`}
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] outline-none hover:bg-[rgba(15,23,42,0.04)] hover:text-[var(--foreground)]"
                            >
                              <MoreVertical className="size-4" />
                            </Dropdown.Trigger>
                            <Dropdown.Popover
                              placement="bottom end"
                              className="min-w-[12.5rem] overflow-hidden rounded-2xl"
                            >
                              <Dropdown.Menu onAction={(key) => onMailboxAction(box, key)}>
                                <Dropdown.Item id="password" textValue="Change Password">
                                  Change Password
                                </Dropdown.Item>
                                <Dropdown.Item id="app-passwords" textValue="App passwords">
                                  App passwords
                                </Dropdown.Item>
                                <Dropdown.Item id="settings" textValue="Settings">
                                  Settings
                                </Dropdown.Item>
                                <Dropdown.Item id="forwarders" textValue="Create Forwarders">
                                  Create Forwarders
                                </Dropdown.Item>
                                <Dropdown.Item id="alias" textValue="Create Alias">
                                  Create Alias
                                </Dropdown.Item>
                                <Dropdown.Item id="auto-reply" textValue="Create Automatic Reply">
                                  Create Automatic Reply
                                </Dropdown.Item>
                                <Dropdown.Item id="catch-all" textValue="Create Catch-All">
                                  Create Catch-All
                                </Dropdown.Item>
                                <Dropdown.Item
                                  id="2fa"
                                  textValue={box.totpEnabled ? "Disable 2FA" : "Enable 2FA"}
                                >
                                  {box.totpEnabled ? "Disable 2FA" : "Enable 2FA"}
                                </Dropdown.Item>
                                <Dropdown.Item
                                  id="delete"
                                  textValue="Delete"
                                  variant="danger"
                                  isDisabled={deletingId === box.id}
                                >
                                  {deletingId === box.id ? "Deleting…" : "Delete"}
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown.Popover>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {passwordModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={(e) => void onChangePassword(e)}
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow-hover)]"
          >
            <h3 className="text-base font-semibold text-[var(--foreground)]">
              Change Password
            </h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {passwordModal.address}
            </p>
            <TextField isRequired className="mt-4 gap-1.5">
              <Label className="text-xs font-medium text-[var(--muted-foreground)]">
                New password
              </Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
              />
            </TextField>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={savingPassword || newPassword.length < 8}
                className="inline-flex h-9 items-center rounded-lg bg-[var(--foreground)] px-4 text-[13px] font-semibold text-[var(--background)] disabled:opacity-50"
              >
                {savingPassword ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordModal(null);
                  setNewPassword("");
                }}
                className="inline-flex h-9 items-center rounded-lg px-4 text-[13px] font-medium text-[var(--muted-foreground)] hover:bg-[rgba(15,23,42,0.06)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
