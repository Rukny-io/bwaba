"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  Inbox,
  RefreshCw,
  Star,
} from "lucide-react";
import { cn } from "@heroui/react";
import type { InboxFolderId } from "@/components/inbox/mail-inbox-sidebar";
import { MailSenderBrandAvatar } from "@/components/inbox/mail-sender-brand-avatar";
import type {
  MailMessageAuthentication,
  MailMessageFolderApi,
  MailMessageVerificationType,
  MailSenderBrandView,
} from "@/lib/mail-messages-client";

export type InboxMessageRow = {
  id: string;
  from: string;
  fromEmail: string;
  fromAvatarUrl?: string | null;
  senderDomain?: string | null;
  authentication?: MailMessageAuthentication | null;
  senderBrand?: MailSenderBrandView | null;
  verificationType?: MailMessageVerificationType | null;
  to: string;
  toList?: string[];
  subject: string;
  preview: string;
  body: string;
  bodyHtml?: string | null;
  receivedAt: string;
  unread: boolean;
  starred: boolean;
  folder?: MailMessageFolderApi;
};

const FOLDER_TITLE: Record<InboxFolderId, string> = {
  inbox: "Inbox",
  starred: "Favorites",
  scheduled: "Scheduled",
  sent: "Sent",
  drafts: "Drafts",
  promotions: "Promotions",
  social: "Social",
  spam: "Spam",
  archive: "Archive",
  trash: "Trash",
};

type Props = {
  folder: InboxFolderId;
  mailboxAddress: string | null;
  mailboxAvatarUrl?: string | null;
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
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
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

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
        <Inbox className="size-5" strokeWidth={1.75} />
      </span>
      <p className="text-[13px] text-[var(--muted-foreground)]">{children}</p>
    </div>
  );
}

export function MailInboxListCard({
  folder,
  mailboxAddress,
  mailboxAvatarUrl = null,
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
  page,
  pageCount,
  onPageChange,
}: Props) {
  const safePageCount = Math.max(1, pageCount);
  const safePage = Math.min(Math.max(1, page), safePageCount);
  const unreadInView = messages.filter((m) => m.unread).length;

  return (
    <section className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-r border-[var(--separator)] bg-white dark:bg-[var(--surface)]">
      <div className="flex shrink-0 items-end justify-between gap-3 px-4 pb-2 pt-3 sm:px-4 sm:pt-3.5">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[var(--foreground)]">
            {FOLDER_TITLE[folder]}
          </h2>
          {mailboxAddress ? (
            <p className="mt-0.5 truncate text-[11px] text-[var(--muted-foreground)]">
              {loading
                ? "Loading…"
                : unreadInView > 0
                  ? `${unreadInView} unread`
                  : `${messages.length} message${messages.length === 1 ? "" : "s"}`}
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
              No mailbox selected
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {onImportInbound ? (
            <button
              type="button"
              onClick={onImportInbound}
              disabled={importing || !mailboxAddress}
              className="inline-flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] disabled:opacity-30"
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
            className="inline-flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] disabled:opacity-30"
            aria-label="Refresh"
          >
            <RefreshCw
              className={cn("size-3.5", refreshing && "animate-spin")}
            />
          </button>
        </div>
      </div>

      {error || search.trim() ? (
        <div className="shrink-0 space-y-1 px-4 pb-2">
          {search.trim() ? (
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Filtered by “{search.trim()}”
            </p>
          ) : null}
          {error ? (
            <p className="text-xs text-[var(--danger)]">{error}</p>
          ) : null}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-none px-2 pb-2 sm:px-2.5">
        {!mailboxAddress ? (
          <EmptyState>Select a mailbox to load messages.</EmptyState>
        ) : loading ? (
          <div className="space-y-0.5 px-0.5 py-1">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex gap-3 rounded-2xl px-2.5 py-2.5"
                style={{ opacity: 1 - i * 0.1 }}
              >
                <span className="size-9 shrink-0 animate-pulse rounded-full bg-[var(--surface-secondary)]" />
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
          <ul className="flex flex-col gap-0.5">
            {messages.map((message) => {
              const active = selectedId === message.id;
              const primary = rowPrimaryLabel(
                message,
                folder,
                mailboxAddress,
              );
              const mine = mailboxAddress?.toLowerCase();
              const outbound =
                folder === "sent" ||
                (Boolean(mine) &&
                  message.fromEmail.toLowerCase() === mine);
              return (
                <li key={message.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(message.id)}
                    className={cn(
                      "group relative flex w-full gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors duration-150",
                      active
                        ? "bg-[var(--surface-secondary)]"
                        : "hover:bg-[var(--surface-secondary)]/80 active:bg-[var(--surface-secondary)]",
                    )}
                  >
                    <MailSenderBrandAvatar
                      name={primary}
                      email={outbound ? message.to : message.fromEmail}
                      avatarUrl={
                        outbound
                          ? message.fromAvatarUrl || mailboxAvatarUrl
                          : null
                      }
                      brandLogoUrl={
                        outbound
                          ? null
                          : message.senderBrand?.logoUrl ||
                            message.fromAvatarUrl
                      }
                      brandStatus={
                        outbound ? null : message.senderBrand?.status
                      }
                      authentication={
                        outbound ? null : message.authentication
                      }
                      verificationType={
                        outbound ? null : message.verificationType
                      }
                      className="mt-0.5 size-9"
                      textClassName="text-[11px]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          {message.unread ? (
                            <span
                              className="size-1.5 shrink-0 rounded-full bg-[var(--primary)]"
                              aria-hidden
                            />
                          ) : null}
                          <span
                            className={cn(
                              "truncate text-[13px] leading-tight",
                              message.unread
                                ? "font-semibold text-[var(--foreground)]"
                                : "font-medium text-[var(--foreground)]/85",
                            )}
                          >
                            {primary}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          {message.starred ? (
                            <Star
                              className="size-3 fill-[var(--warning)] text-[var(--warning)]"
                              aria-hidden
                            />
                          ) : null}
                          <span
                            className={cn(
                              "text-[11px] tabular-nums leading-none",
                              message.unread
                                ? "font-medium text-[var(--foreground)]/70"
                                : "text-[var(--muted-foreground)]",
                            )}
                          >
                            {formatWhen(message.receivedAt)}
                          </span>
                        </span>
                      </span>
                      <span
                        className={cn(
                          "mt-1 block truncate text-[13px] leading-snug",
                          message.unread
                            ? "font-medium text-[var(--foreground)]"
                            : "text-[var(--foreground)]/75",
                        )}
                      >
                        {message.subject}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] leading-snug text-[var(--muted-foreground)]">
                        {message.preview}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-1 px-2 py-2 text-xs font-medium text-[var(--muted-foreground)]">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="inline-flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-[4.5rem] text-center tabular-nums">
          {safePage} of {safePageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= safePageCount}
          className="inline-flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  );
}
