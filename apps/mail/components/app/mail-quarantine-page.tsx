"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ShieldAlert } from "lucide-react";
import {
  Button,
  Checkbox,
  Chip,
  Dropdown,
  EmptyState,
  Label,
  Skeleton,
} from "@heroui/react";
import { MailNotice } from "@/components/app/mail-notice";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import {
  listMailMailboxes,
  type MailMailboxView,
} from "@/lib/mail-mailboxes-client";
import {
  bulkQuarantineAction,
  deleteQuarantineMessage,
  listMailQuarantine,
  releaseQuarantineMessage,
  spamQuarantineMessage,
  type MailQuarantineMessageView,
} from "@/lib/mail-quarantine-client";

const PAGE_SIZE = 20;

function reasonLabel(reason: string | null) {
  if (!reason) return "Suspicious";
  if (reason === "ses_gray") return "Gray SES verdict";
  if (reason === "partial_auth") return "Partial authentication failure";
  if (reason.startsWith("allowlist:")) return "Allowlist override";
  if (reason.startsWith("blocklist:")) return "Blocklist rule";
  if (reason.startsWith("filter:")) return "Filter rule";
  if (reason === "dmarc_none_partial_auth") return "DMARC missing + partial auth";
  return reason;
}

function formatExpiry(iso: string | null) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

function MailboxFilter({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? "All mailboxes";

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="Mailbox filter"
        className="inline-flex h-8 min-w-[10rem] items-center justify-between gap-1.5 rounded-lg bg-[var(--surface-secondary)] px-2.5 text-start text-xs font-medium text-[var(--foreground)] outline-none"
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <ChevronDown className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start" className="min-w-[12rem] overflow-hidden rounded-2xl">
        <Dropdown.Menu
          selectedKeys={new Set([value || "__all__"])}
          selectionMode="single"
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const next = [...keys][0];
            if (next == null) return;
            const id = String(next);
            onChange(id === "__all__" ? "" : id);
          }}
        >
          <Dropdown.Section>
            {options.map((option) => {
              const id = option.value || "__all__";
              return (
                <Dropdown.Item key={id} id={id} textValue={option.label}>
                  <Dropdown.ItemIndicator />
                  <Label>{option.label}</Label>
                </Dropdown.Item>
              );
            })}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export function MailQuarantinePage() {
  const [appId, setAppId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MailQuarantineMessageView[]>([]);
  const [mailboxes, setMailboxes] = useState<MailMailboxView[]>([]);
  const [total, setTotal] = useState(0);
  const [mailboxId, setMailboxId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = readMailAppIdFromDocument();
    if (!id) {
      window.location.assign("/apps?error=app_required");
      return;
    }
    setAppId(id);
  }, []);

  const load = useCallback(async (id: string, filterMailboxId: string) => {
    setLoading(true);
    try {
      const [result, boxes] = await Promise.all([
        listMailQuarantine(id, {
          take: PAGE_SIZE,
          mailboxId: filterMailboxId || undefined,
        }),
        listMailMailboxes(id),
      ]);
      setMessages(result.messages);
      setTotal(result.total);
      setMailboxes(boxes.filter((box) => box.status === "ACTIVE"));
      setSelected(new Set());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load quarantine.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!appId) return;
    void load(appId, mailboxId);
  }, [appId, mailboxId, load]);

  const mailboxOptions = useMemo(
    () => [
      { value: "", label: "All mailboxes" },
      ...mailboxes.map((box) => ({ value: box.id, label: box.address })),
    ],
    [mailboxes],
  );

  const allSelected =
    messages.length > 0 && messages.every((message) => selected.has(message.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(messages.map((message) => message.id)));
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runSingle(
    messageId: string,
    action: "release" | "spam" | "delete",
  ) {
    if (!appId) return;
    setBusy(true);
    try {
      if (action === "release") await releaseQuarantineMessage(appId, messageId);
      else if (action === "spam") await spamQuarantineMessage(appId, messageId);
      else await deleteQuarantineMessage(appId, messageId);
      setMessages((rows) => rows.filter((row) => row.id !== messageId));
      setTotal((count) => Math.max(0, count - 1));
      setSelected((current) => {
        const next = new Set(current);
        next.delete(messageId);
        return next;
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function runBulk(action: "release" | "spam" | "delete") {
    if (!appId || selected.size === 0) return;
    setBusy(true);
    try {
      await bulkQuarantineAction(appId, {
        messageIds: [...selected],
        action,
      });
      await load(appId, mailboxId);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Quarantine
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Review suspicious inbound mail before it reaches user inboxes.
          </p>
        </div>
        {loading ? null : (
          <Chip size="sm" variant="soft" color={total > 0 ? "warning" : "default"}>
            {total} held
          </Chip>
        )}
      </div>

      {error ? (
        <MailNotice
          status="danger"
          title="Something went wrong"
          description={error}
          onDismiss={() => setError("")}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <MailboxFilter
          value={mailboxId}
          options={mailboxOptions}
          onChange={setMailboxId}
        />
        {selected.size > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" isDisabled={busy} onPress={() => void runBulk("release")}>
              Release ({selected.size})
            </Button>
            <Button size="sm" variant="secondary" isDisabled={busy} onPress={() => void runBulk("spam")}>
              Spam ({selected.size})
            </Button>
            <Button size="sm" variant="ghost" isDisabled={busy} onPress={() => void runBulk("delete")}>
              Delete ({selected.size})
            </Button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-2 rounded-2xl bg-[var(--surface)] p-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ) : messages.length === 0 ? (
        <EmptyState className="rounded-2xl bg-[var(--surface)] px-5 py-12">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <ShieldAlert className="size-5" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-medium text-[var(--foreground)]">Quarantine is empty</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Suspicious messages will appear here for review.
          </p>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-[var(--surface)]">
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 md:px-5">
            <Checkbox isSelected={allSelected} onChange={toggleAll} aria-label="Select all" />
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Select all</span>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {messages.map((message) => (
              <li key={message.id} className="px-4 py-3 md:px-5">
                <div className="flex items-start gap-3">
                  <Checkbox
                    isSelected={selected.has(message.id)}
                    onChange={() => toggleOne(message.id)}
                    aria-label={`Select ${message.subject}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--foreground)]">
                        {message.subject || "(no subject)"}
                      </p>
                      <Chip size="sm" variant="soft">{reasonLabel(message.quarantineReason)}</Chip>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]" dir="ltr">
                      {message.fromAddress} → {message.mailboxAddress}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[var(--muted-foreground)]">
                      {formatExpiry(message.quarantineExpiresAt) ? (
                        <span>Expires {formatExpiry(message.quarantineExpiresAt)}</span>
                      ) : null}
                    </div>
                    {message.snippet ? (
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">
                        {message.snippet}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                    <Button size="sm" variant="secondary" isDisabled={busy} onPress={() => void runSingle(message.id, "release")}>
                      Release
                    </Button>
                    <Button size="sm" variant="ghost" isDisabled={busy} onPress={() => void runSingle(message.id, "spam")}>
                      Spam
                    </Button>
                    <Button size="sm" variant="ghost" isDisabled={busy} onPress={() => void runSingle(message.id, "delete")}>
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
