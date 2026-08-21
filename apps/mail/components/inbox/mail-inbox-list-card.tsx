"use client";

import { Download, Inbox, RefreshCw } from "lucide-react";
import { cn } from "@heroui/react";
import type { InboxFolderId } from "@/components/inbox/mail-inbox-sidebar";
import type { MailMessageFolderApi } from "@/lib/mail-messages-client";

export type InboxMessageRow = {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  toList?: string[];
  subject: string;
  preview: string;
  body: string;
  receivedAt: string;
  unread: boolean;
  starred: boolean;
  folder?: MailMessageFolderApi;
};

type Props = {
  folder: InboxFolderId;
  mailboxAddress: string | null;
  messages: InboxMessageRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  loading?: boolean;
  refreshing?: boolean;
  importing?: boolean;
  onRefresh?: () => void;
  onImportInbound?: () => void;
  error?: string;
};

function rowPrimaryLabel(
  message: InboxMessageRow,
  folder: InboxFolderId,
  mailboxAddress: string | null,
) {
  const mine = mailboxAddress?.toLowerCase();
  const isOutbound =
    folder === "sent" ||
    (Boolean(mine) && message.fromEmail.toLowerCase() === mine);
  if (isOutbound) {
    return message.to || "To (unknown)";
  }
  return message.from;
}

function formatWhen(iso: string) {
  try {
    const date = new Date(iso);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${Math.max(1, mins)}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    if (hours < 48) return "Yesterday";
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const FOLDER_LABELS: Record<InboxFolderId, string> = {
  inbox: "Inbox",
  starred: "Favorites",
  scheduled: "Snoozed",
  sent: "Sent",
  drafts: "Drafts",
  spam: "Spam",
  archive: "Archive",
  trash: "Trash",
};

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
        <Inbox className="size-5" strokeWidth={1.75} />
      </span>
      <p className="text-sm text-[var(--muted-foreground)]">{children}</p>
    </div>
  );
}

export function MailInboxListCard({
  folder,
  mailboxAddress,
  messages,
  selectedId,
  onSelect,
  search,
  loading = false,
  refreshing = false,
  importing = false,
  onRefresh,
  onImportInbound,
  error = "",
}: Props) {
  const unreadCount = messages.filter((m) => m.unread).length;
  const folderLabel = FOLDER_LABELS[folder] ?? folder;

  return (
    <section className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:rounded-[1.5rem] dark:bg-[var(--surface)]">
      <div className="shrink-0 border-b border-[var(--separator)] px-4 pb-3 pt-3.5 sm:px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-[1.05rem] font-semibold tracking-tight text-[var(--foreground)]">
              {folderLabel}
            </h2>
            <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
              {mailboxAddress
                ? `${messages.length} message${messages.length === 1 ? "" : "s"}${unreadCount ? ` · ${unreadCount} unread` : ""}`
                : "No mailbox selected"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {onImportInbound ? (
              <button
                type="button"
                onClick={onImportInbound}
                disabled={importing || !mailboxAddress}
                className="inline-flex size-9 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] disabled:opacity-40"
                aria-label="Import inbound from S3"
                title="Import inbound from S3"
              >
                <Download
                  className={cn("size-3.5", importing && "animate-pulse")}
                />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onRefresh}
              disabled={!onRefresh || refreshing || !mailboxAddress}
              className="inline-flex size-9 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] disabled:opacity-40"
              aria-label="Refresh"
            >
              <RefreshCw
                className={cn("size-3.5", refreshing && "animate-spin")}
              />
            </button>
          </div>
        </div>
        {search.trim() ? (
          <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
            Filtered by “{search.trim()}”
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5 sm:px-2 sm:py-2">
        {!mailboxAddress ? (
          <EmptyState>Select a mailbox to load messages.</EmptyState>
        ) : loading ? (
          <div className="space-y-1.5 px-1 py-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex gap-3 rounded-2xl px-2.5 py-3"
                style={{ opacity: 1 - i * 0.12 }}
              >
                <span className="size-10 shrink-0 animate-pulse rounded-full bg-[var(--surface-secondary)]" />
                <span className="min-w-0 flex-1 space-y-2 py-0.5">
                  <span className="block h-3 w-2/5 animate-pulse rounded-full bg-[var(--surface-secondary)]" />
                  <span className="block h-3 w-4/5 animate-pulse rounded-full bg-[var(--surface-secondary)]" />
                  <span className="block h-2.5 w-3/5 animate-pulse rounded-full bg-[var(--surface-secondary)]" />
                </span>
              </div>
            ))}
          </div>
        ) : folder === "scheduled" ? (
          <EmptyState>Snoozed messages are not available yet.</EmptyState>
        ) : messages.length === 0 ? (
          <EmptyState>No messages in this folder.</EmptyState>
        ) : (
          <ul className="space-y-0.5">
            {messages.map((message) => {
              const active = selectedId === message.id;
              const primary = rowPrimaryLabel(
                message,
                folder,
                mailboxAddress,
              );
              return (
                <li key={message.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(message.id)}
                    className={cn(
                      "group relative flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition-[background-color,transform] duration-150 md:px-2.5 md:py-2.5",
                      active
                        ? "bg-[var(--brand-blue-soft)]/80"
                        : "hover:bg-[var(--surface-secondary)] active:scale-[0.995]",
                    )}
                  >
                    {message.unread && !active ? (
                      <span
                        className="absolute left-1 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-[var(--primary)] md:left-0.5"
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                        active
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "bg-[var(--surface-secondary)] text-[var(--foreground)] group-hover:bg-white dark:group-hover:bg-[var(--surface-tertiary)]",
                      )}
                    >
                      {initials(primary)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-[13px]",
                            message.unread
                              ? "font-semibold text-[var(--foreground)]"
                              : "font-medium text-[var(--foreground)]/90",
                          )}
                        >
                          {primary}
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-[var(--muted-foreground)]">
                          {formatWhen(message.receivedAt)}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block truncate text-[13px]",
                          message.unread
                            ? "font-medium text-[var(--foreground)]"
                            : "text-[var(--foreground)]/80",
                        )}
                      >
                        {message.subject}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">
                        {message.preview}
                      </span>
                    </span>
                    {message.starred ? (
                      <span
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--warning)]"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
