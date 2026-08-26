"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CornerUpLeft,
  CornerUpRight,
  MailOpen,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@heroui/react";
import type { InboxMessageRow } from "@/components/inbox/mail-inbox-list-card";
import { MailPersonAvatar } from "@/components/inbox/mail-person-avatar";
import { MailHtmlBody } from "@/components/inbox/mail-html-body";

type Props = {
  message: InboxMessageRow | null;
  mailboxAddress: string | null;
  mailboxAvatarUrl?: string | null;
  index: number;
  total: number;
  replyBody: string;
  onReplyBodyChange: (value: string) => void;
  replySending?: boolean;
  onSendReply?: () => void;
  onBack: () => void;
  onCompose: () => void;
  onReply?: () => void;
  onForward?: () => void;
  onToggleStar?: () => void;
  onTrash?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatFull(iso: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

const glassBtn =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-black/[0.06] hover:text-[var(--foreground)] dark:hover:bg-white/10";

export function MailInboxReaderCard({
  message,
  mailboxAddress,
  mailboxAvatarUrl = null,
  index,
  total,
  replyBody,
  onReplyBodyChange,
  replySending = false,
  onSendReply,
  onBack,
  onCompose,
  onReply,
  onForward,
  onToggleStar,
  onTrash,
  onPrev,
  onNext,
}: Props) {
  const [replyOpen, setReplyOpen] = useState(false);
  const replyFieldRef = useRef<HTMLTextAreaElement>(null);
  const wasSendingRef = useRef(false);
  const messageId = message?.id ?? null;

  useEffect(() => {
    setReplyOpen(false);
  }, [messageId]);

  useEffect(() => {
    if (replyOpen) replyFieldRef.current?.focus();
  }, [replyOpen]);

  useEffect(() => {
    if (wasSendingRef.current && !replySending && !replyBody.trim()) {
      setReplyOpen(false);
    }
    wasSendingRef.current = replySending;
  }, [replySending, replyBody]);

  if (!message) {
    return (
      <section className="hidden h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white/70 lg:flex dark:bg-[var(--surface)]/70">
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--brand-blue-soft)] text-[var(--secondary-foreground)]">
            <MailOpen className="size-6" strokeWidth={1.75} />
          </div>
          <p className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
            Select a message
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
            Pick an email from the list to read it here.
          </p>
          <button
            type="button"
            onClick={onCompose}
            className="mt-6 inline-flex h-10 items-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-95"
          >
            Compose
          </button>
        </div>
      </section>
    );
  }

  const isOutbound =
    Boolean(mailboxAddress) &&
    message.fromEmail.toLowerCase() === mailboxAddress!.toLowerCase();
  const replyToAddress = isOutbound
    ? message.to || message.fromEmail
    : message.fromEmail;
  const replyToLabel = isOutbound
    ? message.to || message.from
    : message.from;
  // Header shows the mailbox identity when you sent it (with your photo).
  const displayName = isOutbound
    ? message.from || mailboxAddress || "Me"
    : message.from;
  const headerAvatarUrl = isOutbound
    ? message.fromAvatarUrl || mailboxAvatarUrl
    : null;

  return (
    <section
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden animate-[inbox-fade_220ms_ease-out]",
        "max-md:rounded-none max-md:bg-transparent max-md:shadow-none",
        "md:rounded-2xl md:bg-white md:shadow-[0_1px_0_rgba(15,23,42,0.03)] dark:md:bg-[var(--surface)]",
      )}
    >
      {/* Mobile: liquid-glass toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 pb-2 pt-1 md:hidden">
        <div className="mail-inbox-toolbar-glass inline-flex min-w-0 max-w-[70%] items-center gap-0.5 p-1">
          <button
            type="button"
            onClick={onBack}
            className={glassBtn}
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <span
            className="mx-0.5 h-5 w-px shrink-0 bg-black/10 dark:bg-white/15"
            aria-hidden
          />
          <span className="flex min-w-0 items-center gap-2 px-1.5 py-1">
            <MailPersonAvatar
              name={displayName}
              email={isOutbound ? replyToAddress : message.fromEmail}
              avatarUrl={headerAvatarUrl}
              className="size-7"
              textClassName="text-[10px]"
            />
            <span className="min-w-0 truncate text-xs font-semibold text-[var(--foreground)]">
              {displayName}
            </span>
          </span>
        </div>

        <div className="mail-inbox-toolbar-glass inline-flex shrink-0 items-center gap-0.5 p-1">
          <button
            type="button"
            onClick={onToggleStar}
            className={glassBtn}
            aria-label="Star"
          >
            <Star
              className={
                message.starred
                  ? "size-4 fill-[var(--warning)] text-[var(--warning)]"
                  : "size-4"
              }
            />
          </button>
          <button
            type="button"
            onClick={onTrash}
            className={glassBtn}
            aria-label="Delete"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Tablet / desktop header */}
      <div className="hidden shrink-0 items-center gap-2.5 border-b border-[var(--separator)] px-4 py-3 md:flex">
        <MailPersonAvatar
          name={displayName}
          email={isOutbound ? replyToAddress : message.fromEmail}
          avatarUrl={headerAvatarUrl}
          className="size-10"
          textClassName="text-sm"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
              {displayName}
            </p>
            <span className="rounded-full bg-[var(--surface-secondary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              {message.folder ?? "INBOX"}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
            {isOutbound
              ? `to ${message.to || replyToAddress}`
              : message.fromEmail}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <IconBtn label="Star" onClick={onToggleStar}>
            <Star
              className={
                message.starred
                  ? "size-4 fill-[var(--warning)] text-[var(--warning)]"
                  : "size-4"
              }
            />
          </IconBtn>
          <IconBtn label="Delete" onClick={onTrash}>
            <Trash2 className="size-4" />
          </IconBtn>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-none px-4 pb-4 pt-3 sm:px-6 md:pt-4">
        <p className="mb-2 truncate text-xs text-[var(--muted-foreground)] md:hidden">
          {isOutbound
            ? `to ${message.to || replyToAddress}`
            : message.fromEmail}
        </p>
        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-3">
          <h1 className="text-[1.25rem] font-semibold leading-snug tracking-tight text-[var(--foreground)] sm:text-[1.4rem]">
            {message.subject}
          </h1>
          <time className="text-xs tabular-nums text-[var(--muted-foreground)]">
            {formatFull(message.receivedAt)}
          </time>
        </div>

        <div className="mt-5 md:mt-6">
          <MailHtmlBody html={message.bodyHtml} text={message.body || message.preview} />
        </div>
      </div>

      <div className="shrink-0 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:border-t md:border-[var(--separator)] md:px-3 md:pb-3 md:pt-2.5">
        {replyOpen ? (
          <div className="mb-2.5 rounded-2xl bg-white/90 p-3.5 backdrop-blur-sm sm:p-4 md:bg-[var(--surface-secondary)] md:backdrop-blur-none dark:bg-[var(--surface)]/90 dark:md:bg-[var(--surface-secondary)]">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="text-xs text-[var(--muted-foreground)]">To</span>
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[var(--surface-secondary)] py-1 pl-1 pr-2.5 text-xs font-medium text-[var(--foreground)] md:bg-white dark:md:bg-[var(--surface)]">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue-soft)] text-[9px] font-bold text-[var(--secondary-foreground)]">
                    {initials(replyToLabel)}
                  </span>
                  <span className="truncate">{replyToAddress}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={onReply}
                className="shrink-0 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                Full compose
              </button>
            </div>

            <textarea
              ref={replyFieldRef}
              rows={3}
              value={replyBody}
              onChange={(e) => onReplyBodyChange(e.target.value)}
              placeholder="Write a reply…"
              className="w-full resize-none bg-transparent text-sm leading-relaxed text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
            />

            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyOpen(false)}
                className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-black/[0.04] hover:text-[var(--foreground)] sm:h-9 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSendReply}
                disabled={replySending || !replyBody.trim()}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] transition-[opacity,transform] hover:opacity-95 active:scale-[0.98] disabled:opacity-50 sm:h-9 sm:px-4"
              >
                {replySending ? "Sending…" : "Send"}
                <Send className="size-3.5" />
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between px-1 pt-0.5 text-xs font-medium text-[var(--muted-foreground)]">
          <button
            type="button"
            onClick={() => setReplyOpen(true)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 transition-colors hover:bg-black/[0.04] hover:text-[var(--foreground)] dark:hover:bg-white/10"
          >
            <CornerUpLeft className="size-3.5" />
            Reply
          </button>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onPrev}
              disabled={!onPrev}
              className="inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-black/[0.04] hover:text-[var(--foreground)] disabled:opacity-30 sm:size-8 dark:hover:bg-white/10"
              aria-label="Previous"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[4.5rem] text-center tabular-nums">
              {Math.max(1, index + 1)} of {Math.max(1, total)}
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              className="inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-black/[0.04] hover:text-[var(--foreground)] disabled:opacity-30 sm:size-8 dark:hover:bg-white/10"
              aria-label="Next"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={onForward}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 transition-colors hover:bg-black/[0.04] hover:text-[var(--foreground)] dark:hover:bg-white/10"
          >
            Forward
            <CornerUpRight className="size-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] md:size-9"
    >
      {children}
    </button>
  );
}
