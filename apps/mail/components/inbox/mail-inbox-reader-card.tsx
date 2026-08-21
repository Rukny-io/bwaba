"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CornerUpLeft,
  CornerUpRight,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Link2,
  Paperclip,
  Plus,
  Reply,
  Send,
  Smile,
  Star,
  Trash2,
  Type,
  Video,
  X,
} from "lucide-react";
import type { InboxMessageRow } from "@/components/inbox/mail-inbox-list-card";

type Props = {
  message: InboxMessageRow | null;
  mailboxAddress: string | null;
  index: number;
  total: number;
  onBack: () => void;
  onCompose: () => void;
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
  onBack,
  onCompose,
  onPrev,
  onNext,
}: Props) {
  if (!message) {
    return (
      <section className="hidden h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent lg:flex">
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-3xl bg-white/80 text-[var(--primary)] dark:bg-[var(--surface)]">
            <Reply className="size-6" strokeWidth={1.75} />
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
            className="mt-6 inline-flex h-10 items-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)]"
          >
            Compose
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
      {/* Header — sits on gray stage */}
      <div className="flex shrink-0 items-center gap-3 px-2 py-2.5 sm:px-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--foreground)] dark:bg-[var(--surface)]"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>

        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue-soft)] text-sm font-semibold text-[var(--secondary-foreground)]">
          {initials(message.from)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
              {message.from}
            </p>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)] dark:bg-[var(--surface)]">
              Inbox
            </span>
          </div>
          <button
            type="button"
            className="mt-0.5 inline-flex items-center gap-0.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            to me
            <ChevronDown className="size-3" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <IconBtn label="Star">
            <Star
              className={
                message.starred
                  ? "size-4 fill-[var(--warning)] text-[var(--warning)]"
                  : "size-4"
              }
            />
          </IconBtn>
          <IconBtn label="Snooze">
            <Clock className="size-4" />
          </IconBtn>
          <IconBtn label="Delete">
            <Trash2 className="size-4" />
          </IconBtn>
        </div>
      </div>

      {/* Body on gray */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 sm:px-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-[1.35rem]">
            {message.subject}
          </h1>
          <time className="text-xs text-[var(--muted-foreground)]">
            {formatFull(message.receivedAt)}
          </time>
        </div>

        <div className="mt-5 max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--foreground)]">
          {message.body}
        </div>

        <div className="mt-6 border-t border-dashed border-[var(--primary)]/35" />

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            "Thanks, got it.",
            "I'll follow up soon.",
            "Please send more details.",
          ].map((label) => (
            <button
              key={label}
              type="button"
              onClick={onCompose}
              className="rounded-full border border-[var(--primary)]/35 bg-white px-3.5 py-2 text-xs font-medium text-[var(--secondary-foreground)] hover:bg-[var(--brand-blue-soft)] dark:bg-[var(--surface)]"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <AttachmentChip icon={FileSpreadsheet} name="DKIM-report.xlsx" size="48 KB" />
          <AttachmentChip icon={FileText} name="Mailbox-setup.docx" size="92 KB" />
          <AttachmentChip icon={Video} name="Team sync" size="Meet" />
        </div>
      </div>

      {/* White reply card only */}
      <div className="shrink-0 px-2 pb-1 sm:px-3">
        <div className="rounded-[1.75rem] bg-white p-3.5 sm:p-4 dark:bg-[var(--surface)]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="text-xs text-[var(--muted-foreground)]">To</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f1f3] py-1 pl-1 pr-2.5 text-xs font-medium text-[var(--foreground)] dark:bg-[var(--surface-secondary)]">
                <span className="flex size-5 items-center justify-center rounded-full bg-[var(--brand-blue-soft)] text-[9px] font-bold text-[var(--secondary-foreground)]">
                  {initials(message.from)}
                </span>
                {message.from}
                <X className="size-3 opacity-45" aria-hidden />
              </span>
            </div>
            <span className="shrink-0 text-xs font-medium text-[var(--muted-foreground)]">
              Cc · Bcc
            </span>
          </div>

          <textarea
            rows={2}
            placeholder="Write a reply…"
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
            disabled
          />

          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-0.5 text-[var(--muted-foreground)]">
              <IconBtn label="Emoji">
                <Smile className="size-4" />
              </IconBtn>
              <IconBtn label="Attach">
                <Paperclip className="size-4" />
              </IconBtn>
              <IconBtn label="Link">
                <Link2 className="size-4" />
              </IconBtn>
              <IconBtn label="Format">
                <Type className="size-4" />
              </IconBtn>
              <IconBtn label="Image">
                <ImageIcon className="size-4" />
              </IconBtn>
              <IconBtn label="More">
                <Plus className="size-4" />
              </IconBtn>
            </div>
            <button
              type="button"
              onClick={onCompose}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)]"
            >
              Send
              <Send className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-[var(--border)]/60 px-1 pt-2 text-xs font-medium text-[var(--muted-foreground)]">
          <button
            type="button"
            onClick={onCompose}
            className="inline-flex items-center gap-1.5 hover:text-[var(--foreground)]"
          >
            <CornerUpLeft className="size-3.5" />
            Reply
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrev}
              disabled={!onPrev}
              className="inline-flex size-7 items-center justify-center rounded-full hover:bg-white/80 disabled:opacity-30 dark:hover:bg-[var(--surface)]"
              aria-label="Previous"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="tabular-nums">
              {Math.max(1, index + 1)} of {Math.max(1, total)}
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              className="inline-flex size-7 items-center justify-center rounded-full hover:bg-white/80 disabled:opacity-30 dark:hover:bg-[var(--surface)]"
              aria-label="Next"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={onCompose}
            className="inline-flex items-center gap-1.5 hover:text-[var(--foreground)]"
          >
            Forward
            <CornerUpRight className="size-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function AttachmentChip({
  icon: Icon,
  name,
  size,
}: {
  icon: typeof FileText;
  name: string;
  size: string;
}) {
  return (
    <div className="inline-flex min-w-[9.5rem] items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 dark:bg-[var(--surface)]">
      <Icon className="size-5 shrink-0 text-[var(--primary)]" />
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-[var(--foreground)]">{name}</p>
        <p className="text-[10px] text-[var(--muted-foreground)]">{size}</p>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-xl text-[var(--muted-foreground)] hover:bg-[#e8eaed] hover:text-[var(--foreground)] dark:hover:bg-[var(--surface-secondary)]"
    >
      {children}
    </button>
  );
}
