"use client";

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
import type { InboxMessageRow } from "@/components/inbox/mail-inbox-list-card";

type Props = {
  message: InboxMessageRow | null;
  mailboxAddress: string | null;
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

export function MailInboxReaderCard({
  message,
  mailboxAddress,
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
  if (!message) {
    return (
      <section className="hidden h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[1.25rem] bg-white/70 sm:rounded-[1.5rem] lg:flex dark:bg-[var(--surface)]/70">
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-3xl bg-[var(--brand-blue-soft)] text-[var(--secondary-foreground)]">
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

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)] animate-[inbox-fade_220ms_ease-out] sm:rounded-[1.5rem] dark:bg-[var(--surface)]">
      <div className="flex shrink-0 items-start gap-2.5 border-b border-[var(--separator)] px-2.5 py-3 sm:items-center sm:px-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--foreground)] transition-colors hover:bg-[var(--brand-blue-soft)] lg:hidden"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>

        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue-soft)] text-sm font-semibold text-[var(--secondary-foreground)] sm:mt-0">
          {initials(isOutbound ? replyToLabel : message.from)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
              {isOutbound ? replyToLabel : message.from}
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

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4 sm:px-6">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-3">
          <h1 className="text-[1.3rem] font-semibold leading-snug tracking-tight text-[var(--foreground)] sm:text-[1.4rem]">
            {message.subject}
          </h1>
          <time className="text-xs tabular-nums text-[var(--muted-foreground)]">
            {formatFull(message.receivedAt)}
          </time>
        </div>

        <div className="mt-6 max-w-none whitespace-pre-wrap text-[15px] leading-[1.7] text-[var(--foreground)]/90">
          {message.body || message.preview || "(Empty message)"}
        </div>
      </div>

      <div className="shrink-0 border-t border-[var(--separator)] px-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-3 sm:pb-3">
        <div className="rounded-[1.35rem] bg-[var(--surface-secondary)] p-3.5 sm:rounded-[1.5rem] sm:p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="text-xs text-[var(--muted-foreground)]">To</span>
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-2.5 text-xs font-medium text-[var(--foreground)] dark:bg-[var(--surface)]">
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
            rows={2}
            value={replyBody}
            onChange={(e) => onReplyBodyChange(e.target.value)}
            placeholder="Write a reply…"
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
          />

          <div className="mt-2 flex items-center justify-end gap-2">
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

        <div className="mt-2.5 flex items-center justify-between px-1 pt-0.5 text-xs font-medium text-[var(--muted-foreground)]">
          <button
            type="button"
            onClick={onReply}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
          >
            <CornerUpLeft className="size-3.5" />
            Reply
          </button>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onPrev}
              disabled={!onPrev}
              className="inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] disabled:opacity-30 sm:size-8"
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
              className="inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] disabled:opacity-30 sm:size-8"
              aria-label="Next"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={onForward}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
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
