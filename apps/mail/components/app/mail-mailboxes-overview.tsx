"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Camera, ChevronDown, Inbox, MoreVertical, Plus } from "lucide-react";
import { Checkbox, cn, Dropdown, Input, Label, TextField } from "@heroui/react";
import type { MailDomainSetup } from "@/lib/mail-domain";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import {
  changeMailMailboxPassword,
  createMailMailbox,
  deleteMailMailbox,
  listMailMailboxes,
  removeMailMailboxAvatar,
  setMailMailbox2fa,
  uploadMailMailboxAvatar,
  type MailMailboxView,
} from "@/lib/mail-mailboxes-client";
import { MailPersonAvatar } from "@/components/inbox/mail-person-avatar";
import { formatMailStorageAmount } from "@/lib/mail-plans";
import {
  fetchMailSubscription,
  type MailPendingPlanRequest,
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

function MailboxUsageMeter({
  usedBytes,
  quotaBytes,
}: {
  usedBytes: number;
  quotaBytes: number;
}) {
  const pct =
    quotaBytes > 0 ? Math.min(100, Math.max(0, (usedBytes / quotaBytes) * 100)) : 0;
  return (
    <div className="min-w-0">
      <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
        <div
          className="h-full rounded-full bg-[var(--primary)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="truncate text-xs text-[var(--muted-foreground)]">
        <span className="font-medium text-[var(--foreground)]">
          {quotaBytes > 0 ? `${pct.toFixed(0)}% Used` : "No plan"}
        </span>
        {" · "}
        {formatMailStorageAmount(usedBytes)} /{" "}
        {quotaBytes > 0 ? formatMailStorageAmount(quotaBytes) : "—"}
      </p>
    </div>
  );
}

function MailboxStatusDot({ status }: { status: MailMailboxView["status"] }) {
  const isActive = status === "ACTIVE";
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--foreground)]">
      <span
        className={cn(
          "size-2 rounded-full",
          isActive ? "bg-[var(--success)]" : "bg-[var(--muted-foreground)]",
        )}
        aria-hidden
      />
      {isActive ? "Active" : status === "DISABLED" ? "Disabled" : status}
    </span>
  );
}

function MailboxActionMenu({
  box,
  deletingId,
  onAction,
}: {
  box: MailMailboxView;
  deletingId: string | null;
  onAction: (box: MailMailboxView, key: React.Key) => void;
}) {
  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={`Actions for ${box.address}`}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] outline-none hover:bg-[rgba(15,23,42,0.06)] hover:text-[var(--foreground)]"
      >
        <MoreVertical className="size-4" />
      </Dropdown.Trigger>
      <Dropdown.Popover
        placement="bottom end"
        className="min-w-[12.5rem] overflow-hidden rounded-2xl"
      >
        <Dropdown.Menu onAction={(key) => onAction(box, key)}>
          <Dropdown.Item id="photo" textValue="Change photo">
            Change photo
          </Dropdown.Item>
          {box.avatarUrl ? (
            <Dropdown.Item id="remove-photo" textValue="Remove photo">
              Remove photo
            </Dropdown.Item>
          ) : null}
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
  );
}

