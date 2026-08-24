"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ScrollText } from "lucide-react";
import {
  Alert,
  Button,
  Chip,
  Dropdown,
  EmptyState,
  Label,
  SearchField,
  Skeleton,
} from "@heroui/react";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import {
  listMailMailboxes,
  type MailMailboxView,
} from "@/lib/mail-mailboxes-client";
import {
  listMailLogs,
  type MailLogDays,
  type MailLogDirection,
  type MailLogEntry,
  type MailLogStatus,
} from "@/lib/mail-logs-client";

const TAKE = 40;
const ALL_KEY = "__all__";

type FilterOption = { value: string; label: string };

function LogsFilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly FilterOption[];
  onChange: (value: string) => void;
}) {
  const selectedKey = value || ALL_KEY;
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? options[0]?.label;

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={label}
        className="inline-flex h-8 w-full min-w-0 items-center justify-between gap-1.5 rounded-lg bg-[var(--surface-secondary)] px-2.5 text-start text-xs font-medium text-[var(--foreground)] outline-none"
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <ChevronDown className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />
      </Dropdown.Trigger>
      <Dropdown.Popover
        placement="bottom start"
        className="min-w-[12rem] overflow-hidden rounded-2xl"
      >
        <Dropdown.Menu
          selectedKeys={new Set([selectedKey])}
          selectionMode="single"
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const next = [...keys][0];
            if (next == null) return;
            const id = String(next);
            onChange(id === ALL_KEY ? "" : id);
          }}
        >
          <Dropdown.Section>
            {options.map((option) => {
              const id = option.value || ALL_KEY;
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

function formatLogWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function statusChipColor(
  status: MailLogStatus,
): "success" | "warning" | "danger" | "default" {
  if (status === "FAILED") return "danger";
  if (status === "QUEUED") return "warning";
  if (status === "SENT" || status === "RECEIVED") return "success";
  return "default";
}

function statusLabel(status: MailLogStatus) {
  if (status === "RECEIVED") return "Received";
  if (status === "SENT") return "Sent";
  if (status === "FAILED") return "Failed";
  return "Queued";
}

function LogRow({ entry }: { entry: MailLogEntry }) {
  const to = entry.toAddresses.join(", ") || "—";
  return (
    <article className="min-w-0 px-4 py-3 md:px-6">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <time
          dateTime={entry.createdAt}
          className="text-[12px] text-[var(--muted-foreground)]"
        >
          {formatLogWhen(entry.createdAt)}
        </time>
        <span className="text-[12px] font-medium text-[var(--foreground)]">
          {entry.direction === "INBOUND" ? "In" : "Out"}
        </span>
        <Chip color={statusChipColor(entry.status)} size="sm" variant="soft">
          {statusLabel(entry.status)}
        </Chip>
        <span className="min-w-0 truncate text-[12px] text-[var(--muted-foreground)]" dir="ltr">
          {entry.mailboxAddress}
        </span>
      </div>
      <p className="mt-1 truncate text-sm font-medium text-[var(--foreground)]">
        {entry.subject.trim() || "(no subject)"}
      </p>
      <p className="mt-0.5 truncate text-[12px] text-[var(--muted-foreground)]" dir="ltr">
        {entry.fromAddress} → {to}
      </p>
      {entry.errorMessage ? (
        <p className="mt-1 break-words text-[12px] text-[var(--danger)]">
          {entry.errorMessage}
        </p>
      ) : null}
    </article>
  );
}

export function MailEmailLogsPage() {
  const [appId, setAppId] = useState<string | null>(null);
  const [mailboxes, setMailboxes] = useState<MailMailboxView[]>([]);
  const [logs, setLogs] = useState<MailLogEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [mailboxId, setMailboxId] = useState("");
  const [direction, setDirection] = useState<"" | MailLogDirection>("");
  const [status, setStatus] = useState<"" | MailLogStatus>("");
  const [days, setDays] = useState<MailLogDays>(7);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = readMailAppIdFromDocument();
    if (!id) {
      window.location.assign("/apps?error=app_required");
      return;
    }
    setAppId(id);
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    if (!appId) return;
    let cancelled = false;
    (async () => {
      try {
        const boxes = await listMailMailboxes(appId);
        if (!cancelled) setMailboxes(boxes);
      } catch {
        if (!cancelled) setMailboxes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appId]);

  const mailboxOptions = useMemo<FilterOption[]>(
    () => [
      { value: "", label: "All mailboxes" },
      ...mailboxes.map((box) => ({ value: box.id, label: box.address })),
    ],
    [mailboxes],
  );

  const query = useMemo(
    () => ({
      mailboxId: mailboxId || undefined,
      direction: direction || undefined,
      status: status || undefined,
      q: search || undefined,
      days,
      take: TAKE,
    }),
    [mailboxId, direction, status, search, days],
  );

  const load = useCallback(
    async (id: string, cursor?: string) => {
      const appending = Boolean(cursor);
      if (appending) setLoadingMore(true);
      else setLoading(true);
      try {
        const result = await listMailLogs(id, { ...query, cursor });
        setLogs((prev) => (appending ? [...prev, ...result.logs] : result.logs));
        setNextCursor(result.nextCursor);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load email logs.");
        if (!appending) {
          setLogs([]);
          setNextCursor(null);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query],
  );

  useEffect(() => {
    if (!appId) return;
    void load(appId);
  }, [appId, load]);

  return (
    <section className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Email Logs
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Delivery events for this workspace’s mailboxes. Message contents stay in Inbox.
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-2 rounded-2xl bg-[var(--surface)] p-4 md:px-6">
        <SearchField
          fullWidth
          aria-label="Search logs"
          name="email-logs-search"
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={() => setSearch(searchInput.trim())}
        >
          <SearchField.Group className="h-9 rounded-xl border-0 bg-[var(--field-background)]">
            <SearchField.SearchIcon className="text-[var(--muted-foreground)]" />
            <SearchField.Input
              placeholder="Search from, subject, or mailbox…"
              className="text-sm placeholder:text-[var(--muted-foreground)]"
            />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <LogsFilterDropdown
            label="Mailbox"
            value={mailboxId}
            options={mailboxOptions}
            onChange={setMailboxId}
          />
          <LogsFilterDropdown
            label="Direction"
            value={direction}
            options={[
              { value: "", label: "All directions" },
              { value: "INBOUND", label: "Incoming" },
              { value: "OUTBOUND", label: "Outgoing" },
            ]}
            onChange={(next) => setDirection(next as "" | MailLogDirection)}
          />
          <LogsFilterDropdown
            label="Status"
            value={status}
            options={[
              { value: "", label: "All statuses" },
              { value: "RECEIVED", label: "Received" },
              { value: "SENT", label: "Sent" },
              { value: "FAILED", label: "Failed" },
              { value: "QUEUED", label: "Queued" },
            ]}
            onChange={(next) => setStatus(next as "" | MailLogStatus)}
          />
          <LogsFilterDropdown
            label="Period"
            value={String(days)}
            options={[
              { value: "1", label: "Last 24 hours" },
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
            ]}
            onChange={(next) => {
              const value = Number(next);
              setDays(value === 1 || value === 30 ? value : 7);
            }}
          />
        </div>
      </div>

      {error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Could not load logs</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <section
        className="min-w-0 md:overflow-hidden md:rounded-2xl md:bg-[var(--surface)]"
        aria-label="Email log entries"
      >
        {loading ? (
          <div className="space-y-2 p-4 md:px-6 md:py-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-xl md:rounded-lg" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState className="rounded-2xl bg-[var(--surface)] px-5 py-12 md:rounded-none md:px-6">
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
              <ScrollText className="size-5" aria-hidden />
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
              No email events
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Try a different mailbox, status, or date range.
            </p>
          </EmptyState>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-[var(--border)] rounded-2xl bg-[var(--surface)] md:rounded-none">
              {logs.map((entry) => (
                <LogRow key={entry.id} entry={entry} />
              ))}
            </div>
            {nextCursor && appId ? (
              <div className="px-4 py-3 md:px-6">
                <Button
                  size="sm"
                  variant="tertiary"
                  isDisabled={loadingMore}
                  onPress={() => void load(appId, nextCursor)}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </section>
  );
}
