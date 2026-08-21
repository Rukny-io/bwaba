"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@heroui/react";
import type { InboxFolderId } from "@/components/inbox/mail-inbox-sidebar";
import type { MailMessageFolderApi } from "@/lib/mail-messages-client";

export type InboxMessageRow = {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
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
  onRefresh?: () => void;
  error?: string;
};

function formatWhen(iso: string) {
  try {
    const date = new Date(iso);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${Math.max(1, mins)} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
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

export function MailInboxListCard({
  folder,
  mailboxAddress,
  messages,
  selectedId,
  onSelect,
  search,
  loading = false,
  refreshing = false,
  onRefresh,
  error = "",
}: Props) {
  const unreadCount = messages.filter((m) => m.unread).length;
  const folderLabel = FOLDER_LABELS[folder] ?? folder;

  return (
    <section className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[1.5rem] bg-white lg:w-[320px] xl:w-[360px] dark:bg-[var(--surface)]">
      <div className="shrink-0 space-y-2 px-3 pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
              {folderLabel}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {mailboxAddress
                ? `(${messages.length} Messages${unreadCount ? `, ${unreadCount} Unread` : ""})`
                : "No mailbox selected"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRefresh}
              disabled={!onRefresh || refreshing || !mailboxAddress}
              className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-40"
              aria-label="Refresh"
            >
              <RefreshCw
                className={cn("size-3.5", refreshing && "animate-spin")}
              />
            </button>
          </div>
        </div>
        {search.trim() ? (
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Filtered by “{search.trim()}”
          </p>
        ) : null}
        {error ? (
          <p className="text-xs text-[var(--danger)]">{error}</p>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {!mailboxAddress ? (
          <p className="px-3 py-10 text-center text-sm text-[var(--muted-foreground)]">
            Select a mailbox to load messages.
          </p>
        ) : loading ? (
          <p className="px-3 py-10 text-center text-sm text-[var(--muted-foreground)]">
            Loading messages…
          </p>
        ) : folder === "scheduled" ? (
          <p className="px-3 py-10 text-center text-sm text-[var(--muted-foreground)]">
            Snoozed messages are not available yet.
          </p>
        ) : messages.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-[var(--muted-foreground)]">
            No messages in this folder.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {messages.map((message) => {
              const active = selectedId === message.id;
              return (
                <li key={message.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(message.id)}
                    className={cn(
                      "flex w-full gap-3 rounded-2xl px-2.5 py-3 text-left transition-colors",
                      active
                        ? "bg-[var(--brand-blue-soft)]/70"
                        : "hover:bg-[var(--surface-secondary)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        active
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "bg-[var(--surface-secondary)] text-[var(--foreground)]",
                      )}
                    >
                      {initials(message.from)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm",
                            message.unread
                              ? "font-semibold text-[var(--foreground)]"
                              : "font-medium text-[var(--foreground)]",
                          )}
                        >
                          {message.from}
                        </span>
                        <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">
                          {formatWhen(message.receivedAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-[var(--foreground)]">
                        {message.subject}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">
                        {message.preview}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-1 size-2 shrink-0 rounded-full",
                        message.starred
                          ? "bg-[var(--warning)]"
                          : message.unread
                            ? "bg-[var(--primary)]"
                            : "bg-transparent",
                      )}
                      aria-hidden
                    />
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