export function MailMailboxesOverview({ setup }: { setup: MailDomainSetup }) {
  const router = useRouter();
  const pathname = usePathname();
  const slot = parseMailSlot(pathname);
  const href = (path: string) => withMailSlot(path, slot);

  const [appId, setAppId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<MailSubscriptionView | null>(null);
  const [pendingRequest, setPendingRequest] = useState<MailPendingPlanRequest | null>(
    null,
  );
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
  const [avatarUploadingId, setAvatarUploadingId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarTargetIdRef = useRef<string | null>(null);

  const refreshMailboxes = useCallback(async (id: string) => {
    const list = await listMailMailboxes(id);
    setMailboxes(list);
  }, []);

  useEffect(() => {
    const id = readMailAppIdFromDocument();
    setAppId(id);
  }, []);

  useEffect(() => {
    if (!appId) {
      setLoadingSub(false);
      setSubscription(null);
      setPendingRequest(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const current = await fetchMailSubscription(appId);
        if (!cancelled) {
          setSubscription(current.subscription?.status === "ACTIVE" ? current.subscription : null);
          setPendingRequest(current.pendingRequest);
        }
      } catch {
        if (!cancelled) {
          setSubscription(null);
          setPendingRequest(null);
        }
      } finally {
        if (!cancelled) setLoadingSub(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appId]);

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
  const storageQuotaBytes = subscription?.storageQuotaBytesPerMailbox ?? 0;
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

  function pickAvatar(mailboxId: string) {
    avatarTargetIdRef.current = mailboxId;
    avatarInputRef.current?.click();
  }

  async function onAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const mailboxId = avatarTargetIdRef.current;
    e.target.value = "";
    if (!appId || !file || !mailboxId) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be 5MB or smaller.");
      return;
    }

    setAvatarUploadingId(mailboxId);
    setError("");
    try {
      await uploadMailMailboxAvatar(appId, mailboxId, file);
      await refreshMailboxes(appId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload photo.");
    } finally {
      setAvatarUploadingId(null);
      avatarTargetIdRef.current = null;
    }
  }

  async function onRemoveAvatar(mailboxId: string) {
    if (!appId || avatarUploadingId) return;
    setAvatarUploadingId(mailboxId);
    setError("");
    try {
      await removeMailMailboxAvatar(appId, mailboxId);
      await refreshMailboxes(appId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove photo.");
    } finally {
      setAvatarUploadingId(null);
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
      case "photo":
        pickAvatar(box.id);
        break;
      case "remove-photo":
        void onRemoveAvatar(box.id);
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

  const createButton = (
    <button
      type="button"
      disabled={!canCreate}
      title={
        !subscription
          ? pendingRequest
            ? "Plan request pending — wait for admin activation"
            : "Request a plan for this app first"
          : !canCreate
            ? "Mailbox limit reached — upgrade or add seats"
            : undefined
      }
      onClick={() => {
        setError("");
        setCreateOpen(true);
      }}
      className={cn(
        "inline-flex h-8 w-fit shrink-0 items-center justify-center gap-1 self-start rounded-lg px-2.5 text-[12px] font-semibold",
        canCreate
          ? "bg-[var(--foreground)] text-[var(--background)]"
          : "cursor-not-allowed bg-[var(--surface-secondary)] text-[var(--muted-foreground)] opacity-70",
      )}
    >
      <Plus className="size-3" aria-hidden />
      Create mailbox
    </button>
  );

  return (
    <section className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => void onAvatarFileChange(e)}
      />
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Mailboxes
        </h1>
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/apps"
            className="inline-flex h-10 min-w-0 flex-1 items-center justify-center rounded-full px-3 text-[13px] font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[rgba(15,23,42,0.06)] hover:text-[var(--foreground)] sm:h-9 sm:flex-none"
          >
            Switch app
          </Link>
          <button
            type="button"
            onClick={() => router.push(href("/inbox"))}
            className="inline-flex h-10 min-w-0 flex-1 items-center justify-center rounded-full bg-[var(--foreground)] px-4 text-[13px] font-semibold text-[var(--background)] sm:h-9 sm:flex-none"
          >
            Open Mail
          </button>
        </div>
      </div>

      <div
        role="region"
        aria-label="Email plan"
        className="min-w-0 rounded-2xl bg-[var(--surface)] p-4 sm:p-6"
      >
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              <p className="break-words text-[var(--muted-foreground)]">
                Email plan:{" "}
                <span className="text-[var(--foreground)]">
                  {loadingSub ? "…" : planDisplayName(subscription)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:shrink-0">
            <button
              type="button"
              onClick={() => setLimitsOpen((open) => !open)}
              className="inline-flex min-w-0 flex-1 items-center justify-center gap-1 text-[14px] font-medium text-[var(--foreground)] underline-offset-2 hover:underline sm:flex-none"
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
              className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-[var(--foreground)] px-4 text-[13px] font-semibold text-[var(--background)] sm:h-9 sm:flex-none sm:rounded-lg"
            >
              Upgrade
            </Link>
          </div>
        </div>

        {limitsOpen ? (
          <div className="mt-4 pt-4">
            {!limits ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {loadingSub
                  ? "Loading plan limits…"
                  : pendingRequest
                    ? `Plan request pending (${pendingRequest.ticketNumber}). An admin will activate this app.`
                    : "Request a plan for this app to see mailbox limits."}
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
                <div>
                  <dt className="text-[var(--muted-foreground)]">Automatic replies</dt>
                  <dd className="font-medium text-[var(--foreground)]">
                    {limits.automaticReplies ? "On" : "Off"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--muted-foreground)]">Open / link tracking</dt>
                  <dd className="font-medium text-[var(--foreground)]">
                    {limits.openTracking ? "Open" : "—"}
                    {limits.linkAndFileTracking ? " · links & files" : ""}
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

      {/* Hostinger-style manage mailboxes card on desktop; stacked cards on phone */}
      <section className="min-w-0 md:overflow-hidden md:rounded-2xl md:bg-[var(--surface)]" aria-label="Manage mailboxes">
        <div className="flex min-w-0 flex-col gap-3 rounded-2xl bg-[var(--surface)] p-4 md:flex-row md:items-center md:justify-between md:rounded-none md:bg-transparent md:p-0 md:px-6 md:py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Manage mailboxes
            </h2>
            <p className="mt-0.5 break-words text-sm text-[var(--muted-foreground)]">
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
          {createButton}
        </div>

        {error ? (
          <p className="px-1 py-3 text-sm text-[var(--danger)] md:px-6" role="alert">
            {error}
          </p>
        ) : null}

        {createOpen ? (
          <form
            onSubmit={(e) => void onCreate(e)}
            className="mt-3 min-w-0 rounded-2xl bg-[var(--surface)] p-4 md:mt-0 md:rounded-none md:px-6 md:py-4"
          >
            <p className="text-sm font-medium text-[var(--foreground)]">New mailbox</p>
            <p className="mt-1 break-all text-xs text-[var(--muted-foreground)]">
              Address will be{" "}
              <span className="font-medium text-[var(--foreground)]">
                {localPart.trim() || "name"}@{setup.domain}
              </span>
            </p>
            <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={localPart}
                onChange={(e) => setLocalPart(e.target.value.toLowerCase())}
                placeholder="info"
                autoComplete="off"
                required
                pattern="[a-z0-9]([a-z0-9._-]*[a-z0-9])?"
                className="min-w-0 w-full flex-1 rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />
              <span className="truncate text-sm text-[var(--muted-foreground)]">
                @{setup.domain}
              </span>
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
                className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-[var(--foreground)] px-4 text-[13px] font-semibold text-[var(--background)] disabled:opacity-50 sm:h-9 sm:flex-none sm:rounded-lg"
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
                className="inline-flex h-10 flex-1 items-center justify-center rounded-xl px-4 text-[13px] font-medium text-[var(--muted-foreground)] hover:bg-[rgba(15,23,42,0.06)] sm:h-9 sm:flex-none sm:rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {loadingBoxes ? (
          <div className="px-1 py-12 text-center text-sm text-[var(--muted-foreground)] md:px-6">
            Loading mailboxes…
          </div>
        ) : mailboxes.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-[var(--surface)] px-5 py-12 text-center md:mt-0 md:rounded-none md:px-6">
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
              <Inbox className="size-5" aria-hidden />
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--foreground)]">No mailboxes yet</p>
            <p className="mt-1 break-words text-sm text-[var(--muted-foreground)]">
              Create your first address on{" "}
              <span className="font-medium text-[var(--foreground)]">{setup.domain}</span>.
            </p>
          </div>
        ) : (
          <>
            <ul className="mt-3 flex flex-col gap-3 md:hidden">
              {mailboxes.map((box) => (
                <li
                  key={box.id}
                  className="min-w-0 rounded-2xl bg-[var(--surface)] p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <button
                      type="button"
                      onClick={() => pickAvatar(box.id)}
                      disabled={avatarUploadingId === box.id}
                      className="group relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                      aria-label={`Change photo for ${box.address}`}
                      title="Change photo"
                    >
                      <MailPersonAvatar
                        name={box.displayName || box.localPart}
                        email={box.address}
                        avatarUrl={box.avatarUrl}
                        className="size-11"
                      />
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Camera className="size-3.5 text-white" />
                      </span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[var(--foreground)]">
                        {box.address}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {box.hasPassword ? "Password set" : "No password"}
                        {box.totpEnabled ? " · 2FA on" : ""}
                        {avatarUploadingId === box.id ? " · Uploading…" : ""}
                      </p>
                    </div>
                    <MailboxActionMenu
                      box={box}
                      deletingId={deletingId}
                      onAction={onMailboxAction}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <MailboxStatusDot status={box.status} />
                  </div>
                  <div className="mt-3">
                    <MailboxUsageMeter
                      usedBytes={box.storageUsedBytes ?? 0}
                      quotaBytes={storageQuotaBytes}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(href("/inbox"))}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[13px] font-semibold text-[var(--foreground)]"
                  >
                    Webmail
                  </button>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="text-[12px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    <th className="px-5 py-3 font-medium sm:px-6">Mailbox</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Usage</th>
                    <th className="px-5 py-3 text-right font-medium sm:px-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mailboxes.map((box) => (
                    <tr key={box.id}>
                      <td className="px-5 py-4 align-middle sm:px-6">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => pickAvatar(box.id)}
                            disabled={avatarUploadingId === box.id}
                            className="group relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                            aria-label={`Change photo for ${box.address}`}
                            title="Change photo"
                          >
                            <MailPersonAvatar
                              name={box.displayName || box.localPart}
                              email={box.address}
                              avatarUrl={box.avatarUrl}
                              className="size-11"
                            />
                            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <Camera className="size-3.5 text-white" />
                            </span>
                          </button>
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--foreground)]">{box.address}</p>
                            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                              {box.hasPassword ? "Password set" : "No password"}
                              {box.totpEnabled ? " · 2FA on" : ""}
                              {avatarUploadingId === box.id ? " · Uploading…" : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <MailboxStatusDot status={box.status} />
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <div className="min-w-[140px] max-w-[200px]">
                          <MailboxUsageMeter
                            usedBytes={box.storageUsedBytes ?? 0}
                            quotaBytes={storageQuotaBytes}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle sm:px-6">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(href("/inbox"))}
                            className="inline-flex h-8 items-center rounded-lg bg-[var(--surface-secondary)] px-3 text-[12px] font-semibold text-[var(--foreground)] hover:bg-[rgba(15,23,42,0.08)]"
                          >
                            Webmail
                          </button>
                          <MailboxActionMenu
                            box={box}
                            deletingId={deletingId}
                            onAction={onMailboxAction}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {passwordModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={(e) => void onChangePassword(e)}
            className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-5"
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
