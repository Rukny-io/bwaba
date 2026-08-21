"use client";

import { useMemo } from "react";
import { RefreshCw, Settings2, Star } from "lucide-react";
import { cn } from "@heroui/react";
import type { InboxFolderId } from "@/components/inbox/mail-inbox-sidebar";

export type InboxListFilter = "primary" | "promotions" | "socials";

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
  category?: InboxListFilter;
  tag?: string;
  tagTone?: "blue" | "amber" | "rose" | "emerald";
};

type Props = {
  folder: InboxFolderId;
  mailboxAddress: string | null;
  messages: InboxMessageRow[];
  filter: InboxListFilter;
  onFilterChange: (filter: InboxListFilter) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
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

const FILTERS: { id: InboxListFilter; label: string }[] = [
  { id: "primary", label: "Primary" },
  { id: "promotions", label: "Promotions" },
  { id: "socials", label: "Socials" },
];

const TAG_TONES: Record<NonNullable<InboxMessageRow["tagTone"]>, string> = {
  blue: "bg-[var(--brand-blue-soft)] text-[var(--secondary-foreground)]",
  amber: "bg-amber-100 text-amber-800",
  rose: "bg-rose-100 text-rose-800",
  emerald: "bg-emerald-100 text-emerald-800",
};

export function MailInboxListCard({
  folder,
  mailboxAddress,
  messages,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
  search,
}: Props) {
  const filtered = useMemo(() => {
    let list = messages.filter((m) => (m.category ?? "primary") === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.from.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q) ||
          m.preview.toLowerCase().includes(q),
      );
    }
    return list;
  }, [filter, messages, search]);

  const unreadCount = messages.filter((m) => m.unread).length;
  const folderLabel = folder.charAt(0).toUpperCase() + folder.slice(1);

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
              className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label="Refresh"
            >
              <RefreshCw className="size-3.5" />
            </button>
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label="Filters"
            >
              <Settings2 className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="flex gap-1">
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onFilterChange(item.id)}
                className={cn(
                  "inline-flex h-7 items-center rounded-full px-2.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-[var(--brand-blue-soft)] text-[var(--secondary-foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {!mailboxAddress ? (
          <p className="px-3 py-10 text-center text-sm text-[var(--muted-foreground)]">
            Select a mailbox to load messages.
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-[var(--muted-foreground)]">
            No messages in this view.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((message) => {
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
                      {message.tag ? (
                        <span
                          className={cn(
                            "mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            TAG_TONES[message.tagTone ?? "blue"],
                          )}
                        >
                          {message.tag}
                        </span>
                      ) : null}
                    </span>
                    <Star
                      className={cn(
                        "mt-1 size-3.5 shrink-0",
                        message.starred
                          ? "fill-[var(--warning)] text-[var(--warning)]"
                          : "text-[var(--muted-foreground)]/40",
                      )}
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
