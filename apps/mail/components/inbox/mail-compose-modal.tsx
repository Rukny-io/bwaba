"use client";

import { useEffect, useId, useState } from "react";
import { Send, X } from "lucide-react";

export type ComposeDraft = {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  replyToMessageId?: string;
};

type Props = {
  open: boolean;
  fromAddress: string | null;
  initial?: ComposeDraft | null;
  sending?: boolean;
  error?: string;
  onClose: () => void;
  onSend: (draft: ComposeDraft) => void | Promise<void>;
};

function parseRecipients(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function MailComposeModal({
  open,
  fromAddress,
  initial,
  sending = false,
  error = "",
  onClose,
  onSend,
}: Props) {
  const titleId = useId();
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTo(initial?.to ?? "");
    setCc(initial?.cc ?? "");
    setSubject(initial?.subject ?? "");
    setBody(initial?.body ?? "");
    setLocalError("");
  }, [open, initial]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const recipients = parseRecipients(to);
    if (recipients.length === 0) {
      setLocalError("Add at least one recipient.");
      return;
    }
    if (!subject.trim()) {
      setLocalError("Subject is required.");
      return;
    }
    if (!body.trim()) {
      setLocalError("Message body is required.");
      return;
    }
    setLocalError("");
    await onSend({
      to: recipients.join(", "),
      cc: cc.trim() || undefined,
      subject: subject.trim(),
      body: body.trim(),
      replyToMessageId: initial?.replyToMessageId,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close compose"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <form
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-xl dark:bg-[var(--surface)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)]/70 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-base font-semibold tracking-tight text-[var(--foreground)]"
            >
              {initial?.replyToMessageId ? "Reply" : "New message"}
            </h2>
            {fromAddress ? (
              <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
                From {fromAddress}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
              To
            </span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-3.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
              Cc
            </span>
            <input
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="Optional"
              className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-3.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
              Subject
            </span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-3.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
              Message
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="Write your message…"
              className="w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-3.5 py-3 text-sm leading-relaxed text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </label>
          {localError || error ? (
            <p className="text-sm text-[var(--danger)]">{localError || error}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)]/70 px-4 py-3.5 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sending || !fromAddress}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
            <Send className="size-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
