"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, Copy, Smartphone } from "lucide-react";
import {
  Alert,
  Button,
  Chip,
  Description,
  Dropdown,
  EmptyState,
  InputGroup,
  Label,
  Skeleton,
  TextField,
} from "@heroui/react";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { getMailApp } from "@/lib/mail-apps-client";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import {
  listMailMailboxes,
  type MailMailboxView,
} from "@/lib/mail-mailboxes-client";

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
    steps: "Add Account → Other Mail Account. Use IMAP, the host below, and the mailbox password.",
  },
  {
    name: "Outlook",
    steps: "Add account → IMAP. Incoming 993 SSL, outgoing 587 STARTTLS, username is the full address.",
  },
  {
    name: "Gmail app",
    steps: "Add account → Other. Choose IMAP and paste the same host, username, and mailbox password.",
  },
  {
    name: "Android",
    steps: "Add account → Personal (IMAP). Encryption on for both incoming and outgoing.",
  },
] as const;

export function MailDevicesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const slot = parseMailSlot(pathname);
  const href = (path: string) => withMailSlot(path, slot);

  const [appId, setAppId] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [mailboxes, setMailboxes] = useState<MailMailboxView[]>([]);
  const [mailboxId, setMailboxId] = useState("");
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
      const [app, boxes] = await Promise.all([getMailApp(id), listMailMailboxes(id)]);
      const active = boxes.filter((box) => box.status === "ACTIVE");
      setDomain(app.primaryDomain);
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

  useEffect(() => {
    if (!appId) return;
    void load(appId);
  }, [appId, load]);

  const mailbox = mailboxes.find((box) => box.id === mailboxId) ?? null;
  const host = domain ? `mail.${domain}` : "";
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

  return (
    <section className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Connect apps & devices
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            IMAP and SMTP settings for Outlook, Apple Mail, Gmail, and phones.
          </p>
        </div>
        <Chip color="warning" size="sm" variant="soft">
          Preview
        </Chip>
      </div>

      <Alert status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Not live yet</Alert.Title>
          <Alert.Description>
            These hosts are not accepting connections. Mail still works in the Rukny Inbox.
            Use this page to review the setup before launch.
          </Alert.Description>
        </Alert.Content>
      </Alert>

      {error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Connect apps & devices</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
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
            Device setup uses an active mailbox address and password.
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
                Sign in with this address and the mailbox password from Mailboxes.
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
              value={host}
              description="Incoming · port 993 · SSL/TLS"
              copied={copied === "imap"}
              onCopy={() => void copy("imap", host)}
            />
            <CopyField
              label="SMTP host"
              value={host}
              description="Outgoing · port 587 · STARTTLS"
              copied={copied === "smtp"}
              onCopy={() => void copy("smtp", host)}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-3 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                App passwords
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Dedicated passwords for third-party apps are not available yet. Use the
                mailbox password for now.
              </p>
            </div>
            <Chip size="sm" variant="soft">
              Coming soon
            </Chip>
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
