"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, Copy, Smartphone, Trash2 } from "lucide-react";
import {
  Button,
  Description,
  Dropdown,
  EmptyState,
  Input,
  InputGroup,
  Label,
  Skeleton,
  TextField,
} from "@heroui/react";
import { MailNotice } from "@/components/app/mail-notice";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import {
  createMailAppPassword,
  listMailAppPasswords,
  revokeMailAppPassword,
  type CreatedMailAppPassword,
  type MailAppPasswordView,
} from "@/lib/mail-app-passwords-client";
import { getMailApp } from "@/lib/mail-apps-client";
import {
  listMailMailboxes,
  type MailMailboxView,
} from "@/lib/mail-mailboxes-client";
import { MAILBOX_IMAP_HOST, MAILBOX_SMTP_HOST } from "@/lib/mail-smtp-config";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";

function MailboxDropdown({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const selectedLabel =
    options.find((option) => option.id === value)?.label ?? "Select mailbox";

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="Mailbox"
        isDisabled={disabled}
        className="inline-flex h-9 w-full min-w-0 items-center justify-between gap-1.5 rounded-xl bg-[var(--field-background)] px-3 text-start text-sm font-medium text-[var(--foreground)] outline-none"
      >
        <span className="min-w-0 truncate" dir="ltr">
          {selectedLabel}
        </span>
        <ChevronDown className="size-4 shrink-0 text-[var(--muted-foreground)]" />
      </Dropdown.Trigger>
      <Dropdown.Popover
        placement="bottom start"
        className="min-w-[16rem] overflow-hidden rounded-2xl"
      >
        <Dropdown.Menu
          selectedKeys={value ? new Set([value]) : new Set()}
          selectionMode="single"
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const next = [...keys][0];
            if (next == null) return;
            onChange(String(next));
          }}
        >
          <Dropdown.Section>
            {options.map((option) => (
              <Dropdown.Item key={option.id} id={option.id} textValue={option.label}>
                <Dropdown.ItemIndicator />
                <Label>{option.label}</Label>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

function CopyField({
  label,
  value,
  description,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  description?: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <TextField isReadOnly fullWidth className="gap-1.5" value={value}>
      <Label className="text-sm font-medium text-[var(--foreground)]">{label}</Label>
      <InputGroup fullWidth>
        <InputGroup.Input dir="ltr" />
        <InputGroup.Suffix className="pr-0">
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Copy ${label}`}
            onPress={onCopy}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
      {description ? <Description>{description}</Description> : null}
    </TextField>
  );
}

const CLIENTS = [
  {
    name: "Apple Mail",
    steps:
      "Add Account → Other Mail Account. Use the hosts below, your full email as username, and an app password.",
  },
  {
    name: "Outlook",
    steps:
      "Add account → IMAP. Incoming 993 SSL, outgoing 587 STARTTLS. Username is the full address; password is an app password.",
  },
  {
    name: "Gmail app",
    steps:
      "Add account → Other. Choose IMAP, paste the hosts below, and sign in with an app password.",
  },
  {
    name: "Android",
    steps:
      "Add account → Personal (IMAP). Turn on encryption for incoming and outgoing mail.",
  },
] as const;

export function MailDevicesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const slot = parseMailSlot(pathname);
  const href = (path: string) => withMailSlot(path, slot);

  const [appId, setAppId] = useState<string | null>(null);
  const [mailboxes, setMailboxes] = useState<MailMailboxView[]>([]);
  const [mailboxId, setMailboxId] = useState("");
  const [appPasswords, setAppPasswords] = useState<MailAppPasswordView[]>([]);
  const [passwordLabel, setPasswordLabel] = useState("");
  const [createdPassword, setCreatedPassword] = useState<CreatedMailAppPassword | null>(null);
  const [passwordsLoading, setPasswordsLoading] = useState(false);
  const [creatingPassword, setCreatingPassword] = useState(false);
  const [copied, setCopied] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      const boxes = await listMailMailboxes(id);
      const active = boxes.filter((box) => box.status === "ACTIVE");
      setMailboxes(active);
      setMailboxId((current) => {
        if (current && active.some((box) => box.id === current)) return current;
        return active[0]?.id || "";
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load device settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPasswords = useCallback(async (id: string, selectedMailboxId: string) => {
    if (!selectedMailboxId) {
      setAppPasswords([]);
      return;
    }
    setPasswordsLoading(true);
    try {
      const passwords = await listMailAppPasswords(id, selectedMailboxId);
      setAppPasswords(passwords);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load app passwords.");
    } finally {
      setPasswordsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!appId) return;
    void load(appId);
  }, [appId, load]);

  useEffect(() => {
    if (!appId || !mailboxId) return;
    setCreatedPassword(null);
    void loadPasswords(appId, mailboxId);
  }, [appId, mailboxId, loadPasswords]);

  const mailbox = mailboxes.find((box) => box.id === mailboxId) ?? null;
  const username = mailbox?.address || "";

  const mailboxOptions = useMemo(
    () => mailboxes.map((box) => ({ id: box.id, label: box.address })),
    [mailboxes],
  );

  async function copy(key: string, value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => {
        setCopied((current) => (current === key ? "" : current));
      }, 1600);
    } catch {
      setError("Could not copy. Copy the value manually.");
    }
  }

  async function handleCreatePassword() {
    if (!appId || !mailboxId || !passwordLabel.trim()) return;
    setCreatingPassword(true);
    try {
      const password = await createMailAppPassword(
        appId,
        mailboxId,
        passwordLabel.trim(),
      );
      setCreatedPassword(password);
      setPasswordLabel("");
      await loadPasswords(appId, mailboxId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create app password.");
    } finally {
      setCreatingPassword(false);
    }
  }

  async function handleRevokePassword(passwordId: string) {
    if (!appId || !mailboxId) return;
    try {
      await revokeMailAppPassword(appId, mailboxId, passwordId);
      if (createdPassword?.id === passwordId) setCreatedPassword(null);
      await loadPasswords(appId, mailboxId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke app password.");
    }
  }

  return (
    <section className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Connect apps & devices
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            SMTP is live for sending from Outlook, Apple Mail, and phones. IMAP incoming sync
            is coming soon.
          </p>
        </div>
      </div>

      {error ? (
        <MailNotice
          status="danger"
          title="Something went wrong"
          description={error}
          onDismiss={() => setError("")}
        />
      ) : null}

      {loading ? (
        <div className="space-y-2 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : mailboxes.length === 0 ? (
        <EmptyState className="rounded-2xl bg-[var(--surface)] px-5 py-12">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <Smartphone className="size-5" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
            Create a mailbox first
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Device setup uses an active mailbox address and an app password.
          </p>
          <Button size="sm" className="mt-4" onPress={() => router.push(href("/app"))}>
            Go to mailboxes
          </Button>
        </EmptyState>
      ) : (
        <>
          <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div className="min-w-0">
              <Label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                Mailbox
              </Label>
              <MailboxDropdown
                value={mailboxId}
                options={mailboxOptions}
                onChange={setMailboxId}
              />
              <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                Use your full email address as the username and an app password below.
              </p>
            </div>

            <CopyField
              label="Username"
              value={username}
              copied={copied === "user"}
              onCopy={() => void copy("user", username)}
            />
            <CopyField
              label="IMAP host"
              value={MAILBOX_IMAP_HOST}
              description="Incoming · port 993 · SSL/TLS (coming soon)"
              copied={copied === "imap"}
              onCopy={() => void copy("imap", MAILBOX_IMAP_HOST)}
            />
            <CopyField
              label="SMTP host"
              value={MAILBOX_SMTP_HOST}
              description="Outgoing · port 587 · STARTTLS (or 465 SMTPS)"
              copied={copied === "smtp"}
              onCopy={() => void copy("smtp", MAILBOX_SMTP_HOST)}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-4 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                App passwords
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Create a dedicated password for each device or app. App passwords work even
                when mailbox 2FA is enabled.
              </p>
            </div>

            {createdPassword ? (
              <MailNotice
                status="success"
                title="App password created"
                description="Copy it now — you will not be able to see it again."
              />
            ) : null}

            {createdPassword ? (
              <CopyField
                label={createdPassword.label}
                value={createdPassword.secret}
                copied={copied === "new-password"}
                onCopy={() => void copy("new-password", createdPassword.secret)}
              />
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <TextField
                fullWidth
                className="flex-1 gap-1.5"
                value={passwordLabel}
                onChange={(event) => setPasswordLabel(event.target.value)}
              >
                <Label className="text-sm font-medium text-[var(--foreground)]">
                  Label
                </Label>
                <Input placeholder="Outlook on Mac" />
              </TextField>
              <Button
                className="shrink-0"
                isDisabled={!passwordLabel.trim() || creatingPassword}
                onPress={() => void handleCreatePassword()}
              >
                {creatingPassword ? "Creating…" : "Create password"}
              </Button>
            </div>

            {passwordsLoading ? (
              <Skeleton className="h-16 w-full rounded-xl" />
            ) : appPasswords.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                No active app passwords yet.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
                {appPasswords.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {row.label}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Created {new Date(row.createdAt).toLocaleDateString()}
                        {row.lastUsedAt
                          ? ` · Last used ${new Date(row.lastUsedAt).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label={`Revoke ${row.label}`}
                      onPress={() => void handleRevokePassword(row.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            {CLIENTS.map((client) => (
              <div
                key={client.name}
                className="rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5"
              >
                <p className="text-sm font-medium text-[var(--foreground)]">{client.name}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{client.steps}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
